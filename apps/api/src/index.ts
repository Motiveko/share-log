// reflect-metadata must be imported before any other imports that use decorators
import "reflect-metadata";

import { Config } from "@api/config/env";
import App from "@api/app";
import logger from "@api/lib/logger";
import { container } from "tsyringe";

const app = container.resolve(App);

process.on("uncaughtException", (err) => {
  logger.log(`unhandled exception (kill) message: ${err.message}`);
  logger.log(`unhandled exception (kill) stack: ${err.stack}`);
  process.exit(1);
});

// bootstrap application
app
  .bootstrap()
  .then(() => {
    logger.log(
      [
        "*******************************************************************************",
        "***************************** Application started *****************************",
        "*******************************************************************************",
        "⚙️⚙️⚙️ Config >>>>> ",
      ].join("\n")
    );
    logger.log(Config);
  })
  .catch((e) => {
    console.error(e);
    logger.error({ message: "Failed to bootstrap application:", error: e });
    process.exit(1);
  });
