import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { mobile } = await req.json();

    if (!mobile) {
      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { mobile }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this mobile number already exists' }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save or update OTP request
    await prisma.oTPRequest.upsert({
      where: { mobile },
      update: { otpCode, createdAt: new Date() },
      create: { mobile, otpCode }
    });

    return NextResponse.json({ message: 'OTP generated successfully', otpHint: 'Check Admin Panel for OTP' });

  } catch (error) {
    console.error('Error requesting OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
