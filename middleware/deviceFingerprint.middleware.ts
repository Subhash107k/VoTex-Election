import type { Request, Response, NextFunction } from "express";

export function deviceFingerprint() {
  return (req: Request, res: Response, next: NextFunction) => {
    // normalize header from query or header
    const fingerprint = (req.headers["x-device-fingerprint"] as string) || (req.query.deviceFingerprint as string) || null;
    if (fingerprint) (req.headers as any)["x-device-fingerprint"] = fingerprint;
    next();
  };
}
