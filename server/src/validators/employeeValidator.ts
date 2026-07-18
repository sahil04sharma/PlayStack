import { body, query } from 'express-validator';

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
  body('reportingManager')
    .optional({ values: 'null' })
    .custom((value) => value === null || value === '' || /^[a-f\d]{24}$/i.test(value))
    .withMessage('reportingManager must be a valid id or null'),
  body('profileImage').optional().isString(),
];

export const updateEmployeeRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').optional().matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('department').optional().trim().notEmpty(),
  body('designation').optional().trim().notEmpty(),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('joiningDate').optional().isISO8601().withMessage('Valid joining date required'),
  body('status').optional().isIn(['active', 'inactive']),
  body('role').optional().isIn(['super_admin', 'hr_manager', 'employee']),
  body('reportingManager')
    .optional({ values: 'null' })
    .custom((value) => value === null || value === '' || /^[a-f\d]{24}$/i.test(value))
    .withMessage('reportingManager must be a valid id or null'),
  body('profileImage').optional().isString(),
];

export const listEmployeeQueryRules = [
  query('search').optional().isString().isLength({ max: 100 }),
  query('department').optional().isString(),
  query('role').optional().isIn(['super_admin', 'hr_manager', 'employee']),
  query('status').optional().isIn(['active', 'inactive']),
  query('sortBy')
    .optional()
    .isIn(['joiningDate', 'name', 'email', 'salary', 'createdAt']),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const updateManagerRules = [
  body('managerId')
    .optional({ values: 'null' })
    .custom((value) => value === null || value === '' || /^[a-f\d]{24}$/i.test(value))
    .withMessage('managerId must be a valid id or null'),
];

export const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
