import dotenv from 'dotenv';
dotenv.config();

import transporter from './config/email.js';
import { sendPasswordResetEmail } from './utils/sendEmail.js';

// Test email configuration
async function testEmail() {
  console.log('🧪 Testing email configuration...\n');
  
  // Check if transporter exists
  if (!transporter) {
    console.error('❌ Email transporter is not configured');
    console.log('\n📋 To fix this:');
    console.log('1. Add EMAIL_USER to your .env file');
    console.log('2. Add EMAIL_PASSWORD to your .env file');
    console.log('3. Make sure to use Gmail App Password (not regular password)');
    console.log('4. See EMAIL_SETUP.md for instructions');
    process.exit(1);
  }

  // Verify transporter
  try {
    await transporter.verify();
    console.log('✅ Email transporter verified successfully\n');
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error.message);
    console.error('\n💡 Common issues:');
    console.error('   - Wrong email or password');
    console.error('   - App password expired or incorrect');
    console.error('   - 2-Step Verification not enabled');
    process.exit(1);
  }

  // Test sending email
  const testEmail = process.env.EMAIL_USER;
  const testToken = 'test-token-' + Date.now();

  console.log(`📧 Attempting to send test email to: ${testEmail}`);
  
  try {
    await sendPasswordResetEmail(testEmail, testToken);
    console.log('✅ Test email sent successfully!');
    console.log('\n📬 Please check your inbox (and spam folder)');
    console.log(`   Email should contain reset token: ${testToken}`);
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testEmail();


