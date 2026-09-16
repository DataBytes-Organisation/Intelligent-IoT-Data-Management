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

const db = require("../db/pool"); // pg Pool instance
const repositoryError = (code, status, message) =>
  Object.assign(new Error(message), { code, status });

class DatasetRepository {
  async findAll(status, userId, thingspeakOwnerId) {
    const whereClause =
      status === "deleted"
        ? "d.deleted_at IS NOT NULL AND d.deleted_at > CURRENT_TIMESTAMP - INTERVAL '15 days'"
        : "d.deleted_at IS NULL";

    const result = await db.query(
      `
      SELECT
        d.id,
        d.name,
        COUNT(t.entry_id)::integer AS "totalRows",
        d.created_by AS "createdBy",
        d.updated_by AS "updatedBy",
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt",
        d.deleted_at AS "deletedAt"
      FROM datasets d
      LEFT JOIN timeseries t ON t.dataset_id = d.id
      WHERE ${whereClause}
        AND (d.created_by = $1 OR d.created_by = $2)
      GROUP BY d.id, d.name, d.created_by, d.updated_by, d.created_at, d.updated_at, d.deleted_at
      ORDER BY d.id ASC
    `,
      [userId, thingspeakOwnerId],
    );

    return result.rows.map((row) => {
      if (status !== "deleted") return row;
      const { deletedAt, ...rest } = row;
      const recoveryExpiresAt = new Date(
        new Date(deletedAt).getTime() + 15 * 86400000,
      );
      const remainingMs = recoveryExpiresAt.getTime() - Date.now();
      return {
        ...rest,
        deletedAt,
        recoveryExpiresAt: recoveryExpiresAt.toISOString(),
        remainingRecoveryDays: Math.max(0, Math.floor(remainingMs / 86400000)),
      };
    });
  }

  async findById(id, userId, thingspeakOwnerId) {
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
        AND d.deleted_at IS NULL
        AND (d.created_by = $2 OR d.created_by = $3)
      `,
      [id, userId, thingspeakOwnerId],
    );
    return result.rows[0] || null;
  }

  async findByName(name, userId) {
    const result = await db.query(
      `
      SELECT id, name, created_by AS "createdBy", updated_by AS "updatedBy",
             created_at AS "createdAt", updated_at AS "updatedAt"
      FROM datasets
      WHERE name = $1
        AND created_by = $2
        AND deleted_at IS NULL
      `,
      [name, userId],
    );
    return result.rows[0] || null;
  }

  async create(data) {
    const { name, userId } = data;

    const result = await db.query(
      `
      INSERT INTO datasets (name, created_by, updated_by)
      VALUES ($1, $2, $2)
      RETURNING id, name, created_by AS "createdBy", updated_by AS "updatedBy"
      `,
      [name, userId],
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
          [
            dataset.id,
            mapping.sourceField,
            mapping.storageField,
            mapping.sourceDataType,
            mapping.displayName,
            userId,
          ],
        );
      }

      for (const row of wideRows) {
        const storageFields = Object.keys(row).filter((key) =>
          key.startsWith("field"),
        );
        const columns = [
          "dataset_id",
          "created_at",
          "entry_id",
          ...storageFields,
        ];
        const values = [
          dataset.id,
          row.createdAt,
          row.entryId,
          ...storageFields.map((field) => row[field]),
        ];
        const placeholders = columns
          .map((_, index) => `$${index + 1}`)
          .join(", ");
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

  async replaceMappingsAndAddRows(
    datasetId,
    { description, timestampField, mappings, wideRows, user },
  ) {
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
        throw repositoryError(
          "FORBIDDEN",
          403,
          "You cannot update this dataset.",
        );

      await client.query(
        `DELETE FROM dataset_field_mappings WHERE dataset_id = $1`,
        [datasetId],
      );
      for (const mapping of mappings) {
        await client.query(
          `INSERT INTO dataset_field_mappings
             (dataset_id, source_field, storage_field, source_data_type, display_name, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $6)`,
          [
            datasetId,
            mapping.sourceField,
            mapping.storageField,
            mapping.sourceDataType,
            mapping.displayName,
            user.sub,
          ],
        );
      }

      const maxEntryResult = await client.query(
        `SELECT COALESCE(MAX(entry_id), 0)::integer AS "maxEntryId"
         FROM timeseries WHERE dataset_id = $1`,
        [datasetId],
      );
      const maxEntryId = maxEntryResult.rows[0].maxEntryId;
      for (const [index, row] of wideRows.entries()) {
        const storageFields = Object.keys(row).filter((key) =>
          key.startsWith("field"),
        );
        const columns = [
          "dataset_id",
          "created_at",
          "entry_id",
          ...storageFields,
        ];
        const values = [
          datasetId,
          row.createdAt,
          maxEntryId + index + 1,
          ...storageFields.map((field) => row[field]),
        ];
        const placeholders = columns
          .map((_, index) => `$${index + 1}`)
          .join(", ");
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

  async deleteDataset(datasetId, user, thingspeakOwnerId) {
    const client = await db.connect();
    try {
      await client.query("BEGIN");
      const datasetResult = await client.query(
        `SELECT id, name, description, timestamp_field AS "timestampField",
                created_by AS "createdBy", deleted_at AS "deletedAt"
         FROM datasets
         WHERE id = $1
           AND created_by = $2
           AND created_by <> $3
         FOR UPDATE`,
        [datasetId, user.sub, thingspeakOwnerId],
      );
      const dataset = datasetResult.rows[0];
      if (!dataset)
        throw repositoryError("DATASET_NOT_FOUND", 404, "Dataset not found.");
      if (dataset.deletedAt)
        throw repositoryError(
          "DATASET_ALREADY_DELETED",
          409,
          "Dataset has already been deleted.",
        );

      const wideDeleteResult = await client.query(
        `DELETE FROM timeseries WHERE dataset_id = $1`,
        [datasetId],
      );
      const longDeleteResult = await client.query(
        `DELETE FROM timeseries_long WHERE dataset_id = $1`,
        [datasetId],
      );

      const deletedResult = await client.query(
        `UPDATE datasets
         SET deleted_at = CURRENT_TIMESTAMP,
             deleted_by = $2,
             data_deleted_at = CURRENT_TIMESTAMP,
             updated_by = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, name, description, timestamp_field AS "timestampField",
                   deleted_at AS "deletedAt", deleted_by AS "deletedBy",
                   data_deleted_at AS "dataDeletedAt", updated_at AS "updatedAt"`,
        [datasetId, user.sub],
      );

      await client.query("COMMIT");
      return {
        ...deletedResult.rows[0],
        deletedRows: {
          timeseries: wideDeleteResult.rowCount,
          timeseriesLong: longDeleteResult.rowCount,
        },
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
