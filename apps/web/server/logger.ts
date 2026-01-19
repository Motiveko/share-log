import Logger from "@repo/logger";

// TODO : esModuleInterop 관련 에러, https://chatgpt.com/c/67c310ff-ff38-800c-a5b4-90f060390c10 보고 해결필요

const _logger = new Logger();

const logger = {
  info: _logger.info.bind(this),
  warn: _logger.info.bind(this),
  error: _logger.info.bind(this),
  log(...args: Parameters<typeof console.log>) {
    // eslint-disable-next-line no-console -- temporal
    console.log(...args);
  },
};

export default logger;
