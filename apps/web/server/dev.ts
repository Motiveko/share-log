import express from "express";
import { createServer as createViteServer } from "vite";
import logger from "server/logger";

const app = express();

const getViteMiddlewares = async () => {
  const viteServer = await createViteServer({
    server: {
      middlewareMode: true,
    },
    appType: "spa",
  });
  return viteServer.middlewares;
};

const port = process.env.VITE_ENV_PORT || 4321;

logger.log(`리액트 서버: http://localhost:${port}`);

app.use(await getViteMiddlewares());
app.listen(port, () => {
  logger.log(`web server running on ${port}`);
});
