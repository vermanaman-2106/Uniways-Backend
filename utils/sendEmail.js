import transporter from '../config/email.js';

// --- Resend helper ----------------------------------------------------------
const hasResend = !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '';

async function sendViaResend({ from, to, subject, html, text }) {
  if (!hasResend) {
    throw new Error('RESEND_API_KEY not configured');
  }
  const apiKey = process.env.RESEND_API_KEY.trim();
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API error: ${response.status} ${body}`);
  }
  const json = await response.json();
  console.log('✅ Resend email accepted:', json?.id || json);
  return true;
}

export const sendPasswordResetEmail = async (email, resetToken) => {
  const fromAddress = `"Uniways" <${process.env.FROM_ADDRESS?.trim() || process.env.EMAIL_USER?.trim() || 'no-reply@uniways.local'}>`;

  try {
    // Create reset URL
    // In production, this should be your frontend URL
    const resetUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      : `http://localhost:8081/reset-password?token=${resetToken}`;

    const mail = {
      from: fromAddress,
      to: email,
      subject: 'Password Reset Request - Uniways',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background-color: #ffffff;
                border-radius: 8px;
                padding: 30px;
                border: 1px solid #e0e0e0;
              }
              .header {
                background-color: #FF6B35;
                color: #ffffff;
                padding: 20px;
                border-radius: 8px 8px 0 0;
                text-align: center;
              }
              .content {
                padding: 30px 20px;
              }
              .button {
                display: inline-block;
                background-color: #FF6B35;
                color: #ffffff;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 24px;
                margin: 20px 0;
                font-weight: bold;
              }
              .button:hover {
                background-color: #E55A2B;
              }
              .token-box {
                background-color: #FFF5F0;
                border: 2px solid #FF6B35;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                word-break: break-all;
                font-family: monospace;
                font-size: 12px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
              .warning {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Uniways</h1>
                <p>Password Reset Request</p>
              </div>
              
              <div class="content">
                <p>Hello,</p>
                
                <p>You have requested to reset your password for your Uniways account.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <div class="token-box">
                  ${resetUrl}
                </div>
                
                <p><strong>If you didn't request this, please ignore this email.</strong></p>
                
                <div class="warning">
                  <p><strong>⚠️ Security Notice:</strong></p>
                  <ul>
                    <li>This link will expire in 10 minutes</li>
                    <li>If the link doesn't work, you can manually enter the token below</li>
                    <li>Never share this token with anyone</li>
                  </ul>
                </div>
                
                <p>Or use this reset token manually:</p>
                <div class="token-box">
                  <strong>Reset Token:</strong><br>
                  ${resetToken}
                </div>
                
                <p>Thank you,<br>The Uniways Team</p>
              </div>
              
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Uniways. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
        Password Reset Request - Uniways
        
        You have requested to reset your password for your Uniways account.
        
        Reset your password by clicking this link:
        ${resetUrl}
        
        Or use this reset token manually:
        ${resetToken}
        
        This link will expire in 10 minutes.
        
        If you didn't request this, please ignore this email.
        
        Thank you,
        The Uniways Team
      `,
    };

    if (hasResend) {
      await sendViaResend(mail);
    } else {
      if (!transporter) {
        throw new Error('Email transporter is not configured. Please set EMAIL_USER/EMAIL_PASSWORD, SENDGRID_API_KEY, or RESEND_API_KEY in .env file');
      }
      const info = await transporter.sendMail(mail);
      console.log('✅ Password reset email sent:', info.messageId);
    }
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
    });
    throw error;
  }
};

export const sendAppointmentNotificationEmail = async ({
  toEmail,
  facultyName,
  studentName,
  studentEmail,
  date,
  time,
  duration,
  reason,
}) => {
  const fromAddress = `"Uniways" <${process.env.FROM_ADDRESS?.trim() || process.env.EMAIL_USER?.trim() || 'no-reply@uniways.local'}>`;

  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const subject = `New Appointment Request from ${studentName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #eaeaea; }
          .header { background-color: #FF6B35; color: #ffffff; padding: 16px 20px; border-radius: 8px 8px 0 0; }
          .title { margin: 0; }
          .row { margin: 8px 0; }
          .label { color: #555; }
          .footer { margin-top: 24px; font-size: 12px; color: #777; text-align: center; }
          .badge { display: inline-block; background: #FFF5F0; border: 1px solid #FF6B35; color: #E55A2B; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="title">New Appointment Request</h2>
          </div>
          <div style="padding: 16px 8px;">
            <p>Dear ${facultyName || 'Faculty'},</p>
            <p><strong>${studentName}</strong> (${studentEmail}) has requested an appointment.</p>
            <div class="row"><span class="label">Date:</span> <strong>${formattedDate}</strong></div>
            <div class="row"><span class="label">Time:</span> <strong>${time}</strong></div>
            <div class="row"><span class="label">Duration:</span> <strong>${duration} minutes</strong></div>
            <div class="row"><span class="label">Reason:</span> <span class="badge">${reason}</span></div>
            <p>You can approve or reject this request in the Uniways app.</p>
            <p>Thank you,<br/>Uniways</p>
          </div>
          <div class="footer">This is an automated email regarding appointment requests.</div>
        </div>
      </body>
    </html>
  `;

  const text = `New Appointment Request\n\n` +
    `Student: ${studentName} (${studentEmail})\n` +
    `Date: ${formattedDate}\nTime: ${time}\nDuration: ${duration} minutes\nReason: ${reason}`;
  const mail = { from: fromAddress, to: toEmail, subject, html, text };

  try {
    if (hasResend) {
      await sendViaResend(mail);
    } else {
      if (!transporter) {
        throw new Error('Email transporter is not configured. Please set EMAIL_USER/EMAIL_PASSWORD, SENDGRID_API_KEY, or RESEND_API_KEY in .env file');
      }
      const info = await transporter.sendMail(mail);
      console.log('✅ Appointment notification email sent to faculty:', toEmail, 'messageId:', info.messageId);
    }
    return true;
  } catch (error) {
    console.error('❌ Error sending appointment notification email:', error);
    throw error;
  }
};

export const sendAppointmentStatusEmail = async ({
  toEmail,
  studentName,
  facultyName,
  status,
  date,
  time,
  duration,
  reason,
  meetingLink,
  facultyNotes,
}) => {
  const fromAddress = `"Uniways" <${process.env.FROM_ADDRESS?.trim() || process.env.EMAIL_USER?.trim() || 'no-reply@uniways.local'}>`;

  const formattedDate = new Date(date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  const normalized = (status || '').toLowerCase();
  const prettyStatus = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  const subject = `Your appointment was ${prettyStatus}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #eaeaea; }
          .header { background-color: #FF6B35; color: #ffffff; padding: 16px 20px; border-radius: 8px 8px 0 0; }
          .title { margin: 0; }
          .row { margin: 8px 0; }
          .label { color: #555; }
          .badge { display: inline-block; background: #FFF5F0; border: 1px solid #FF6B35; color: #E55A2B; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
          .footer { margin-top: 24px; font-size: 12px; color: #777; text-align: center; }
          .note { background:#f7f7f7; border:1px solid #eee; padding:12px; border-radius:8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 class="title">Appointment ${prettyStatus}</h2>
          </div>
          <div style="padding: 16px 8px;">
            <p>Hi ${studentName || 'Student'},</p>
            <p>Your appointment with <strong>${facultyName || 'Faculty'}</strong> has been <strong>${prettyStatus}</strong>.</p>
            <div class="row"><span class="label">Date:</span> <strong>${formattedDate}</strong></div>
            <div class="row"><span class="label">Time:</span> <strong>${time}</strong></div>
            <div class="row"><span class="label">Duration:</span> <strong>${duration} minutes</strong></div>
            <div class="row"><span class="label">Reason:</span> <span class="badge">${reason}</span></div>
            ${meetingLink ? `<div class="row"><span class="label">Meeting Link:</span> <a href="${meetingLink}">${meetingLink}</a></div>` : ''}
            ${facultyNotes ? `<div class="row note"><span class="label">Faculty Notes:</span><br/>${facultyNotes}</div>` : ''}
            <p>Thank you,<br/>Uniways</p>
          </div>
          <div class="footer">This is an automated email regarding appointment updates.</div>
        </div>
      </body>
    </html>
  `;

  const text = `Appointment ${prettyStatus}\n\n` +
    `Faculty: ${facultyName}\n` +
    `Date: ${formattedDate}\nTime: ${time}\nDuration: ${duration} minutes\nReason: ${reason}` +
    (meetingLink ? `\nMeeting Link: ${meetingLink}` : '') +
    (facultyNotes ? `\nFaculty Notes: ${facultyNotes}` : '');
  const mail = { from: fromAddress, to: toEmail, subject, html, text };

  try {
    if (hasResend) {
      await sendViaResend(mail);
    } else {
      if (!transporter) {
        throw new Error('Email transporter is not configured. Please set EMAIL_USER/EMAIL_PASSWORD, SENDGRID_API_KEY, or RESEND_API_KEY in .env file');
      }
      const info = await transporter.sendMail(mail);
      console.log('✅ Appointment status email sent to student:', toEmail, 'messageId:', info.messageId);
    }
    return true;
  } catch (error) {
    console.error('❌ Error sending appointment status email:', error);
    throw error;
  }
};

