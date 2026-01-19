import cors from "cors";
import { Config } from "@api/config/env";

export const corsMiddleware = cors({
  origin: Config.FRONTEND_URL,
  credentials: true,
});
