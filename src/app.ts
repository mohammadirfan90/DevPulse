import express, { type Application } from "express";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { AppError } from "./utils/appError";
import cors from "cors";
import { authRoutes } from "./modules/auth/auth.route";
import cookieParser from "cookie-parser";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.use(globalErrorHandler);

export default app;
