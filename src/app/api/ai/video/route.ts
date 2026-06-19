import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateVideoCreativePackage } from '@/lib/ai/gemini';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { brief, targetAudience } = await req.json();
    if (!brief) return NextResponse.json({ error: 'Missing brief' }, { status: 400 });

    const creativePackage = await generateVideoCreativePackage(brief, targetAudience);
    return NextResponse.json(creativePackage);
  } catch (error) {
    console.error('Video creative API error:', error);
    return NextResponse.json({ error: 'Failed to generate creative package' }, { status: 500 });
  }
}
