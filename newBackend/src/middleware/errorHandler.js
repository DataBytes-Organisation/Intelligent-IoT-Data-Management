const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      code: 'database_error',
      message: 'Database connection failed'
    });
  }

  // PostgreSQL errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      code: 'data_validation_error',
      message: 'Data validation failed'
    });
  }

  // Default server error
  res.status(500).json({
    code: 'internal_error',
    message: 'Internal server error'
  });
};

module.exports = errorHandler;