module.exports = (req, res, next) => {
  const t0 = Date.now();
  res.on('finish', () => {
    console.log(
      new Date().toISOString(),
      req.method,
      req.originalUrl,
      res.statusCode,
      (Date.now() - t0) + 'ms'
    );
  });
  next();
};
