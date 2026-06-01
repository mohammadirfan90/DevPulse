import { pool } from "../../db";
import { AppError } from "../../utils/appError";
import type { IUser } from "./auth.interface";
import bcrypt from "bcrypt";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../../config";

const createUserIntoDb = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  const existingUser = await pool.query(
    "SELECT id FROM users WHERE email = $1",
    [email],
  );

  if (existingUser.rows.length > 0) {
    throw new AppError("Email already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, email, hashedPassword, role],
  );
  delete result.rows[0].password;
  return result.rows[0];
};

const loginUserFromDb = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (userResult.rows.length === 0) {
    throw new AppError("User not found", 401);
  }

  const user = userResult.rows[0];
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new AppError("Incorrect password", 401);
  }

  // Generate token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accessToken = jwt.sign(jwtPayload, config.jwt_secret, {
    expiresIn: "1d",
  });
  const refreshToken = jwt.sign(jwtPayload, config.jwt_secret, {
    expiresIn: "7d",
  });
  delete user.password;
  return { user, accessToken, refreshToken };
};

const generateFreshToken = async (token: string) => {
  if (!token) {
    throw new AppError("Unauthorized: No token provided", 401);
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, config.jwt_secret as string) as JwtPayload;
  } catch (error) {
    throw new AppError("Unauthorized: Invalid token", 401);
  }

  const userData = await pool.query(
    `
      SELECT * FROM users WHERE email = $1
    `,
    [decoded.email],
  );
  const user = userData.rows[0];
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = jwt.sign(jwtPayload, config.jwt_secret, {
    expiresIn: "1d",
  });
  return newAccessToken;
};
export const authService = {
  createUserIntoDb,
  loginUserFromDb,
  generateFreshToken,
};
