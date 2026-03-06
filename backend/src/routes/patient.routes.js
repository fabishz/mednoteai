import { Router } from 'express';
import * as patientController from '../controllers/patient.controller.js';
import { validate } from '../middlewares/validate.js';
import * as patientValidator from '../validators/patient.validator.js';
import { authorize } from '../middlewares/authorize.js';
import { Permissions } from '../constants/permissions.js';

const router = Router();

/**
 * @openapi
 * /api/patients:
 *   post:
 *     tags: [Patients]
 *     summary: Create a new patient
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePatientInput'
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 *       401:
 *         description: Unauthorized — missing or invalid token
 */
router.post(
  '/',
  authorize(Permissions.PATIENT_CREATE),
  validate(patientValidator.createPatientSchema),
  patientController.create
);

/**
 * @openapi
 * /api/patients:
 *   get:
 *     tags: [Patients]
 *     summary: List all patients for the authenticated doctor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated list of patients
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedPatients'
 *       401:
 *         description: Unauthorized — missing or invalid token
 */
router.get(
  '/',
  authorize(Permissions.PATIENT_READ),
  validate(patientValidator.listPatientsSchema),
  patientController.list
);

router.get(
  '/search',
  authorize(Permissions.PATIENT_READ),
  validate(patientValidator.searchPatientsSchema),
  patientController.search
);

router.get(
  '/:id/export',
  authorize(Permissions.PATIENT_READ),
  validate(patientValidator.exportPatientSchema),
  patientController.exportData
);

/**
 * @openapi
 * /api/patients/{id}:
 *   get:
 *     tags: [Patients]
 *     summary: Get a single patient by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient UUID
 *     responses:
 *       200:
 *         description: Patient found
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessEnvelope'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Patient'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.get(
  '/:id',
  authorize(Permissions.PATIENT_READ),
  validate(patientValidator.patientIdSchema),
  patientController.getById
);

router.patch(
  '/:id',
  authorize(Permissions.PATIENT_UPDATE),
  validate(patientValidator.updatePatientSchema),
  patientController.update
);

/**
 * @openapi
 * /api/patients/{id}:
 *   delete:
 *     tags: [Patients]
 *     summary: Soft-delete a patient by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient UUID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessEnvelope'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.delete(
  '/:id',
  authorize(Permissions.PATIENT_DELETE),
  validate(patientValidator.patientIdSchema),
  patientController.remove
);

router.delete(
  '/:id/permanent',
  authorize(Permissions.PATIENT_DELETE),
  validate(patientValidator.patientIdSchema),
  patientController.permanentRemove
);

router.post(
  '/:id/restore',
  authorize(Permissions.PATIENT_UPDATE),
  validate(patientValidator.patientIdSchema),
  patientController.restore
);

export default router;
