import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET single trip with all relations
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            paymentsMade: true,
            expensesPaid: true,
          },
        },
        payments: {
          include: { member: true },
          orderBy: { createdAt: "desc" },
        },
        expenses: {
          include: { paidBy: true },
          orderBy: { createdAt: "desc" },
        },
        gallery: {
          include: { uploadedBy: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Get trip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// UPDATE trip
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check admin access
    const member = await prisma.member.findFirst({
      where: { tripId: id, userId: session.user.id, role: "ADMIN" },
    });

    if (!member) {
      return NextResponse.json({ error: "Only admins can edit trips" }, { status: 403 });
    }

    const body = await req.json();
    const { name, destination, description, startDate, endDate, perPersonBudget, coverImage, status } = body;

    const trip = await prisma.trip.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(destination && { destination }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(perPersonBudget && { perPersonBudget: parseFloat(perPersonBudget) }),
        ...(coverImage !== undefined && { coverImage }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(trip);
  } catch (error) {
    console.error("Update trip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE trip
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip || trip.createdById !== session.user.id) {
      return NextResponse.json({ error: "Only the trip creator can delete" }, { status: 403 });
    }

    await prisma.trip.delete({ where: { id } });

    return NextResponse.json({ message: "Trip deleted" });
  } catch (error) {
    console.error("Delete trip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
