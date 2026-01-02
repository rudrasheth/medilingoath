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

    // GET - Fetch patient profile
    if (req.method === 'GET') {
      const patient = await Patient.findOne({ userId });
      
      if (!patient) {
        return res.status(404).json({ error: 'Profile not found' });
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
    }

    // PUT - Update patient profile
    if (req.method === 'PUT') {
      const {
        age,
        gender,
        bloodType,
        allergies,
        medications,
        notes,
        medicalConditions,
        emergencyContacts,
      } = req.body;

      let patient = await Patient.findOne({ userId });

      if (!patient) {
        patient = new Patient({
          userId,
          email: decoded.email || 'unknown',
        });
      }

      if (age !== undefined) patient.age = age;
      if (gender !== undefined) patient.gender = gender;
      if (bloodType !== undefined) patient.bloodType = bloodType;
      if (allergies !== undefined) patient.allergies = allergies;
      if (medications !== undefined) patient.currentMedications = medications;
      if (notes !== undefined) patient.notes = notes;
      if (medicalConditions !== undefined) patient.medicalConditions = medicalConditions;
      if (emergencyContacts !== undefined) patient.emergencyContacts = emergencyContacts;

      patient.updatedAt = new Date();
      await patient.save();

      return res.status(200).json({
        message: 'Profile updated successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Patient profile API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
