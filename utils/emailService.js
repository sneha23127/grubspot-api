const nodemailer = require('nodemailer');

/**
 * Creates a Nodemailer transporter based on SMTP configuration in .env.
 * Falls back to an auto-generated Ethereal email test account if credentials are not configured.
 */
async function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Check if SMTP is configured and is not the placeholder string
  const isSMTPConfigured = user && pass && user !== 'your-email@gmail.com' && pass !== 'your-app-password';

  if (isSMTPConfigured) {
    console.log(`🔌 Establishing real SMTP connection to ${host}:${port}...`);
    return {
      transporter: nodemailer.createTransport({
        host: host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465, // true for 465, false for others
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false
        }
      }),
      fromAddress: process.env.SMTP_FROM || `"GrubSpot" <${user}>`,
      isTestAccount: false
    };
  } else {
    console.log('🔌 No SMTP credentials configured. Generating temporary Ethereal test email account...');
    const testAccount = await nodemailer.createTestAccount();
    return {
      transporter: nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      }),
      fromAddress: `"GrubSpot Support" <${testAccount.user}>`,
      isTestAccount: true
    };
  }
}

/**
 * Send password recovery OTP via SMTP.
 * @param {string} email Target recipient email
 * @param {string} otp The 6-digit OTP code
 */
async function sendOtpEmail(email, otp) {
  try {
    const { transporter, fromAddress, isTestAccount } = await getTransporter();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f7f7f7;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e0e0e0;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
          }
          .header {
            background-color: #F26B2E;
            padding: 30px;
            text-align: center;
            color: #ffffff;
          }
          .logo-badge {
            background: rgba(255, 255, 255, 0.2);
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 12px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px;
            color: #1A1A1A;
            line-height: 1.6;
          }
          .content p {
            font-size: 16px;
            margin-bottom: 24px;
          }
          .otp-box {
            background-color: #FFEFE6;
            border: 2px dashed #F26B2E;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #F26B2E;
            margin: 30px 0;
          }
          .footer {
            background-color: #1A1A1A;
            padding: 24px;
            text-align: center;
            color: #b0b0b0;
            font-size: 12px;
          }
          .footer a {
            color: #F26B2E;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo-badge">GS</div>
            <h1>GrubSpot Account Recovery</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset the password for your GrubSpot account. Please use the verification code below to verify your identity and complete the password reset process:</p>
            <div class="otp-box">${otp}</div>
            <p><strong>Note:</strong> This verification code is valid for 10 minutes. If you did not request a password reset, please ignore this email or contact support if you have security concerns.</p>
            <p>Best regards,<br>The GrubSpot Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 GrubSpot. Discover home-style mess services near you.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: fromAddress,
      to: email,
      subject: '🔑 GrubSpot Password Reset Verification Code',
      text: `Hello, use the verification code ${otp} to reset your GrubSpot password. It is valid for 10 minutes.`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email successfully sent to ${email} (MessageId: ${info.messageId})`);

    let previewUrl = null;
    if (isTestAccount) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`🔗 Ethereal Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl
    };
  } catch (error) {
    console.error('❌ Failed to send email via SMTP:', error);
    throw error;
  }
}

module.exports = { sendOtpEmail };
