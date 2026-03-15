import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const chambers = await prisma.chamber.findMany();
    return NextResponse.json(chambers);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, totalCapacity, currentLevel } = await req.json();

    if (!name || totalCapacity === undefined || currentLevel === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const chamber = await prisma.chamber.upsert({
      where: { name },
      update: { totalCapacity, currentLevel, lastUpdated: new Date() },
      create: { name, totalCapacity, currentLevel }
    });

    return NextResponse.json({ message: 'Chamber updated successfully', chamber });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
