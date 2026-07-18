import { IEmployee } from '../models/Employee';

declare global {
  namespace Express {
    interface Request {
      user?: IEmployee;
    }
  }
}

export {};
