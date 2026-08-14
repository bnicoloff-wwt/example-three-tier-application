/**
 * Global error handler middleware for Express
 * Catches all errors and returns a consistent JSON response
 */
const errorHandler = (err, _req, res, _next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Determine status code
  const status = err.status || err.statusCode || 500;

  // Prepare error response
  const response = {
    error: err.message || 'Internal server error',
    status,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
};

module.exports = errorHandler;
