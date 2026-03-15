import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        familyMembers: true,
        allocations: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId, monthYear, grainType, allocatedQty } = await req.json();

    if (!userId || !monthYear || !grainType || allocatedQty === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert allocation for that user + month + grain
    const allocation = await prisma.allocation.findFirst({
      where: { userId, monthYear, grainType }
    });

    if (allocation) {
      const updated = await prisma.allocation.update({
        where: { id: allocation.id },
        data: { allocatedQty }
      });
      return NextResponse.json({ message: 'Allocation updated', allocation: updated });
    } else {
      const created = await prisma.allocation.create({
        data: { userId, monthYear, grainType, allocatedQty }
      });
      return NextResponse.json({ message: 'Allocation created', allocation: created });
    }
  } catch (error) {
    console.error('Error allocating grains:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
