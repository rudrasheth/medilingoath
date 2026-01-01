import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

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

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'stockmaster577@gmail.com',
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const transporter = createEmailTransporter();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
            .container { background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .title { font-size: 24px; font-weight: 600; color: #1f2937; margin-bottom: 20px; text-align: center; }
            .otp-box { background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 48px; font-weight: bold; color: white; letter-spacing: 8px; font-family: monospace; }
            .notice { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 25px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1 class="title">🔐 Password Reset Request</h1>
            <p>Use the OTP code below to reset your password:</p>
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
            </div>
            <div class="notice">
                <p>⏱️ <strong>This OTP is valid for 10 minutes only.</strong></p>
            </div>
            <p style="color: #6b7280;">If you didn't request this, please ignore this email.</p>
        </div>
    </body>
    </html>
    `;

    await transporter.sendMail({
      from: `"MediLingo" <${process.env.EMAIL_USER || 'stockmaster577@gmail.com'}>`,
      to: email,
      subject: 'MediLingo - Password Reset OTP',
      html: htmlContent
    });

    console.log(`✅ OTP sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Email send failed:`, error.message);
    throw error;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

  const { action, email, otp, newPassword } = req.body;

  try {
    if (!dbReady) await new Promise(resolve => setTimeout(resolve, 1000));

    // REQUEST OTP
    if (action === 'request-otp') {
      if (!email) return res.status(400).json({ success: false, message: 'Email required' });

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(200).json({ success: true, message: 'If an account exists, OTP has been sent.' });
      }

      const otpCode = generateOTP();
      user.resetOTP = otpCode;
      user.resetOTPExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOTPEmail(email, otpCode);

      return res.status(200).json({ success: true, message: 'OTP sent to your email.' });
    }

    // RESET PASSWORD
    if (action === 'reset-password') {
      if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, OTP, and new password required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !user.resetOTP || !user.resetOTPExpiry) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      if (new Date() > user.resetOTPExpiry) {
        return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
      }

      if (user.resetOTP !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetOTP = undefined;
      user.resetOTPExpiry = undefined;
      await user.save();

      return res.status(200).json({ success: true, message: 'Password reset successfully' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });

  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    return res.status(500).json({ success: false, message: 'Operation failed', error: error.message });
  }
}
