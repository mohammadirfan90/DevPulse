import type { Request, Response, NextFunction } from "express";
import type { ROLES } from "../types";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";

const auth = (...roles: ROLES[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // console.log("Auth middleware executed with roles:", roles);

    const token = req.headers.authorization;
    if (!token) {
      throw new AppError("Unauthorized: No token provided", 401);
    }

    const decoded = jwt.verify(
      token,
      config.jwt_secret as string,
    ) as JwtPayload;

    const userData = await pool.query(
      `
        SELECT id, name, email, role FROM users WHERE id = $1
      `,
      [decoded.id],
    );
    const user = userData.rows[0];

    if (!user) {
      throw new AppError("Unauthorized: User not found", 401);
    }

    if (roles.length && !roles.includes(user.role)) {
      throw new AppError(
        "Forbidden: You do not have the required permissions to access this resource",
        403,
      );
    }

    req.user = user;
    next();
  });
};

export default auth;
