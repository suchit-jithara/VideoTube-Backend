// errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.log(err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    statusCode,
    success: false,
    message,
    stack: err.stack // Include stack trace in development
  });
};

export default errorHandler;
