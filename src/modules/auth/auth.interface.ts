import type { ROLES } from "../../types";

export interface IUser {
  name: string;
  email: string;
  password: string;
  role?: ROLES;
}
