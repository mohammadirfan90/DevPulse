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

// GET /api/issues/:id
router.get("/:id", issuesController.getIssueById);

// PATCH /api/issues/:id
router.patch(
  "/:id",
  auth(USER_ROLES.contributor, USER_ROLES.maintainer),
  issuesController.updateIssue,
);

router.delete(
  "/:id",
  auth(USER_ROLES.maintainer),
  issuesController.deleteIssue,
);
export const issuesRoutes = router;
