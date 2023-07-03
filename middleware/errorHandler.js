const ErrorResponse = require('../utils/ErrorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };

  error.message = err.message;

  // Log to console for dev
  // console.log(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new ErrorResponse('Invalid token, Please Login again', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new ErrorResponse('Your token has expired, Please login again', 401);
  }

  // console.log(err);

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Something went wrong !'
  });

};

module.exports = errorHandler;
