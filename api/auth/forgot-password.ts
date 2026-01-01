import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
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
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }
            .email-container {
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .title {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 16px;
                color: #6b7280;
            }
            .otp-box {
                background: linear-gradient(135deg, #10b981, #059669);
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }
            .otp-label {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 10px;
            }
            .otp-code {
                font-size: 48px;
                font-weight: bold;
                color: white;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }
            .expiry-notice {
                background-color: #fef3c7;
                border-left: 4px solid #f59e0b;
                padding: 15px;
                border-radius: 4px;
                margin: 25px 0;
            }
            .expiry-text {
                color: #92400e;
                margin: 0;
                font-size: 14px;
            }
            .warning {
                background-color: #fee2e2;
                border-left: 4px solid #ef4444;
                padding: 15px;
                border-radius: 4px;
                margin: 25px 0;
            }
            .warning-text {
                color: #991b1b;
                margin: 0;
                font-size: 14px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
            .footer-text {
                font-size: 12px;
                color: #9ca3af;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1 class="title">🔐 Password Reset Request</h1>
                <p class="subtitle">We received a request to reset your MediLingo password</p>
            </div>

            <p style="color: #4b5563; margin-bottom: 20px;">
                Use the OTP code below to reset your password:
            </p>

            <div class="otp-box">
                <div class="otp-label">Your OTP Code</div>
                <div class="otp-code">${otp}</div>
            </div>

            <div class="expiry-notice">
                <p class="expiry-text">
                    ⏱️ <strong>This OTP is valid for 10 minutes only.</strong> 
                    Please use it promptly to reset your password.
                </p>
            </div>

            <div class="warning">
                <p class="warning-text">
                    🚨 <strong>Security Notice:</strong> If you didn't request a password reset, 
                    please ignore this email and ensure your account is secure.
                </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
                If you have any questions or concerns, please contact our support team.
            </p>

            <div class="footer">
                <p class="footer-text">© ${new Date().getFullYear()} MediLingo. All rights reserved.</p>
            </div>
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

    console.log(`✅ OTP email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send OTP email:`, error.message);
    throw error;
  }
};

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
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    console.log('📧 Processing forgot password request for:', email);

    // Wait for DB connection
    if (!dbReady) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({ 
        success: true, 
        message: 'If an account with that email exists, we have sent a password reset OTP.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to user
    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save();

    console.log('💾 OTP saved to database for user:', email);

    // Send OTP email
    await sendOTPEmail(email, otp);

    return res.status(200).json({ 
      success: true, 
      message: 'Password reset OTP has been sent to your email. Please check your inbox.' 
    });

  } catch (error: any) {
    console.error('❌ Error in forgot password:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to process password reset request. Please try again.',
      error: error.message 
    });
  }
}
