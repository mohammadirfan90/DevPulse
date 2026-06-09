import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { issuesService } from "./issues.service";
import type { Request, Response } from "express";

const createIssue = catchAsync(async (req: Request, res: Response) => {
  const { title, description, type  } = req.body;

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

export const issuesController = {
  createIssue,
  getAllIssues,
};
