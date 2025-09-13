// reusable request validation middleware powered by Zod

const validateRequest = ({ params, query, body }) => {
  return (req, res, next) => {
    try {
      if (params) {
        req.validatedParams = params.parse(req.params);
      }
      if (query) {
        req.validatedQuery = query.parse(req.query);
      }
      if (body) {
        req.validatedBody = body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err && err.errors) {
        return res.status(400).json({
          error: 'ValidationError',
          issues: err.errors.map(e => ({ path: e.path, message: e.message }))
        });
      }
      return res.status(400).json({ error: 'Invalid request' });
    }
  };
};

module.exports = { validateRequest };


