import { Request, Response, NextFunction } from 'express';
import { Role } from '../types';

export const authorize =
  (...allowedRoles: Role[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role as Role)) {
      res.status(403).json({ message: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };

/** Employee role: own profile only, and only phone + profileImage. */
export const restrictSelfEdit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  if (req.user.role !== 'employee') {
    next();
    return;
  }

  if (String(req.user._id) !== req.params.id) {
    res.status(403).json({ message: 'You can only edit your own profile' });
    return;
  }

  const allowedFields = ['phone', 'profileImage'];
  Object.keys(req.body as object).forEach((key) => {
    if (!allowedFields.includes(key)) {
      delete (req.body as Record<string, unknown>)[key];
    }
  });

  next();
};
