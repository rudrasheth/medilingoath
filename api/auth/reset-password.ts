import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB Connection
let dbReady = false;
if (process.env.MONGODB_URI && !mongoose.connection.readyState) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      dbReady = true;
      console.log('✅ MongoDB connected');
    })
    .catch((e) => console.warn('❌ MongoDB connection failed:', e.message));
}

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  age: Number,
  gender: String,
  resetOTP: String,
  resetOTPExpiry: Date,
  createdAt: { type: Date, default: Date.now },
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, otp, newPassword } = req.body;

    // Validation
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP, and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    console.log('🔄 Processing password reset for:', email);

    // Wait for DB connection
    if (!dbReady) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or OTP' 
      });
    }

    // Check if OTP exists and is not expired
    if (!user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'No password reset request found. Please request a new OTP.' 
      });
    }

    if (new Date() > user.resetOTPExpiry) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      });
    }

    // Verify OTP
    if (user.resetOTP !== otp) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP. Please check and try again.' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP
    user.password = hashedPassword;
    user.resetOTP = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    console.log('✅ Password reset successful for:', email);

    return res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });

  } catch (error: any) {
    console.error('❌ Error resetting password:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password. Please try again.',
      error: error.message 
    });
  }
}
