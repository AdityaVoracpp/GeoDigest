/**
 * Global Express error handler.
 * Must have exactly 4 parameters so Express recognises it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error('[error]', err.message);

  if (err.response) {
    // Axios upstream error
    console.error('[error] upstream status:', err.response.status);
    console.error('[error] upstream body:', err.response.data);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    msg: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
