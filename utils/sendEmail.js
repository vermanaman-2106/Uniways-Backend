import transporter from '../config/email.js';

export const sendPasswordResetEmail = async (email, resetToken) => {
  // Check if transporter is available
  if (!transporter) {
    throw new Error('Email transporter is not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
  }

  try {
    // Create reset URL
    // In production, this should be your frontend URL
    const resetUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
      : `http://localhost:8081/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Uniways" <${process.env.EMAIL_USER?.trim()}>`,
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

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully');
    console.log('📧 Email sent to:', email);
    console.log('📎 Message ID:', info.messageId);
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

