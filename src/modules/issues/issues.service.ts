import type { IIssue } from "./issue.interface";
import { pool } from "../../db";

const createIssueIntoDb = async (payload: IIssue) => {
  const { title, description, status,type, createdBy } = payload;

  const reporter_id = createdBy; // Assuming createdBy is the user ID of the reporter
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, status,type, reporter_id)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `,
    [title, description, status, type, reporter_id]
  );
  return result.rows[0];
};

const getAllIssuesFromDb = async (filters: {
  sort?: string;
  type?: string;
  status?: string;
}) => {
  const { sort = "newest", type, status } = filters;

  let queryText = `SELECT * FROM issues`;
  const queryParams: any[] = [];
  const conditions: string[] = [];

  if (type) {
    queryParams.push(type);
    conditions.push(`type = $${queryParams.length}`);
  }

  if (status) {
    queryParams.push(status);
    conditions.push(`status = $${queryParams.length}`);
  }

  if (conditions.length > 0) {
    queryText += ` WHERE ` + conditions.join(" AND ");
  }

  const order = sort === "oldest" ? "ASC" : "DESC";
  queryText += ` ORDER BY created_at ${order}`;

  const result = await pool.query(queryText, queryParams);
  const issues = result.rows;

  if (issues.length === 0) {
    return [];
  }

  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];

  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds],
  );

  const usersMap = new Map();
  usersResult.rows.forEach((u) => {
    usersMap.set(u.id, u);
  });

  return issues.map((issue) => {
    const reporter = usersMap.get(issue.reporter_id) || null;
    const { reporter_id, ...issueData } = issue;
    return {
      ...issueData,
      reporter,
    };
  });
};

const getIssueByIdFromDb=async (id: string) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  return result.rows[0];
};
export const issuesService = {
  createIssueIntoDb,
  getAllIssuesFromDb,
  getIssueByIdFromDb,
};
