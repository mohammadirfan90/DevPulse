import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import { AppError } from "../../utils/appError";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  const result = await authService.createUserIntoDb(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result,
  });
  //
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
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
