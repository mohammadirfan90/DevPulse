import type { Response } from "express";

type TErrorResponse = {
  statusCode: number;
  success: boolean;
  message: string;
  error?: string | "unknown error";
};

const sendError = (res: Response, data: TErrorResponse) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    error: data.error,
  });
};

export default sendError;
