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
import {
  getReportees,
  updateManager,
} from '../controllers/organizationController';

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

// Specific paths before /:id
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
