import { NextRequest, NextResponse } from 'next/server';

import {
  createCandidateApplication,
  getCandidateApplicationStatus,
  listCandidateApplications,
} from '@/lib/server/applications';
import {
  validateApplicationStatusQuery,
  validateCreateApplication,
} from '@/lib/validation/applications';

export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId');

    if (jobId) {
      const validation = validateApplicationStatusQuery({ jobId });
      if (!validation.success || !validation.data) {
        return NextResponse.json({ error: 'Invalid request', errors: validation.errors }, { status: 400 });
      }

      const status = await getCandidateApplicationStatus(validation.data.jobId);
      return NextResponse.json({ status });
    }

    const applications = await listCandidateApplications();
    return NextResponse.json({ applications });
  } catch (err: any) {
    const status = err.message?.includes('logged in') ? 401 : err.message?.includes('Only candidates') ? 403 : 500;
    return NextResponse.json({ error: err.message || 'Failed to load applications' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const validation = validateCreateApplication(payload);

    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: 'Invalid application payload', errors: validation.errors }, { status: 400 });
    }

    const application = await createCandidateApplication(validation.data);
    return NextResponse.json({ application }, { status: 201 });
  } catch (err: any) {
    const message = err.message || 'Failed to apply';
    const status = message.includes('logged in') ? 401
      : message.includes('Only candidates') ? 403
      : message.includes('already applied') || message.includes('no longer accepting') ? 409
      : message.includes('could not be found') ? 404
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
