import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const roleName = role === 'recruiter' ? 'Recruiter' : 'Candidate';

    const mailOptions = {
      from: `"TalentMesh" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Welcome to TalentMesh, ${name}!`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Welcome to TalentMesh!</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>We are thrilled to have you join us as a <strong>${roleName}</strong>. TalentMesh is designed to bridge the gap between talented individuals and great companies through AI-powered recruiting.</p>
          <p>Here are your first steps:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore our dashboard</li>
            <li>Start connecting with opportunities</li>
          </ul>
          <p>If you have any questions, feel any free to reply to this email.</p>
          <p>Best regards,<br/>The TalentMesh Team</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #777;">&copy; ${new Date().getFullYear()} TalentMesh. All rights reserved.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ success: true, message: 'Welcome email sent successfully' });
  } catch (err: any) {
    console.error('Error sending welcome email:', err);
    return NextResponse.json({ error: err.message || 'Failed to send welcome email' }, { status: 500 });
  }
}
