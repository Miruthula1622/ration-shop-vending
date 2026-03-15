import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, mobile, password, dob, smartCardId, otp, familyMembers } = await req.json();

    if (!mobile || !otp || !password || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify OTP
    const otpRecord = await prisma.oTPRequest.findUnique({ where: { mobile } });
    
    if (!otpRecord || otpRecord.otpCode !== otp) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { mobile } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create unique qrId based on mobile + random suffix
    const qrId = `QR-${mobile}-${Math.floor(Math.random() * 10000)}`;

    // Create user and family members in a transaction
    const user = await prisma.user.create({
      data: {
        username,
        mobile,
        password: hashedPassword,
        dob,
        smartCardId,
        qrId,
        isVerified: true,
        familyMembers: {
          create: familyMembers?.map((m: {name: string, age: number}) => ({
            name: m.name,
            age: m.age
          })) || []
        }
      },
      include: {
        familyMembers: true
      }
    });

    // Delete OTP record after successful registration
    await prisma.oTPRequest.delete({ where: { mobile } });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'User registered successfully', user: userWithoutPassword });

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
