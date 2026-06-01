import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthRequest } from "../types";
import { AppError } from "./error.middleware";

const ROLE_RANK: Record<Role, number> = { USER: 0, MODERATOR: 1, ADMIN: 2 };

export const requireRole =
  (minimum: Role) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || ROLE_RANK[req.user.role] < ROLE_RANK[minimum]) {
      return next(new AppError(403, "Forbidden"));
    }
    next();
  };
