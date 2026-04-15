import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { JwtPayload } from "../types/index";
import { authConfig } from "../config/auth";

const extractToken = (req: Request): string | undefined => {
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader?.startsWith("Bearer ")) {
    return authorizationHeader.slice("Bearer ".length);
  }

  const accessTokenHeader = req.headers["x-access-token"];
  if (typeof accessTokenHeader === "string" && accessTokenHeader.length > 0) {
    return accessTokenHeader;
  }

  return undefined;
};

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = extractToken(req);

  if (token) {
    try {
      const decoded = jwt.verify(token, authConfig.jwtSecret) as JwtPayload;
      req.user = decoded;
    } catch (err) {
      // Token is invalid, but we don't fail - just continue as unauthenticated
    }
  }

  next();
};

export const generateAccessToken = (payload: JwtPayload): string => {
  const accessTokenOptions: SignOptions = {
    expiresIn: authConfig.accessTokenExpiresIn as SignOptions["expiresIn"],
  };

  const accessToken = jwt.sign(payload, authConfig.jwtSecret, {
    ...accessTokenOptions,
  });

  return accessToken;
};