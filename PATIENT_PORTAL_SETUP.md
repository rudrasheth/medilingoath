# MediLingo Patient Portal - Setup & Testing Guide

## Overview
The Patient Portal has been successfully implemented with the following features:

### ✨ Features Implemented

1. **Patient Dashboard**
   - Overview of upcoming appointments
   - Quick stats (appointments, prescriptions, health records, medical history)
   - Quick access links to all features
   - Tabbed interface for easy navigation

2. **Patient Profile Management**
   - Personal information (age, gender, blood type)
   - Medical information (allergies, current medications, medical conditions)
   - Emergency contacts management
   - Edit and save functionality

3. **Appointment Booking System**
   - Book appointments with doctors
   - Select specialty and doctor name
   - Schedule date and time
   - Add reason for visit
   - View upcoming appointments

4. **Prescription Management**
   - View all prescriptions
   - See prescribed medications
   - Track filled/pending prescriptions
   - Download and view prescriptions

5. **Health Records**
   - Store health records and test results
   - View medical test results
   - Download health records

6. **Medical History**
   - Timeline view of past visits and treatments
   - Track medical history chronologically

## 🚀 Running the Project Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas connection)
- npm or yarn

### Step 1: Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create/update .env.local
echo 'VITE_API_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your_gemini_key_here' > .env.local

# Start frontend dev server
npm run dev
```

The frontend will run on **http://localhost:5173**

### Step 2: Backend Setup (Local)

```bash
# Navigate to the root directory if using local Express server
cd ..

# For local testing, you need to run a local server
# Option A: Using existing Express setup from /server directory
cd server
npm install
npm run dev

# Server will run on http://localhost:3000
```

Or, if you want to use Vercel endpoints for development:
- Update `.env.local` to use `VITE_API_URL=https://medilingoath.vercel.app`

### Step 3: Environment Variables

**Frontend (.env.local):**
```
VITE_API_URL=http://localhost:3000
VITE_GEMINI_API_KEY=your_api_key
```

**Backend (.env in /server):**
```
MONGODB_URI=mongodb://localhost:27017/medilingo
JWT_SECRET=your_jwt_secret
PORT=3000
```

## 🔐 Authentication Flow

1. User signs up/logs in on landing page
2. JWT token is stored in localStorage
3. Navigate to Patient Portal at `/patient`
4. Patient data is automatically fetched using the token

## 📱 Accessing the Patient Portal

Once logged in, users can:
1. Click "Patient Portal" button in navigation
2. Or navigate directly to `http://localhost:5173/patient`
3. View their dashboard with all medical information

### Navigating Between Views

- **Dashboard**: `/patient` or `/patient/dashboard`
- **Profile**: `/patient/profile`

## 🔌 API Endpoints

All endpoints require Bearer token in Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

### Patient Data Endpoints

#### GET `/api/patient/data`
Fetch all patient data (appointments, prescriptions, medical history, etc.)

**Response:**
```json
{
  "appointments": [...],
  "prescriptions": [...],
  "medicalHistory": [...],
  "healthRecords": [...],
  "emergencyContacts": [...]
}
```

#### GET `/api/patient/profile`
Fetch patient profile information

**Response:**
```json
{
  "age": 30,
  "gender": "Male",
  "bloodType": "O+",
  "allergies": "Penicillin",
  "currentMedications": "Aspirin",
  "notes": "...",
  "medicalConditions": [...],
  "emergencyContacts": [...]
}
```

#### PUT `/api/patient/profile`
Update patient profile

**Request Body:**
```json
{
  "age": 30,
  "gender": "Male",
  "bloodType": "O+",
  "allergies": "...",
  "medications": "...",
  "notes": "...",
  "medicalConditions": [...],
  "emergencyContacts": [...]
}
```

#### GET `/api/patient/appointments`
Fetch all appointments

#### POST `/api/patient/appointments`
Book a new appointment

**Request Body:**
```json
{
  "doctorName": "Dr. John Doe",
  "specialty": "Cardiology",
  "date": "2026-01-15",
  "time": "14:30",
  "location": "City Hospital",
  "reason": "Heart checkup"
}
```

#### PUT `/api/patient/appointments`
Update appointment status

#### DELETE `/api/patient/appointments?appointmentId=xxx`
Cancel an appointment

## 🧪 Testing the Patient Portal

### Test Account
Use any account created through the signup process:
- Email: test@example.com
- Password: password123

### Test Scenarios

1. **Sign Up**
   - Create new patient account
   - Fill in all required fields

2. **Access Patient Portal**
   - Login with test account
   - Click "Patient Portal" button
   - Should see dashboard

3. **Book Appointment**
   - Click "Book Appointment" button
   - Fill in appointment details
   - Submit form
   - Appointment should appear in "Upcoming Appointments"

4. **Update Profile**
   - Go to Patient Profile
   - Click "Edit Profile"
   - Update medical information
   - Save changes
   - Data should persist

5. **View Medical History**
   - Check medical history timeline
   - View previous visits

## 📊 Database Schema

Patient document structure in MongoDB:

```javascript
{
  userId: String,              // Unique user ID
  email: String,               // User email
  age: Number,
  gender: String,              // Male/Female/Other
  bloodType: String,
  allergies: String,
  currentMedications: String,
  notes: String,
  medicalConditions: [{
    id: String,
    condition: String,
    diagnosedYear: Number,
    notes: String
  }],
  appointments: [{
    id: String,
    doctorName: String,
    specialty: String,
    date: Date,
    time: String,
    location: String,
    reason: String,
    status: String,            // confirmed/pending/cancelled
    createdAt: Date
  }],
  prescriptions: [...],
  healthRecords: [...],
  medicalHistory: [...],
  emergencyContacts: [{
    id: String,
    name: String,
    relationship: String,
    phone: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## 🐛 Troubleshooting

### Patient Portal Not Loading
- Check if user is logged in
- Verify JWT token in localStorage
- Check browser console for errors
- Ensure API_URL is correct in .env.local

### API Endpoints Returning 401
- Token may have expired
- Try logging in again
- Clear localStorage and login fresh

### MongoDB Connection Issues
- Ensure MongoDB is running locally
- Check MONGODB_URI in .env
- Verify network connection

### CORS Errors
- All endpoints have CORS headers enabled
- Check if frontend URL is allowed in API

## 📝 File Structure

```
frontend/src/
  components/
    patient/
      PatientDashboard.tsx         # Main dashboard
      PatientProfile.tsx           # Profile management
      BookAppointmentPatient.tsx   # Appointment booking
      UpcomingAppointments.tsx     # View appointments
      MyPrescriptions.tsx          # View prescriptions
      HealthRecords.tsx            # Health records
      MedicalHistory.tsx           # Medical history
  pages/
    PatientPage.tsx                # Patient page wrapper

api/
  patient/
    data.ts                        # Patient data endpoints
    profile.ts                     # Profile endpoints
    appointments.ts                # Appointment endpoints
```

## 🚀 Next Steps (After Local Testing)

1. **Deploy to Production**
   - Push code to GitHub
   - Deploy to Vercel
   - Update VITE_API_URL to production API

2. **Integrate with Existing Features**
   - Connect with doctor/clinic side
   - Integrate prescription processing
   - Add payment system for appointments

3. **Enhancements**
   - Add appointment reminders
   - Notification system
   - Document upload for prescriptions
   - PDF export of records

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API response in Network tab
3. Check server logs
4. Review error messages in console

---

**Patient Portal Ready for Testing! 🎉**
