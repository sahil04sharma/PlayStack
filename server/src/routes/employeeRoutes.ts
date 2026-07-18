import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';
import { authorize, restrictSelfEdit } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  createEmployeeRules,
  updateEmployeeRules,
} from '../validators/employeeValidator';
import * as employeeController from '../controllers/employeeController';

const router = Router();

router.use(verifyJWT);

router.get(
  '/',
  authorize('super_admin', 'hr_manager'),
  employeeController.getAllEmployees
);

router.post(
  '/',
  authorize('super_admin', 'hr_manager'),
  validate(createEmployeeRules),
  employeeController.createEmployee
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
