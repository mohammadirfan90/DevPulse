import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/appError";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: string = "Something went wrong";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
