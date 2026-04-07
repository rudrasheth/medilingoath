import { Router, Request, Response } from 'express';
import Patient from '../models/Patient';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all patient data
router.get('/data', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    let patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(200).json({
        appointments: [],
        prescriptions: [],
        medicalHistory: [],
        healthRecords: [],
        emergencyContacts: [],
      });
    }

    return res.status(200).json({
      age: patient.age,
      gender: patient.gender,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      notes: patient.notes,
      medicalConditions: patient.medicalConditions || [],
      appointments: patient.appointments || [],
      prescriptions: patient.prescriptions || [],
      healthRecords: patient.healthRecords || [],
      medicalHistory: patient.medicalHistory || [],
      emergencyContacts: patient.emergencyContacts || [],
    });
  } catch (error: any) {
    console.error('Error fetching patient data:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get patient profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(200).json({});
    }

    return res.status(200).json({
      age: patient.age,
      gender: patient.gender,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      notes: patient.notes,
      medicalConditions: patient.medicalConditions || [],
      emergencyContacts: patient.emergencyContacts || [],
    });
  } catch (error: any) {
    console.error('Error fetching patient profile:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update patient profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const updateData = req.body;

    let patient = await Patient.findOne({ userId });

    if (!patient) {
      patient = new Patient({
        userId,
        email: (req as any).user.email || 'unknown',
        ...updateData,
      });
    } else {
      Object.assign(patient, updateData);
      patient.updatedAt = new Date();
    }

    await patient.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: patient,
    });
  } catch (error: any) {
    console.error('Error updating patient profile:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get appointments
router.get('/appointments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(200).json([]);
    }

    return res.status(200).json(patient.appointments || []);
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Book new appointment
router.post('/appointments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { doctorName, specialty, date, time, location, reason } = req.body;

    if (!doctorName || !specialty || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let patient = await Patient.findOne({ userId });

    if (!patient) {
      patient = new Patient({
        userId,
        email: (req as any).user.email || 'unknown',
        appointments: [],
      });
    }

    const appointment = {
      id: Date.now().toString(),
      doctorName,
      specialty,
      date: new Date(date),
      time,
      location: location || '',
      reason: reason || '',
      status: 'pending',
      createdAt: new Date(),
    };

    patient.appointments = patient.appointments || [];
    patient.appointments.push(appointment);
    patient.updatedAt = new Date();

    await patient.save();

    return res.status(201).json({
      message: 'Appointment booked successfully',
      appointment,
    });
  } catch (error: any) {
    console.error('Error booking appointment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Update appointment
router.put('/appointments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const appointment = patient.appointments?.find((apt: any) => apt.id === appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = status;
    patient.updatedAt = new Date();

    await patient.save();

    return res.status(200).json({
      message: 'Appointment updated successfully',
      appointment,
    });
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Cancel appointment
router.delete('/appointments', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { appointmentId } = req.query;

    if (!appointmentId) {
      return res.status(400).json({ error: 'Appointment ID is required' });
    }

    const patient = await Patient.findOne({ userId });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    patient.appointments = patient.appointments?.filter(
      (apt: any) => apt.id !== appointmentId
    );

    patient.updatedAt = new Date();
    await patient.save();

    return res.status(200).json({
      message: 'Appointment cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
