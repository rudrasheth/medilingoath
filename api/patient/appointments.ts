import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Patient Schema
const PatientSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  appointments: [{
    id: String,
    doctorName: String,
    specialty: String,
    date: Date,
    time: String,
    location: String,
    reason: String,
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'] },
    createdAt: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  } catch (error) {
    return null;
  }
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medilingo');
    }

    const Patient = mongoose.model('Patient', PatientSchema);

    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;

    // GET - Fetch patient appointments
    if (req.method === 'GET') {
      const patient = await Patient.findOne({ userId });
      
      if (!patient) {
        return res.status(200).json([]);
      }

      return res.status(200).json(patient.appointments || []);
    }

    // POST - Create new appointment
    if (req.method === 'POST') {
      const { doctorName, specialty, date, time, location, reason } = req.body;

      if (!doctorName || !specialty || !date || !time) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      let patient = await Patient.findOne({ userId });

      if (!patient) {
        patient = new Patient({
          userId,
          email: decoded.email || 'unknown',
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
    }

    // PUT - Update appointment
    if (req.method === 'PUT') {
      const { appointmentId, status } = req.body;

      if (!appointmentId || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const patient = await Patient.findOne({ userId });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const appointment = patient.appointments?.find((apt) => apt.id === appointmentId);

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
    }

    // DELETE - Cancel appointment
    if (req.method === 'DELETE') {
      const { appointmentId } = req.query;

      if (!appointmentId) {
        return res.status(400).json({ error: 'Appointment ID is required' });
      }

      const patient = await Patient.findOne({ userId });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      patient.appointments = patient.appointments?.filter(
        (apt) => apt.id !== appointmentId
      );

      patient.updatedAt = new Date();
      await patient.save();

      return res.status(200).json({
        message: 'Appointment cancelled successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Appointments API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
