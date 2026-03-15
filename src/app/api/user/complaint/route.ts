import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_for_testing_123';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const { issueType } = await req.json();

    if (!issueType) {
      return NextResponse.json({ error: 'Issue type is required' }, { status: 400 });
    }

    const complaint = await prisma.complaint.create({
      data: {
        userId: decoded.id,
        issueType,
        status: 'OPEN'
      }
    });

    return NextResponse.json({ message: 'Complaint registered', complaint });

  } catch (error) {
    console.error('Complaint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
