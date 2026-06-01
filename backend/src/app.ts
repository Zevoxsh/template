import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import rolesRoutes from "./routes/roles.routes";
import oauthRoutes from "./routes/oauth.routes";
import authConfigRoutes from "./routes/auth-config.routes";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/auth", oauthRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/roles", rolesRoutes);
app.use("/api/admin/auth-config", authConfigRoutes);

app.use(errorHandler);

export default app;
