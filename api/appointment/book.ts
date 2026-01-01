import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

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

// Send appointment confirmation email
const sendAppointmentConfirmation = async (details: {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  specialty: string;
  notes?: string;
}) => {
  try {
    const transporter = createEmailTransporter();
    const { name, email, phone, date, time, specialty, notes } = details;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Appointment Confirmation</title>
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
                color: #2563eb;
                margin-bottom: 10px;
            }
            .subtitle {
                font-size: 16px;
                color: #6b7280;
            }
            .details-box {
                background-color: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin: 25px 0;
            }
            .detail-row {
                display: flex;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #374151;
                min-width: 120px;
            }
            .detail-value {
                color: #6b7280;
            }
            .notice {
                background-color: #dbeafe;
                border-left: 4px solid #2563eb;
                padding: 15px;
                border-radius: 4px;
                margin: 25px 0;
            }
            .notice-text {
                color: #1e40af;
                font-weight: 500;
                margin: 0;
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
                <h1 class="title">✅ Appointment Confirmed</h1>
                <p class="subtitle">Your appointment has been successfully booked</p>
            </div>

            <p style="color: #4b5563; margin-bottom: 20px;">
                Dear <strong>${name}</strong>,
            </p>

            <p style="color: #6b7280; margin-bottom: 25px;">
                Thank you for booking an appointment with MediLingo. Below are your appointment details:
            </p>

            <div class="details-box">
                <div class="detail-row">
                    <span class="detail-label">📅 Date:</span>
                    <span class="detail-value">${date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🕐 Time:</span>
                    <span class="detail-value">${time}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🩺 Specialty:</span>
                    <span class="detail-value">${specialty}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📞 Phone:</span>
                    <span class="detail-value">${phone}</span>
                </div>
                ${notes ? `
                <div class="detail-row">
                    <span class="detail-label">📝 Notes:</span>
                    <span class="detail-value">${notes}</span>
                </div>
                ` : ''}
            </div>

            <div class="notice">
                <p class="notice-text">
                    📱 Our team will contact you shortly to confirm your appointment.
                    Please be available at the scheduled time.
                </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 25px;">
                If you need to reschedule or have any questions, please contact our support team.
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
      subject: 'MediLingo - Appointment Confirmation',
      html: htmlContent
    });

    console.log(`✅ Appointment confirmation sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send appointment confirmation:`, error.message);
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
    const { name, email, phone, date, time, specialty, notes } = req.body;

    // Validation
    if (!name || !email || !phone || !date || !time || !specialty) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, email, phone, date, time, and specialty are required' 
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

    console.log('📥 Processing appointment booking for:', email);

    // Send confirmation email
    await sendAppointmentConfirmation({
      name,
      email,
      phone,
      date,
      time,
      specialty,
      notes
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Appointment booked successfully. Confirmation email sent!' 
    });

  } catch (error: any) {
    console.error('❌ Error booking appointment:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to book appointment. Please try again.',
      error: error.message 
    });
  }
}
