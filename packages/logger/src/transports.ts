import winston from "winston";
import "winston-daily-rotate-file";
import type DailyRotateFile from "winston-daily-rotate-file";

export type TransportConfig =
  | ConsoleTransportConfig
  | FileTransportConfig
  | FileRotateTransportConfig
  | HttpTransportConfig;

interface ConsoleTransportConfig {
  type: "console";
  options?: winston.transports.ConsoleTransportOptions;
}

interface FileTransportConfig {
  type: "file";
  options?: winston.transports.FileTransportOptions;
}

interface FileRotateTransportConfig {
  type: "file-rotate";
  options?: DailyRotateFile.DailyRotateFileTransportOptions;
}

interface HttpTransportConfig {
  type: "http";
  options?: winston.transports.HttpTransportOptions;
}

export const getTransportInstances = (configs?: TransportConfig[]) => {
  if (!configs) {
    return [new winston.transports.Console()];
  }

  return configs.map(({ type, options }) => {
    switch (type) {
      case "file":
        return new winston.transports.File(options);
      case "file-rotate":
        return new winston.transports.DailyRotateFile(options);
      case "http":
        return new winston.transports.Http(options);
      case "console":
      default:
        return new winston.transports.Console(options);
    }
  });
};
