function errorMiddleware(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain valid JSON.'
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body is too large.'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
}

module.exports = errorMiddleware;
