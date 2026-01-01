# Email Configuration for Vercel Production

## Overview
The appointment booking feature sends confirmation emails to users. To enable this on Vercel production, you need to configure Gmail SMTP environment variables.

## Environment Variables Required

Add these to your Vercel project settings:

### 1. **EMAIL_USER** 
- **Value**: Your Gmail address (e.g., `stockmaster577@gmail.com`)
- **Purpose**: The sender email address for appointment confirmations

### 2. **EMAIL_PASS**
- **Value**: Gmail App Password (NOT your regular password)
- **Purpose**: Authentication for Gmail SMTP server

## How to Get Gmail App Password

1. Go to: https://myaccount.google.com/security
2. Enable "2-Step Verification" if not already enabled
3. Go to "App passwords" (will appear once 2FA is enabled)
4. Select "Mail" and "Windows Computer" (or your device)
5. Generate and copy the 16-character password
6. Use this password as `EMAIL_PASS`

## Steps to Add to Vercel

1. Go to: https://vercel.com/rudrasheth2201-8352s-projects/medilingoath/settings/environment-variables

2. Add these variables with their respective values:
   - **EMAIL_USER**: `stockmaster577@gmail.com`
   - **EMAIL_PASS**: `<your 16-char app password>`

3. Select scope: **Production, Preview, Development**

4. Click "Save"

5. **Important**: Redeploy the project for changes to take effect:
   ```bash
   vercel --prod
   ```

## What It Enables

✅ Appointment confirmation emails sent to user's email address  
✅ Automatic email notifications when appointments are booked  
✅ Professional HTML-formatted email templates  

## Email Features

- **Appointment Confirmation**: Sent immediately after booking with appointment details
- **OTP Emails**: For password reset functionality  
- **Welcome Emails**: For new user registrations  

## Testing Locally

Emails work automatically on local development if `.env.local` has these variables set:

```
EMAIL_USER=stockmaster577@gmail.com
EMAIL_PASS=obuauvyjlerywxke
```

## Troubleshooting

If emails aren't being sent:

1. Check Vercel environment variables are set correctly
2. Verify 2-step verification is enabled on Gmail account
3. Check that App Password (not regular password) is being used
4. Look at Vercel deployment logs for email service errors
5. Ensure Vercel deployment has completed after adding env vars

## Gmail Security Warning

- Never use your regular Gmail password in code or env variables
- Always use "App Password" for third-party applications
- If you suspect compromise, regenerate the app password

## Additional Resources

- [Nodemailer Gmail Setup](https://nodemailer.com/smtp/gmail/)
- [Gmail App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
