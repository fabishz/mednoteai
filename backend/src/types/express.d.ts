import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    clinicId?: string | null;
    ipAddress?: string;
    userAgent?: string;
    user?: {
      id: string;
      email: string;
      role: string;
      clinicId: string | null;
    };
  }
}
