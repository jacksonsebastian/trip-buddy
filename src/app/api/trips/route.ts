import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// CREATE TRIP
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, destination, description, startDate, endDate, perPersonBudget, coverImage } = body;

    if (!name || !destination || !startDate || !endDate || !perPersonBudget) {
      return NextResponse.json(
        { error: "Name, destination, dates, and budget are required" },
        { status: 400 }
      );
    }

    const trip = await prisma.trip.create({
      data: {
        name,
        destination,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        perPersonBudget: parseFloat(perPersonBudget),
        coverImage: coverImage || null,
        createdById: session.user.id,
        // Automatically add creator as admin member
        members: {
          create: {
            name: session.user.name || "Admin",
            email: session.user.email,
            role: "ADMIN",
            userId: session.user.id,
          },
        },
      },
    });

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("Create trip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// LIST TRIPS
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: {
        OR: [
          { createdById: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        members: true,
        _count: { select: { expenses: true, payments: true, gallery: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(trips);
  } catch (error) {
    console.error("List trips error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
