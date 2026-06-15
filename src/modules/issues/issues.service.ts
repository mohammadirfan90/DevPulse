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

const getIssueWithReporterByIdFromDb = async (id: string) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  const issue = result.rows[0];
  if (!issue) {
    return null;
  }

  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
  );
  const reporter = userResult.rows[0] || null;

  const { reporter_id, ...issueData } = issue;
  return {
    ...issueData,
    reporter,
  };
};

const updateIssueInDb = async (id: string, payload: Partial<IIssue>) => {
  const fields: string[] = [];
  const values: any[] = [];
  let index = 1;

  if (payload.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(payload.title);
  }
  if (payload.description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(payload.description);
  }
  if (payload.type !== undefined) {
    fields.push(`type = $${index++}`);
    values.push(payload.type);
  }
  if (payload.status !== undefined) {
    fields.push(`status = $${index++}`);
    values.push(payload.status);
  }

  if (fields.length === 0) {
    const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
    return result.rows[0];
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(id);
  const query = `
    UPDATE issues
    SET ${fields.join(", ")}
    WHERE id = $${index}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

const deleteIssueFromDb = async (id: string) => {
  await pool.query(`DELETE FROM issues WHERE id = $1`, [id]);
};

export const issuesService = {
  createIssueIntoDb,
  getAllIssuesFromDb,
  getIssueByIdFromDb,
  getIssueWithReporterByIdFromDb,
  updateIssueInDb,
  deleteIssueFromDb,
};
