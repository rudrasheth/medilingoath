import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Patient Schema
const PatientSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  age: Number,
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  bloodType: String,
  allergies: String,
  currentMedications: String,
  notes: String,
  medicalConditions: [{
    id: String,
    condition: String,
    diagnosedYear: Number,
    notes: String,
  }],
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
  prescriptions: [{
    id: String,
    doctorName: String,
    medications: [String],
    date: Date,
    filled: Boolean,
    filePath: String,
  }],
  healthRecords: [{
    id: String,
    type: String,
    date: Date,
    description: String,
    results: String,
    filePath: String,
  }],
  medicalHistory: [{
    id: String,
    date: Date,
    type: String,
    description: String,
    doctorName: String,
    notes: String,
  }],
  emergencyContacts: [{
    id: String,
    name: String,
    relationship: String,
    phone: String,
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

    // GET - Fetch patient data
    if (req.method === 'GET') {
      const patient = await Patient.findOne({ userId });
      
      if (!patient) {
        return res.status(404).json({
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
    }

    // POST - Create appointment
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

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Patient API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
