const nodemailer = require('nodemailer');
require('dotenv').config({ path: '../.env' });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOTP = async (email, otp, name = '') => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '🔐 Your Digital Pledge System — Login OTP',
        html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0;">
        <div style="max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Digital Culture Pledge System</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px;">Secure Login Verification</p>
          </div>
          <div style="padding: 40px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hello <strong>${name || email}</strong>,</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Use the following One-Time Password (OTP) to complete your login. This code expires in <strong>${process.env.OTP_EXPIRES_MINUTES || 10} minutes</strong>.</p>
            <div style="background: #f0f4ff; border: 2px dashed #2563eb; border-radius: 10px; padding: 24px; text-align: center; margin: 0 0 24px;">
              <span style="font-size: 42px; font-weight: 800; letter-spacing: 14px; color: #1e3a5f;">${otp}</span>
            </div>
            <p style="color: #ef4444; font-size: 13px; background: #fef2f2; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #ef4444;">⚠️ Never share this OTP with anyone. Our team will never ask for it.</p>
          </div>
          <div style="background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Digital Culture Pledge System. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    };

    await transporter.sendMail(mailOptions);
};

const sendReminderEmail = async (email, name, pledgeCount) => {
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: '📋 Reminder: Complete Your Digital Culture Pledge',
        html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0;">
        <div style="max-width: 500px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 40px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Digital Culture Pledge System</h1>
          </div>
          <div style="padding: 40px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 20px;">Hello <strong>${name}</strong>,</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px;">This is a friendly reminder that you have <strong>${pledgeCount} pending pledge(s)</strong> awaiting review. Please log in to check the status.</p>
            <a href="${process.env.CLIENT_URL}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">View My Pledges →</a>
          </div>
          <div style="background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Digital Culture Pledge System</p>
          </div>
        </div>
      </body>
      </html>
    `,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP, sendReminderEmail };
