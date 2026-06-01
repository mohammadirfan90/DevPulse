import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  connectionString: (process.env.CONNECTION_STRING as string) || "",
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  jwt_secret: process.env.JWT_SECRET as string,
};

export default config;
