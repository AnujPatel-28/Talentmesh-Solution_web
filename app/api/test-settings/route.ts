import { NextResponse } from 'next/server';
import { getPlatformSettings } from '@/lib/server/admin';

export async function GET() {
  try {
    const general = await getPlatformSettings('general');
    return NextResponse.json({ success: true, general });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
