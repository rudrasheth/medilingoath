import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Helper function to generate JWT
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '24h' });
};

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'stockmaster577@gmail.com',
      pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD || 'your-app-password-here'
    }
  });
};

// Send welcome email
const sendWelcomeEmail = async (userEmail: string, userName: string) => {
  try {
    const transporter = createEmailTransporter();
    
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MediLingo</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #10b981;
                margin-bottom: 10px;
            }
            .welcome-title {
                font-size: 24px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 20px;
            }
            .welcome-text {
                font-size: 16px;
                color: #6b7280;
                margin-bottom: 30px;
                line-height: 1.5;
            }
            .getting-started {
                margin-bottom: 30px;
            }
            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 15px;
            }
            .feature-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .feature-item {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                font-size: 15px;
                color: #4b5563;
            }
            .feature-icon {
                margin-right: 12px;
                font-size: 18px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                margin: 20px 0;
                transition: transform 0.2s;
            }
            .cta-button:hover {
                transform: translateY(-1px);
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #9ca3af;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🏥 MediLingo</div>
            </div>
            
            <h1 class="welcome-title">Welcome to MediLingo, ${userName}! 👋</h1>
            
            <p class="welcome-text">
                Thank you for creating your account. We're excited to help you manage your health with MediLingo!
            </p>
            
            <div class="getting-started">
                <h2 class="section-title">Getting Started:</h2>
                <ul class="feature-list">
                    <li class="feature-item">
                        <span class="feature-icon">📱</span>
                        Scan prescriptions for instant analysis
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">💊</span>
                        Manage your medications and reminders
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">🏥</span>
                        Find nearby hospitals and pharmacies
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">🤖</span>
                        Chat with our AI health assistant
                    </li>
                    <li class="feature-item">
                        <span class="feature-icon">💰</span>
                        Compare medicine prices
                    </li>
                </ul>
            </div>
            
            <div style="text-align: center;">
                <a href="https://medilingoath.vercel.app" class="cta-button">
                    Start Using MediLingo →
                </a>
            </div>
            
            <div class="footer">
                <p>Need help? Contact us at support@medilingo.com</p>
                <p>© 2024 MediLingo. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: '"MediLingo Team" <stockmaster577@gmail.com>',
      to: userEmail,
      subject: `Welcome to MediLingo, ${userName}! 🏥`,
      html: htmlContent,
      text: `Welcome to MediLingo, ${userName}!\n\nThank you for creating your account. We're excited to help you manage your health with MediLingo!\n\nGetting Started:\n• Scan prescriptions for instant analysis\n• Manage your medications and reminders\n• Find nearby hospitals and pharmacies\n• Chat with our AI health assistant\n• Compare medicine prices\n\nStart using MediLingo: https://medilingoath.vercel.app\n\nNeed help? Contact us at support@medilingo.com`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  age: Number,
  gender: { type: String, enum: ['Male', 'Female'] },
  createdAt: { type: Date, default: Date.now },
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, age, gender } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Get or create User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, name, age, gender });
    const token = generateToken(user._id.toString());
    
    // Send welcome email (don't wait for it to complete)
    console.log('📧 Attempting to send welcome email to:', email);
    console.log('📧 Email password configured:', (process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD) ? 'Yes' : 'No');
    
    sendWelcomeEmail(email, name || 'User').then(success => {
      console.log('📧 Welcome email result:', success ? 'Success' : 'Failed');
    }).catch(err => {
      console.error('📧 Failed to send welcome email:', err);
    });
    
    return res.status(201).json({
      ok: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, age: user.age, gender: user.gender }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}