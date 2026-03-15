import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const otps = await prisma.oTPRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to recent 50
    });
    return NextResponse.json(otps);
  } catch (error) {
    console.error('Error fetching OTPs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
