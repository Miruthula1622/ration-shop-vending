import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_for_testing_123';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, mobile: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        allocations: true,
        complaints: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentMonth = new Date().getMonth() + 1; // Simplistic month checking
    const currentYear = new Date().getFullYear();
    const monthYear = `${currentMonth < 10 ? '0'+currentMonth : currentMonth}-${currentYear}`;

    const allocations = user.allocations.filter(a => a.monthYear === monthYear);

    const chambers = await prisma.chamber.findMany();

    const { password: _, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      chambers,
      allocations,
      complaints: user.complaints
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error or Invalid Token' }, { status: 500 });
  }
}
