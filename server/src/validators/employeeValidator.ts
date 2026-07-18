import { body } from 'express-validator';

export const createEmployeeRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('designation').trim().notEmpty().withMessage('Designation is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('joiningDate').isISO8601().withMessage('Valid joining date required'),
  body('status').optional().isIn(['active', 'inactive']),
  body('role').optional().isIn(['super_admin', 'hr_manager', 'employee']),
  body('reportingManager').optional({ nullable: true }).isMongoId(),
  body('profileImage').optional().isString(),
];

export const updateEmployeeRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional().matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('department').optional().trim().notEmpty(),
  body('designation').optional().trim().notEmpty(),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('joiningDate').optional().isISO8601().withMessage('Valid joining date required'),
  body('status').optional().isIn(['active', 'inactive']),
  body('role').optional().isIn(['super_admin', 'hr_manager', 'employee']),
  body('reportingManager').optional({ nullable: true }).isMongoId(),
  body('profileImage').optional().isString(),
];
