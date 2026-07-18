import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Validation failed',
        errors: errors.array().map((e) => ({
          field: 'path' in e ? e.path : undefined,
          message: e.msg,
        })),
      });
      return;
    }

    next();
  };
};
