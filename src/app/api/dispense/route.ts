import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { qrId, grainType, dispenseQty } = await req.json();

    if (!qrId || !grainType || !dispenseQty) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Find User by QR Code
    const user = await prisma.user.findUnique({
      where: { qrId },
      include: {
        allocations: {
          where: { grainType } // We can filter by current month in a real app
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid QR. User not found.' }, { status: 404 });
    }

    const allocation = user.allocations[0];
    if (!allocation) {
      return NextResponse.json({ error: `No allocation found for ${grainType}` }, { status: 400 });
    }

    const pendingQty = allocation.allocatedQty - allocation.collectedQty;
    if (dispenseQty > pendingQty) {
      return NextResponse.json({ error: `Cannot dispense ${dispenseQty}Kg. Only ${pendingQty}Kg pending.` }, { status: 400 });
    }

    // Update chamber capacity
    const chamber = await prisma.chamber.findUnique({ where: { name: grainType } });
    if (!chamber || chamber.currentLevel < dispenseQty) {
      return NextResponse.json({ error: `Insufficient ${grainType} in the machine chamber.` }, { status: 400 });
    }

    // Deduct from chamber and add to user's collected amount in transaction
    await prisma.$transaction([
      prisma.chamber.update({
        where: { name: grainType },
        data: { currentLevel: { decrement: dispenseQty } }
      }),
      prisma.allocation.update({
        where: { id: allocation.id },
        data: {
          collectedQty: { increment: dispenseQty },
          status: (allocation.collectedQty + dispenseQty) >= allocation.allocatedQty ? 'COLLECTED' : 'PARTIALLY_COLLECTED'
        }
      })
    ]);

    return NextResponse.json({ message: 'Dispense recorded successfully.' });

  } catch (error) {
    console.error('Dispense error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET method for verifying user via QR scan without dispensing yet
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qrId = searchParams.get('qrId');

  if (!qrId) return NextResponse.json({ error: 'qrId missing' }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({
      where: { qrId },
      include: {
        allocations: true
      }
    });

    if (!user) return NextResponse.json({ error: 'Invalid QR Code' }, { status: 404 });

    const { password: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch(e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
