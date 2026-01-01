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

// Generate random sharing code
const generateSharingCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Sharing Schema
const SharingSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  sharingCode: { type: String, required: true, unique: true },
  sharedWith: [String],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
});

const Sharing = mongoose.models.Sharing || mongoose.model('Sharing', SharingSchema);

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  age: Number,
  gender: { type: String, enum: ['Male', 'Female'] },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { action } = req.query;

    // GET /api/share?action=code - Get user's sharing code
    if (req.method === 'GET' && action === 'code') {
      const sharing = await Sharing.findOne({ ownerId: decoded.userId });
      
      if (!sharing) {
        return res.json({ 
          ok: true, 
          sharingCode: null,
          message: 'No sharing code generated yet'
        });
      }

      return res.json({
        ok: true,
        sharingCode: sharing.sharingCode,
        sharedWithCount: sharing.sharedWith.length,
        createdAt: sharing.createdAt
      });
    }

    // GET /api/share?action=profiles - Get shared profiles
    if (req.method === 'GET' && action === 'profiles') {
      const sharings = await Sharing.find({ 
        sharedWith: decoded.userId,
        expiresAt: { $gt: new Date() }
      });

      const profiles = [];
      for (const sharing of sharings) {
        const owner = await User.findById(sharing.ownerId).select('name email age gender');
        if (owner) {
          profiles.push({
            id: owner._id,
            name: owner.name,
            email: owner.email,
            age: owner.age,
            gender: owner.gender,
            sharingCode: sharing.sharingCode,
            sharedAt: sharing.createdAt
          });
        }
      }

      return res.json({ ok: true, profiles });
    }

    // POST /api/share?action=generate - Generate sharing code
    if (req.method === 'POST' && action === 'generate') {
      let sharing = await Sharing.findOne({ ownerId: decoded.userId });
      
      if (sharing) {
        return res.json({ 
          ok: true, 
          sharingCode: sharing.sharingCode,
          existing: true 
        });
      }

      // Generate new sharing code
      let sharingCode;
      let attempts = 0;
      
      do {
        sharingCode = generateSharingCode();
        const existing = await Sharing.findOne({ sharingCode });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        return res.status(500).json({ error: 'Failed to generate unique sharing code' });
      }

      sharing = await Sharing.create({
        ownerId: decoded.userId,
        sharingCode,
        sharedWith: []
      });

      return res.status(201).json({
        ok: true,
        sharingCode: sharing.sharingCode,
        existing: false
      });
    }

    // POST /api/share?action=redeem - Redeem sharing code
    if (req.method === 'POST' && action === 'redeem') {
      const { sharingCode } = req.body;
      
      if (!sharingCode) {
        return res.status(400).json({ error: 'Sharing code is required' });
      }

      const sharing = await Sharing.findOne({ 
        sharingCode: sharingCode.toUpperCase(),
        expiresAt: { $gt: new Date() }
      });

      if (!sharing) {
        return res.status(404).json({ error: 'Invalid or expired sharing code' });
      }

      if (sharing.ownerId === decoded.userId) {
        return res.status(400).json({ error: 'Cannot redeem your own sharing code' });
      }

      if (sharing.sharedWith.includes(decoded.userId)) {
        const owner = await User.findById(sharing.ownerId).select('name email age gender');
        return res.json({ 
          ok: true, 
          message: 'You already have access to this profile',
          owner: owner ? {
            id: owner._id,
            name: owner.name,
            email: owner.email,
            age: owner.age,
            gender: owner.gender
          } : null,
          alreadyShared: true
        });
      }

      await Sharing.findByIdAndUpdate(sharing._id, {
        $addToSet: { sharedWith: decoded.userId }
      });

      const owner = await User.findById(sharing.ownerId).select('name email age gender');

      return res.json({
        ok: true,
        message: 'Successfully redeemed sharing code',
        owner: owner ? {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          age: owner.age,
          gender: owner.gender
        } : null,
        alreadyShared: false
      });
    }

    return res.status(400).json({ error: 'Invalid action or method' });

  } catch (error) {
    console.error('Sharing API error:', error);
    return res.status(500).json({ 
      error: 'Failed to process sharing request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}