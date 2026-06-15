import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import { AppError } from "../../utils/appError";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    throw new AppError("Name is required and must be a non-empty string", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email)) {
    throw new AppError("A valid email is required", 400);
  }

  if (!password || typeof password !== "string" || password.trim() === "") {
    throw new AppError("Password is required and must be a non-empty string", 400);
  }

  if (role !== undefined && role !== "contributor" && role !== "maintainer") {
    throw new AppError("Role must be either 'contributor' or 'maintainer'", 400);
  }

  const result = await authService.createUserIntoDb(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User registered successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || typeof email !== "string" || email.trim() === "") {
    throw new AppError("Email is required", 400);
  }

  if (!password || typeof password !== "string" || password.trim() === "") {
    throw new AppError("Password is required", 400);
  }

  const result = await authService.loginUserFromDb(req.body);
  const { user, accessToken, refreshToken } = result;
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Login successful",
    data: {
      token: accessToken,
      user,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    throw new AppError("Unauthorized: No refresh token provided", 401);
  }

  const newAccessToken = await authService.generateFreshToken(
    req.cookies.refreshToken,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access token refreshed successfully",
    data: {
      token: newAccessToken,
    },
  });
});

export const authController = {
  createUser,
  loginUser,
  refreshToken,
};
