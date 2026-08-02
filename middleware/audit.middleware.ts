import type { Request, Response, NextFunction } from "express";

export function auditLogger(serviceName = "app") {
  const fn = (req: Request, res: Response, next: NextFunction) => {
    // attach a minimal audit interface
    (req as any).audit = {
      info: (msg: string, meta?: any) =>
        console.info(`[AUDIT:${serviceName}]`, msg, meta),
      warn: (msg: string, meta?: any) =>
        console.warn(`[AUDIT:${serviceName}]`, msg, meta),
      error: (msg: string, meta?: any) =>
        console.error(`[AUDIT:${serviceName}]`, msg, meta),
    };
    next();
  };

  // expose warn so code that calls auditLogger.warn(...) still works
  (fn as any).warn = (msg: string, meta?: any) =>
    console.warn(`[AUDIT:${serviceName}]`, msg, meta);
  return fn as any;
}
