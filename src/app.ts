import express, { type Application } from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { AppError } from "./utils/appError";

const app: Application = express();

app.use(express.json());

app.use("*", (req, res, next) => {
  next(new AppError("Route not found", 404));
});
app.use(globalErrorHandler);

export default app;
