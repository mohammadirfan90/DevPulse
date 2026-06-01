import app from "./app";
import config from "./config";
import { initDb } from "./db";

const PORT = config.port;

const main = () => {
  app.listen(PORT, () => {
    initDb();
    console.log(`Server is running on port ${PORT}`);
  });
};

main();
