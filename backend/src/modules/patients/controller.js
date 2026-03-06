import { createPatient, listPatients, getPatient, deletePatient } from './service.js';

export async function create(req, res, next) {
  try {
    const patient = await createPatient(req.user.id, req.validated.body);
    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const patients = await listPatients(req.user.id);
    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const patient = await getPatient(req.user.id, req.validated.params.id);
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await deletePatient(req.user.id, req.validated.params.id);
    res.json({ success: true, data: { id: req.validated.params.id } });
  } catch (err) {
    next(err);
  }
}
