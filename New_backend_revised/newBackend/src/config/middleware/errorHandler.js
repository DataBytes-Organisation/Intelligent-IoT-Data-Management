module.exports = (err, req, res, next) => {
  console.error('Unhandled error:', err);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
