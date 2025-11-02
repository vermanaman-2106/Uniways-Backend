import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check if email credentials are configured
const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && 
                       process.env.EMAIL_USER.trim() !== '' && 
                       process.env.EMAIL_PASSWORD.trim() !== '';

// Create reusable transporter (only if credentials are available)
let transporter = null;

// Check if SendGrid is configured (preferred for production)
const hasSendGrid = process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim() !== '';

if (hasSendGrid) {
  // Use SendGrid (recommended for production)
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY.trim(),
    },
  });

  // Verify transporter configuration (async to not block server startup)
  transporter.verify(function (error, success) {
    if (error) {
      console.error('❌ Email transporter verification error:', error.message);
      console.error('Error code:', error.code);
      console.warn('⚠️  Email configuration error. Password reset emails will not be sent.');
      console.warn('💡 SendGrid configuration issue:');
      console.warn('   1. Check SENDGRID_API_KEY is correct in .env');
      console.warn('   2. Verify API key has Mail Send permissions');
      console.warn('   3. Verify sender email in SendGrid dashboard');
      console.warn('📧 See EMAIL_SETUP.md for detailed instructions');
    } else {
      console.log('✅ Email server is ready to send messages');
      console.log('📧 Using SendGrid for email delivery');
    }
  });
} else if (hasEmailConfig) {
  // Fallback to Gmail (for development/testing)
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASSWORD.trim(),
    },
  });

  // Verify transporter configuration (async to not block server startup)
  transporter.verify(function (error, success) {
    if (error) {
      console.error('❌ Email transporter verification error:', error.message);
      console.error('Error code:', error.code);
      console.warn('⚠️  Email configuration error. Password reset emails will not be sent.');
      console.warn('💡 Gmail configuration issue:');
      console.warn('   1. EMAIL_USER and EMAIL_PASSWORD are set in .env');
      console.warn('   2. Gmail App Password is correct (generate new one if needed)');
      console.warn('   3. 2-Step Verification is enabled on Google account');
      console.warn('📧 See EMAIL_SETUP.md for detailed instructions');
    } else {
      console.log('✅ Email server is ready to send messages');
      console.log(`📧 Using Gmail: ${process.env.EMAIL_USER?.trim()}`);
    }
  });
} else {
  console.warn('⚠️  Email credentials not configured. Password reset emails will not be sent.');
  console.warn('💡 To enable email, add one of the following to your .env file:');
  console.warn('   Option 1 (Recommended): SENDGRID_API_KEY=your-sendgrid-api-key');
  console.warn('   Option 2: EMAIL_USER and EMAIL_PASSWORD (for Gmail)');
  console.warn('📧 See EMAIL_SETUP.md for configuration instructions');
}

export default transporter;

