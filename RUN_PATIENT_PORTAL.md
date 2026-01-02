# 🚀 START HERE - Patient Portal Testing

## Quick Reference: How to Run Everything

### ⏱️ 2-Minute Setup

**Terminal 1: Frontend**
```bash
cd frontend
npm run dev
```
→ Opens at http://localhost:5173

**Terminal 2: Backend**
```bash
cd server
npm install  # (first time only)
npm run dev
```
→ Runs at http://localhost:3000

---

## 🎬 Testing the Patient Portal (3 Steps)

### Step 1: Create Account
1. Go to http://localhost:5173
2. Click "Sign Up"
3. Fill in the form:
   ```
   Name: John Doe
   Email: patient@example.com
   Password: password123
   Age: 30
   Gender: Male
   ```
4. Click "Sign Up"

### Step 2: Login
1. Click "Log In"
2. Enter credentials:
   ```
   Email: patient@example.com
   Password: password123
   ```
3. Click "Login"

### Step 3: Access Patient Portal
1. After login, click **"Patient Portal"** button in navigation
2. You should see the dashboard with:
   - Welcome message
   - Health stats cards
   - Tabbed interface

---

## 💡 What to Try

### Dashboard Tab
- See appointment count
- See prescription count
- Quick action buttons

### Appointments Tab
- Click "Book Appointment" button
- Fill in form:
  ```
  Doctor: Dr. Smith
  Specialty: Cardiology
  Date: Pick future date
  Time: 14:30
  Location: City Hospital
  Reason: Heart checkup
  ```
- Submit → Should see appointment in list

### Profile Tab
- Click "Edit Profile"
- Update information:
  - Age, Gender
  - Blood Type: O+
  - Allergies: Penicillin
- Add Emergency Contact:
  - Name: Mom
  - Relationship: Mother
  - Phone: +91-9876543210
- Click "Save Changes"

### Prescriptions Tab
- Will show when data is added

### Health Records Tab
- Will show when data is added

### History Tab
- Medical history timeline

---

## ✅ Verify Everything Works

- [ ] Frontend loads at http://localhost:5173
- [ ] Backend runs at http://localhost:3000
- [ ] Can sign up new account
- [ ] Can login
- [ ] "Patient Portal" button appears
- [ ] Dashboard loads
- [ ] Can book appointment
- [ ] Appointment shows in list
- [ ] Can update profile
- [ ] Profile saves successfully

---

## 🐛 If Something Breaks

### Patient Portal Button Not Showing?
→ Make sure you're logged in (check top right)

### Can't Book Appointment?
→ Check console (F12 → Console tab) for errors

### "Cannot find module" errors?
→ Run `npm install` in the folder again

### API Connection Error?
→ Make sure backend is running: `cd server && npm run dev`

### MongoDB Error?
→ Start MongoDB: `mongod` in another terminal

---

## 📍 Key Files Changed/Added

**New Files:**
- `frontend/src/components/patient/PatientDashboard.tsx`
- `frontend/src/components/patient/PatientProfile.tsx`
- `frontend/src/components/patient/BookAppointmentPatient.tsx`
- `frontend/src/components/patient/UpcomingAppointments.tsx`
- `frontend/src/components/patient/MyPrescriptions.tsx`
- `frontend/src/components/patient/HealthRecords.tsx`
- `frontend/src/components/patient/MedicalHistory.tsx`
- `frontend/src/pages/PatientPage.tsx`
- `api/patient/data.ts`
- `api/patient/profile.ts`
- `api/patient/appointments.ts`
- `frontend/.env.local`

**Updated Files:**
- `frontend/src/App.tsx` (added routes)
- `frontend/src/components/layout/GlassNav.tsx` (added button)

---

## 🌐 Endpoints Available

All require JWT token in header:
```
Authorization: Bearer <token>
```

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/patient/data` | GET | Get all patient data |
| `/api/patient/profile` | GET | Get profile info |
| `/api/patient/profile` | PUT | Update profile |
| `/api/patient/appointments` | GET | List appointments |
| `/api/patient/appointments` | POST | Book appointment |
| `/api/patient/appointments` | PUT | Update appointment |
| `/api/patient/appointments` | DELETE | Cancel appointment |

---

## 📚 Read These Docs

1. **PATIENT_PORTAL_QUICK_START.md** ← Start here
2. **PATIENT_PORTAL_SETUP.md** ← Detailed guide
3. **PATIENT_PORTAL_IMPLEMENTATION.md** ← Technical overview

---

## 🎯 Next After Testing

1. ✅ Test all features
2. ✅ Check database has data
3. ✅ Verify on mobile (responsive)
4. Then: Add more medical features if needed
5. Finally: Deploy to production

---

## ❓ Common Questions

**Q: Where's the data stored?**
A: MongoDB (local or Atlas)

**Q: Do I need to deploy to test?**
A: No, everything works on localhost

**Q: Can I use my own API?**
A: Yes, change VITE_API_URL in .env.local

**Q: How do I add more patients?**
A: Use sign up form - each signup creates a patient record

**Q: Can I delete patient data?**
A: Yes, through the database directly

---

**Ready? Start with:**
```bash
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd server && npm run dev
```

Then visit: **http://localhost:5173** 🎉
