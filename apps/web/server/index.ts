import path from "node:path";
import * as dotenv from "dotenv";
import express from "express";
import logger from "server/logger";

// 환경변수 로드 (번들된 서버에서 .env.production 읽기)
// Docker: /app/dist/server/index.js 실행, .env.production은 /app/.env.production
const envPath = path.join(__dirname, "..", "..", ".env.production");
dotenv.config({ path: envPath });
console.log("--- envPath ::: ", envPath);
console.log("--- process.env.VITE_ENV_PORT", process.env.VITE_ENV_PORT);

const app = express();

logger.log(path.join(__dirname, ".."));

// eslint-disable-next-line import/no-named-as-default-member -- express only
const expressStaticMiddlewares = express.static(path.join(__dirname, ".."), {
  index: false,
});
const port = process.env.VITE_ENV_PORT || 3001;

app.use(expressStaticMiddlewares);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

app.listen(port, () => {
  logger.log(`web server running on ${port}`);
});
