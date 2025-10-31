// react-vis-ts-backend/types/express.d.ts
import type { AuthUser } from "../src/middleware/requireAuth";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
