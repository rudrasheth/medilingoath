# 🏥 Patient Portal - Quick Start Guide

## What's New?

Your MediLingo application now has a **complete Patient Portal** with:
- 📋 Patient Dashboard with health overview
- 👤 Patient Profile Management
- 📅 Appointment Booking System
- 💊 Prescription Management
- 📊 Health Records
- ⏰ Medical History Timeline

## ⚡ Quick Start (5 Minutes)

### 1. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
**Frontend runs at:** http://localhost:5173

### 2. Start Backend (Choose One)

**Option A - Local Express Server:**
```bash
cd server
npm install
npm run dev
```
**Backend runs at:** http://localhost:3000

**Option B - Use Vercel API (for development):**
- Update `frontend/.env.local`
- Set `VITE_API_URL=https://medilingoath.vercel.app`

### 3. Test the Patient Portal
1. Open http://localhost:5173
2. Sign up for a new account
3. Login
4. Click "Patient Portal" button in navigation
5. Explore the dashboard!

## 🎯 Features to Test

### Dashboard
- View appointment summary
- Quick stats on prescriptions and health records
- Quick action buttons

### Patient Profile (`/patient/profile`)
- Edit personal info (age, gender, blood type)
- Add medical conditions
- Manage emergency contacts
- Track allergies and medications

### Appointments (`/patient/appointments`)
- Book new appointment with doctor
- View upcoming appointments
- See appointment details and status

### Prescriptions, Health Records, Medical History
- View all historical data
- Timeline view of medical history

## 📍 Key Files Created

```
✅ frontend/src/components/patient/
   ├── PatientDashboard.tsx         (Main dashboard)
   ├── PatientProfile.tsx           (Profile management)
   ├── BookAppointmentPatient.tsx   (Appointment form)
   ├── UpcomingAppointments.tsx     (View appointments)
   ├── MyPrescriptions.tsx          (Prescriptions view)
   ├── HealthRecords.tsx            (Health records)
   └── MedicalHistory.tsx           (Timeline view)

✅ frontend/src/pages/
   └── PatientPage.tsx              (Page wrapper)

✅ api/patient/
   ├── data.ts                      (Patient data API)
   ├── profile.ts                   (Profile API)
   └── appointments.ts              (Appointments API)

✅ frontend/.env.local              (Environment variables)
```

## 🔒 How Authentication Works

1. **Sign Up/Login** → JWT token created
2. **Token Stored** → Saved in localStorage
3. **Patient Portal** → Uses token to fetch user data
4. **All API Calls** → Include JWT in Authorization header

## 🌐 Navigation

**After Login, New Button Added:**
```
Navigation Bar:
├── Patient Portal (NEW!)
├── Profile
└── Logout
```

**Patient Portal Routes:**
- `/patient` → Dashboard
- `/patient/dashboard` → Dashboard
- `/patient/profile` → Profile Management

## 📡 API Endpoints (All Require JWT)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/patient/data` | Get all patient data |
| GET | `/api/patient/profile` | Get profile info |
| PUT | `/api/patient/profile` | Update profile |
| GET | `/api/patient/appointments` | Get appointments |
| POST | `/api/patient/appointments` | Book appointment |
| PUT | `/api/patient/appointments` | Update appointment |
| DELETE | `/api/patient/appointments` | Cancel appointment |

## ✨ Example: Book an Appointment

```json
POST /api/patient/appointments
Authorization: Bearer <token>

{
  "doctorName": "Dr. John Smith",
  "specialty": "Cardiology",
  "date": "2026-01-15",
  "time": "14:30",
  "location": "City Medical Center",
  "reason": "Heart checkup and follow-up"
}
```

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Patient Portal button not showing | Make sure you're logged in |
| API 401 errors | Check if JWT token is in localStorage |
| Can't book appointment | Ensure all fields are filled |
| MongoDB connection error | Start MongoDB: `mongod` |
| CORS errors | Verify API URL in .env.local |

## 🎓 Testing Checklist

- [ ] Signup creates account
- [ ] Login with valid credentials works
- [ ] "Patient Portal" button appears after login
- [ ] Dashboard loads with stats
- [ ] Can book an appointment
- [ ] Appointment appears in list
- [ ] Can edit profile
- [ ] Changes save to database
- [ ] Can view medical history
- [ ] Logout works

## 📚 More Information

For detailed setup and testing: See `PATIENT_PORTAL_SETUP.md`

## 🚀 Deployment

When ready to deploy:

```bash
# Update env to production API
# .env.local:
VITE_API_URL=https://your-api-domain.com

# Build frontend
npm run build

# Deploy to Vercel, Netlify, or your hosting
```

## ❓ Need Help?

1. Check console (F12) for errors
2. Review PATIENT_PORTAL_SETUP.md
3. Check MongoDB is running
4. Verify .env.local has correct API_URL
5. Clear cache/localStorage if needed

---

**Ready to Go! Start with `npm run dev` in frontend folder 🎉**
