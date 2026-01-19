import { sign, SignOptions, verify } from "jsonwebtoken";
import { Config } from "@api/config/env";

type JwtPayload = Record<string, string> | string;

export const createToken = (payload: JwtPayload, options: SignOptions = {}) => {
  const withDefaultOptions: SignOptions = {
    expiresIn: "1h",
    ...options,
  };
  return sign(payload, Config.JWT_SECRET, withDefaultOptions);
};

export const verifyToken = (token: string) => {
  return verify(token, Config.JWT_SECRET);
};
