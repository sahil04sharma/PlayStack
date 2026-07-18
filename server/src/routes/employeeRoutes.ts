import multer from 'multer';
import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';
import { authorize, restrictSelfEdit } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  createEmployeeRules,
  updateEmployeeRules,
  listEmployeeQueryRules,
  updateManagerRules,
} from '../validators/employeeValidator';
import * as employeeController from '../controllers/employeeController';
import { importEmployeesCsv } from '../controllers/importController';
import {
  getReportees,
  updateManager,
} from '../controllers/organizationController';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.originalname.toLowerCase().endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

const router = Router();

router.use(verifyJWT);

router.get(
  '/',
  authorize('super_admin', 'hr_manager'),
  validate(listEmployeeQueryRules),
  employeeController.getAllEmployees
);

router.post(
  '/',
  authorize('super_admin', 'hr_manager'),
  validate(createEmployeeRules),
  employeeController.createEmployee
);

router.post(
  '/import',
  authorize('super_admin', 'hr_manager'),
  (req, res, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({
          message: err instanceof Error ? err.message : 'Upload failed',
        });
        return;
      }
      next();
    });
  },
  importEmployeesCsv
);

router.get('/:id/reportees', getReportees);
router.patch(
  '/:id/manager',
  authorize('super_admin', 'hr_manager'),
  validate(updateManagerRules),
  updateManager
);

router.get('/:id', employeeController.getEmployeeById);

router.put(
  '/:id',
  restrictSelfEdit,
  validate(updateEmployeeRules),
  employeeController.updateEmployee
);

router.delete(
  '/:id',
  authorize('super_admin'),
  employeeController.softDeleteEmployee
);

export default router;
