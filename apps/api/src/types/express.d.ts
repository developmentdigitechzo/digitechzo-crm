import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
    }
  }
}
