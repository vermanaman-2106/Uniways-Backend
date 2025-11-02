# Email Configuration for Password Reset

This guide explains how to set up email authentication for the forgot password feature.

## Quick Start - SendGrid (Recommended for Production)

### Option 1: SendGrid (Recommended)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create API key with "Mail Send" permissions
3. Verify your sender email in SendGrid dashboard
4. Add to `backend/.env`:

```env
SENDGRID_API_KEY=your-sendgrid-api-key-here
FRONTEND_URL=http://localhost:8081
```

**That's it!** The app will automatically use SendGrid.

### Option 2: Gmail (For Development/Testing)

Add these to your `backend/.env` file:

```env
# Email Configuration (for Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (for reset password link)
FRONTEND_URL=http://localhost:8081

# Node Environment
NODE_ENV=development
```

## Setting Up Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Navigate to Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this 16-character password as `EMAIL_PASSWORD`

3. **Update `.env` file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The app password (remove spaces)
   ```

## Alternative Email Services

### Using SMTP (Any Provider)
Update `backend/config/email.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,        // e.g., smtp.gmail.com
  port: process.env.EMAIL_PORT || 587,
  secure: false,                       // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

### Using SendGrid (Recommended for Production)

1. Sign up at [SendGrid](https://sendgrid.com/)
2. Create an API key
3. Update `backend/config/email.js`:

```javascript
const transporter = nodemailer.createTransport({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY,
  },
});
```

4. Update `.env`:
```env
SENDGRID_API_KEY=your-sendgrid-api-key
```

### Using Mailgun

1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Get your SMTP credentials
3. Update `.env`:
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-smtp-user
EMAIL_PASSWORD=your-mailgun-smtp-password
```

## Testing Email Configuration

1. Start your backend server:
   ```bash
   cd backend
   npm start
   ```

2. The server will automatically verify the email transporter on startup
3. Look for: "Email server is ready to send messages" in console

## Troubleshooting

### Email Not Sending

1. **Check environment variables** are loaded correctly
2. **Verify email credentials** are correct
3. **Check console logs** for specific error messages
4. **Test transporter** - the server logs errors if email config is wrong

### Gmail Issues

- Make sure 2FA is enabled
- Use App Password, not regular password
- Remove spaces from app password in `.env`

### Development Mode

If email fails in development, the server will return the reset token in the response for testing purposes.

## Production Considerations

1. **Use a proper email service** (SendGrid, Mailgun, AWS SES)
2. **Don't expose tokens** if email fails
3. **Set proper FRONTEND_URL** for production
4. **Rate limiting** - Consider adding rate limits to prevent abuse
5. **Email templates** - Customize email template in `backend/utils/sendEmail.js`

