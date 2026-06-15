import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { issuesService } from "./issues.service";
import type { Request, Response } from "express";
import { AppError } from "../../utils/appError";
import type { IIssue } from "./issue.interface";

const createIssue = catchAsync(async (req: Request, res: Response) => {
  const { title, description, type } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "" || title.length > 150) {
    throw new AppError("Title is required and must be a string of maximum 150 characters", 400);
  }

  if (!description || typeof description !== "string" || description.length < 20) {
    throw new AppError("Description is required and must be a string of minimum 20 characters", 400);
  }

  if (type !== "bug" && type !== "feature_request") {
    throw new AppError("Type must be either 'bug' or 'feature_request'", 400);
  }

  const user = req.user;

  const result = await issuesService.createIssueIntoDb({
    title,
    description,
    status: "open",
    createdBy: user?.id as string,
    type,
  });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Issue created successfully",
    data: result,
  });
});

const getAllIssues = catchAsync(async (req: Request, res: Response) => {
  const { sort, type, status } = req.query;

  if (sort !== undefined && sort !== "newest" && sort !== "oldest") {
    throw new AppError("Sort must be either 'newest' or 'oldest'", 400);
  }

  if (type !== undefined && type !== "bug" && type !== "feature_request") {
    throw new AppError("Type must be either 'bug' or 'feature_request'", 400);
  }

  if (status !== undefined && status !== "open" && status !== "in_progress" && status !== "resolved") {
    throw new AppError("Status must be one of 'open', 'in_progress', 'resolved'", 400);
  }

  const result = await issuesService.getAllIssuesFromDb({
    sort: sort as string,
    type: type as string,
    status: status as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Issues retrived successfully",
    data: result,
  });
});

const getIssueById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await issuesService.getIssueWithReporterByIdFromDb(id as string);
  
  if (!result) {
    throw new AppError("Issue not found", 404);
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Issue retrived successfully",
    data: result,
  });
});

const updateIssue = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user;

  // 1. Fetch the issue to perform checks
  const existingIssue = await issuesService.getIssueByIdFromDb(id as string);
  if (!existingIssue) {
    throw new AppError("Issue not found", 404);
  }

  // 2. Validate and verify permissions
  const role = user?.role;
  const userId = user?.id;

  if (role === "contributor") {
    // Check ownership: reporter_id must match logged-in contributor's id
    if (Number(existingIssue.reporter_id) !== Number(userId)) {
      throw new AppError(
        "You do not have permission to update this issue",
        403,
      );
    }

    // Check issue status: only "open" issues can be updated by contributor
    if (existingIssue.status !== "open") {
      throw new AppError(
        "Only open issues can be updated by contributors",
        409,
      );
    }

    // Contributors are not allowed to update status
    if (
      req.body.status !== undefined &&
      req.body.status !== existingIssue.status
    ) {
      throw new AppError("Contributors cannot update issue status", 403);
    }
  }

  // 3. Extract and validate fields to update
  const payload: Partial<IIssue> = {};

  if (req.body.title !== undefined) {
    const title = req.body.title;
    if (
      typeof title !== "string" ||
      title.trim() === "" ||
      title.length > 150
    ) {
      throw new AppError(
        "Title must be a string and maximum 150 characters",
        400,
      );
    }
    payload.title = title;
  }

  if (req.body.description !== undefined) {
    const description = req.body.description;
    if (typeof description !== "string" || description.length < 20) {
      throw new AppError(
        "Description must be a string and minimum 20 characters",
        400,
      );
    }
    payload.description = description;
  }

  if (req.body.type !== undefined) {
    const type = req.body.type;
    if (type !== "bug" && type !== "feature_request") {
      throw new AppError("Type must be either 'bug' or 'feature_request'", 400);
    }
    payload.type = type;
  }

  // Only allow status updates if user is maintainer
  if (role === "maintainer" && req.body.status !== undefined) {
    const status = req.body.status;
    if (
      status !== "open" &&
      status !== "in_progress" &&
      status !== "resolved"
    ) {
      throw new AppError("Invalid status value", 400);
    }
    payload.status = status;
  }

  // 4. Update the issue
  const result = await issuesService.updateIssueInDb(id as string, payload);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Issue updated successfully",
    data: result,
  });
});

const deleteIssue = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingIssue = await issuesService.getIssueByIdFromDb(id as string);
  if (!existingIssue) {
    throw new AppError("Issue not found", 404);
  }

  await issuesService.deleteIssueFromDb(id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Issue deleted successfully",
  });
});

export const issuesController = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
};
