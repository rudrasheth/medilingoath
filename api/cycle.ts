import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

// Helper function to verify JWT
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string };
  } catch {
    return null;
  }
};

// Cycle Schema
const CycleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: Date,
  cycleLength: Number,
  symptoms: [String],
  mood: String,
  flow: { type: String, enum: ['light', 'medium', 'heavy'] },
  notes: String,
  createdAt: { type: Date, default: Date.now },
});

const Cycle = mongoose.models.Cycle || mongoose.model('Cycle', CycleSchema);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const { action } = req.query;

    // Track cycle data
    if (req.method === 'POST' && action === 'track') {
      const { userId, startDate, endDate, symptoms, mood, flow, notes } = req.body;
      
      if (!userId || !startDate) {
        return res.status(400).json({ error: 'userId and startDate required' });
      }

      const cycle = await Cycle.create({
        userId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        symptoms,
        mood,
        flow,
        notes
      });

      return res.status(201).json({ ok: true, cycle });
    }

    // Get cycle history
    if (req.method === 'GET' && action === 'history') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const cycles = await Cycle.find({ userId })
        .sort({ startDate: -1 })
        .limit(12);

      return res.json({ ok: true, cycles });
    }

    // Predict next cycle
    if (req.method === 'GET' && action === 'predict') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const cycles = await Cycle.find({ userId })
        .sort({ startDate: -1 })
        .limit(6);

      if (cycles.length === 0) {
        return res.json({ 
          ok: true, 
          prediction: null,
          message: 'No cycle data available for prediction'
        });
      }

      // Calculate average cycle length
      let totalLength = 0;
      let validCycles = 0;

      for (let i = 0; i < cycles.length - 1; i++) {
        const current = cycles[i];
        const next = cycles[i + 1];
        
        const daysDiff = Math.floor(
          (current.startDate.getTime() - next.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysDiff > 0 && daysDiff < 45) {
          totalLength += daysDiff;
          validCycles++;
        }
      }

      const averageCycleLength = validCycles > 0 ? Math.round(totalLength / validCycles) : 28;
      
      const lastCycle = cycles[0];
      const nextPeriodDate = new Date(lastCycle.startDate);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + averageCycleLength);

      const ovulationDate = new Date(lastCycle.startDate);
      ovulationDate.setDate(ovulationDate.getDate() + Math.floor(averageCycleLength / 2));

      const fertileStart = new Date(ovulationDate);
      fertileStart.setDate(fertileStart.getDate() - 5);

      const fertileEnd = new Date(ovulationDate);
      fertileEnd.setDate(fertileEnd.getDate() + 1);

      return res.json({
        ok: true,
        prediction: {
          nextPeriod: nextPeriodDate,
          averageCycleLength,
          ovulationDate,
          fertileWindow: {
            start: fertileStart,
            end: fertileEnd
          },
          cycleCount: cycles.length
        }
      });
    }

    return res.status(400).json({ error: 'Invalid action or method' });

  } catch (error) {
    console.error('Cycle API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process cycle request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}