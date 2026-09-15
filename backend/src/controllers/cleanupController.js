const db = require('../db');

/**
 * Triggers the database stored procedure to purge datasets deleted >= 15 days ago.
 */
async function handleDatasetCleanup(req, res) {
  try {
    const result = await db.query('SELECT * FROM purge_expired_datasets();');
    
    return res.status(200).json({
      status: 'success',
      message: 'Dataset cleanup executed successfully.',
      purgedCount: result.rowCount,
      purgedDatasets: result.rows
    });
  } catch (error) {
    console.error('Cleanup API Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to execute dataset cleanup.',
      error: error.message
    });
  }
}

module.exports = { handleDatasetCleanup };