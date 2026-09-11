/**
 * DATASET REPOSITORY
 * -------------------
 * Handles all database operations related to dataset metadata.
 *
 * Responsibilities:
 *   - Fetch all datasets
 *   - Fetch a dataset by ID
 *   - Insert a new dataset
 *
 * This repository does NOT interact with time‑series rows.
 */

const db = require('../db/pool'); // pg Pool instance
const repositoryError = (code, status, message) =>
  Object.assign(new Error(message), { code, status });

class DatasetRepository {
  async findAll() {
    const result = await db.query(`
      SELECT
        d.id,
        d.name,
        COUNT(t.entry_id)::integer AS "totalRows",
        d.created_by AS "createdBy",
        d.updated_by AS "updatedBy",
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt"
      FROM datasets d
      LEFT JOIN timeseries t ON t.dataset_id = d.id
      GROUP BY d.id, d.name, d.created_by, d.updated_by, d.created_at, d.updated_at
      ORDER BY d.id ASC
    `);
    return result.rows;
  }

  async findById(id) {
    const result = await db.query(
      `
      SELECT
        d.id,
        d.name,
        d.description,
        d.timestamp_field AS "timestampField",
        d.created_by AS "createdBy",
        d.updated_by AS "updatedBy",
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt",
        (
          SELECT COUNT(*)::integer
          FROM timeseries t
          WHERE t.dataset_id = d.id
        ) AS "totalRows",
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'sourceField', m.source_field,
                'storageField', m.storage_field,
                'sourceDataType', m.source_data_type,
                'displayName', m.display_name
              )
              ORDER BY m.storage_field
            )
            FROM dataset_field_mappings m
            WHERE m.dataset_id = d.id
          ),
          '[]'::json
        ) AS mappings
      FROM datasets d
      WHERE d.id = $1
      `,
      [id]
    );
    return result.rows[0] || null;
  }

  async findByName(name) {
    const result = await db.query(
      `
      SELECT id, name, created_by AS "createdBy", updated_by AS "updatedBy",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM datasets
      WHERE name = $1
      `,
      [name]
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const { name } = data;

    const result = await db.query(
      `
      INSERT INTO datasets (name)
      VALUES ($1)
      RETURNING id, name
      `,
      [name]
    );

    return result.rows[0];
  }

  /**
   * Inserts a user-owned dataset, its saved UI mappings, and its mapped CSV
   * values as one database transaction. A failed row cannot leave a partial
   * dataset visible to the dashboard.
   */
  async createWithMappingsAndRows({
    name,
    description,
    timestampField,
    mappings,
    wideRows,
    userId,
  }) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const datasetResult = await client.query(
        `INSERT INTO datasets (name, description, timestamp_field, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $4)
         RETURNING id, name, description, timestamp_field AS "timestampField",
                   created_by AS "createdBy", updated_by AS "updatedBy",
                   created_at AS "createdAt", updated_at AS "updatedAt"`,
        [name, description || null, timestampField, userId],
      );
      const dataset = datasetResult.rows[0];

      for (const mapping of mappings) {
        await client.query(
          `INSERT INTO dataset_field_mappings
             (dataset_id, source_field, storage_field, source_data_type, display_name, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $6)`,
          [dataset.id, mapping.sourceField, mapping.storageField, mapping.sourceDataType, mapping.displayName, userId],
        );
      }

      for (const row of wideRows) {
        const storageFields = Object.keys(row).filter((key) => key.startsWith("field"));
        const columns = ["dataset_id", "created_at", "entry_id", ...storageFields];
        const values = [
          dataset.id,
          row.createdAt,
          row.entryId,
          ...storageFields.map((field) => row[field]),
        ];
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        await client.query(
          `INSERT INTO timeseries (${columns.join(", ")}) VALUES (${placeholders})`,
          values,
        );
      }

      await client.query("COMMIT");
      return {
        ...dataset,
        mappings,
        importedRowCount: wideRows.length,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async replaceMappingsAndAddRows(datasetId, { description, timestampField, mappings, wideRows, user }) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const datasetResult = await client.query(
        `SELECT id, created_by AS "createdBy"
         FROM datasets WHERE id = $1 FOR UPDATE`,
        [datasetId],
      );
      const dataset = datasetResult.rows[0];
      if (!dataset)
        throw repositoryError("DATASET_NOT_FOUND", 404, "Dataset not found.");
      if (dataset.createdBy !== user.sub && user.role !== "admin")
        throw repositoryError("FORBIDDEN", 403, "You cannot update this dataset.");

      await client.query(`DELETE FROM dataset_field_mappings WHERE dataset_id = $1`, [datasetId]);
      for (const mapping of mappings) {
        await client.query(
          `INSERT INTO dataset_field_mappings
             (dataset_id, source_field, storage_field, source_data_type, display_name, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $6)`,
          [datasetId, mapping.sourceField, mapping.storageField, mapping.sourceDataType, mapping.displayName, user.sub],
        );
      }

      const maxEntryResult = await client.query(
        `SELECT COALESCE(MAX(entry_id), 0)::integer AS "maxEntryId"
         FROM timeseries WHERE dataset_id = $1`,
        [datasetId],
      );
      const maxEntryId = maxEntryResult.rows[0].maxEntryId;
      for (const [index, row] of wideRows.entries()) {
        const storageFields = Object.keys(row).filter((key) => key.startsWith("field"));
        const columns = ["dataset_id", "created_at", "entry_id", ...storageFields];
        const values = [datasetId, row.createdAt, maxEntryId + index + 1, ...storageFields.map((field) => row[field])];
        const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
        await client.query(
          `INSERT INTO timeseries (${columns.join(", ")}) VALUES (${placeholders})`,
          values,
        );
      }

      const updatedResult = await client.query(
        `UPDATE datasets
         SET description = COALESCE($2, description), timestamp_field = $3,
             updated_by = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, description, timestamp_field AS "timestampField",
                   updated_by AS "updatedBy", updated_at AS "updatedAt"`,
        [datasetId, description, timestampField, user.sub],
      );
      await client.query("COMMIT");
      return {
        ...updatedResult.rows[0],
        updatedMappingCount: mappings.length,
        addedRowCount: wideRows.length,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new DatasetRepository();
