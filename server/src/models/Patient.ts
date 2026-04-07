import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
  userId: string;
  email: string;
  age?: number;
  gender?: string;
  bloodType?: string;
  allergies?: string;
  currentMedications?: string;
  notes?: string;
  medicalConditions?: Array<{
    id: string;
    condition: string;
    diagnosedYear?: number;
    notes?: string;
  }>;
  appointments?: Array<{
    id: string;
    doctorName: string;
    specialty: string;
    date: Date;
    time: string;
    location?: string;
    reason?: string;
    status: string;
    createdAt: Date;
  }>;
  prescriptions?: Array<{
    id: string;
    doctorName: string;
    medications: string[];
    date: Date;
    filled?: boolean;
    filePath?: string;
  }>;
  healthRecords?: Array<{
    id: string;
    type: string;
    date: Date;
    description?: string;
    results?: string;
    filePath?: string;
  }>;
  medicalHistory?: Array<{
    id: string;
    date: Date;
    type: string;
    description: string;
    doctorName?: string;
    notes?: string;
  }>;
  emergencyContacts?: Array<{
    id: string;
    name: string;
    relationship: string;
    phone: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema: Schema = new Schema({
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
    status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'pending' },
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

export default mongoose.model<IPatient>('Patient', PatientSchema);
