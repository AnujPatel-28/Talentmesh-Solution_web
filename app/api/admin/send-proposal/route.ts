import { NextResponse } from 'next/server';
import { createClient } from '@insforge/sdk';
import { sendEmail, customProposalEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recruiterId, email, name, company, features, price } = body;

    if (!email || !price || !features) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Insert into custom_proposals
    const supabaseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
    const serviceKey = process.env.INSFORGE_SERVICE_KEY;
    
    if (supabaseUrl && serviceKey) {
      const insforge = createClient({ 
        baseUrl: supabaseUrl, 
        anonKey: serviceKey,
        isServerMode: true 
      });

      await insforge.database
        .from('custom_proposals')
        .insert({
          recruiter_id: recruiterId,
          features: features,
          price: parseFloat(price)
        });
    }

    // 2. Send email via centralized email service
    const htmlContent = customProposalEmail(name, company, features, price);

    const result = await sendEmail({
      to: email,
      subject: `TalentMesh Custom Proposal for ${company}`,
      html: htmlContent,
      role: 'billing',
    });

    if (!result.success) {
      return NextResponse.json({ 
        success: true, 
        warning: `Proposal saved but email was not sent: ${result.error}` 
      });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Send Proposal API Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send proposal' }, { status: 500 });
  }
}
