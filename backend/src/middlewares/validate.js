export const validate = (schema) => (req, res, next) => {
  try {
    const validated = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers
    });
    req.validated = validated;
    next();
  } catch (err) {
    next(err);
  }
};
