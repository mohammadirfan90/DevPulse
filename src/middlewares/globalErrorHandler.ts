import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/appError";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  console.error("Error caught by global error handler:", err);
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: string = "Something went wrong";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.message;
  }

  else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Unauthorized: You are not allowed to access this resource";
    errors = err.message;
  }
  else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Unauthorized: Your session has expired";
    errors = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
