import type { Request, Response, NextFunction } from "express";

export function biometricConsent() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Minimal stub: assume consent present in dev
    (req as any).biometricConsent = true;
    next();
  };
}
