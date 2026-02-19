import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  } : undefined,
});

export async function sendPasswordResetEmail(to, code) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'HappyPause <noreply@happypause.local>',
    to,
    subject: 'HappyPause – Password Reset Code',
    text: `Your password reset code is: ${code}\n\nThis code expires in 15 minutes.`,
    html: `<p>Your password reset code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
  });
}

export async function sendChangePasswordCode(to, code) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'HappyPause <noreply@happypause.local>',
    to,
    subject: 'HappyPause – Change Password Code',
    text: `Your change password code is: ${code}\n\nThis code expires in 15 minutes.`,
    html: `<p>Your change password code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
  });
}

export async function sendEmailChangeCode(to, code, isNewEmail = false) {
  const subject = isNewEmail ? 'HappyPause – Verify New Email' : 'HappyPause – Verify Current Email';
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'HappyPause <noreply@happypause.local>',
    to,
    subject,
    text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code expires in 15 minutes.</p>`,
  });
}

export async function sendDeleteAccountCode(to, code) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'HappyPause <noreply@happypause.local>',
    to,
    subject: 'HappyPause – Delete Account Code',
    text: `Your account deletion code is: ${code}\n\nThis code expires in 15 minutes. If you did not request this, ignore this email.`,
    html: `<p>Your account deletion code is: <strong>${code}</strong></p><p>This code expires in 15 minutes. If you did not request this, ignore this email.</p>`,
  });
}
