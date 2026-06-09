import { Router } from "express";
import { issuesController } from "./issues.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../types";

const router = Router();

// POST /api/issues
router.post(
  "/",
  auth(USER_ROLES.contributor, USER_ROLES.maintainer),
  issuesController.createIssue,
);

// GET /api/issues
router.get("/", issuesController.getAllIssues);

export const issuesRoutes = router;
