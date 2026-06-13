import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ADD MEMBER
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId } = await params;

    // Check admin access
    const adminMember = await prisma.member.findFirst({
      where: { tripId, userId: session.user.id, role: "ADMIN" },
    });

    if (!adminMember) {
      return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
    }

    const { name, email, mobileNumber, profilePhoto } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if member with same email already exists in this trip
    if (email) {
      const existing = await prisma.member.findFirst({
        where: { tripId, email },
      });
      if (existing) {
        return NextResponse.json({ error: "A member with this email already exists in this trip" }, { status: 400 });
      }
    }

    // Check if email matches a registered user
    let userId: string | null = null;
    if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) userId = user.id;
    }

    const member = await prisma.member.create({
      data: {
        name,
        email: email || null,
        mobileNumber: mobileNumber || null,
        profilePhoto: profilePhoto || null,
        tripId,
        userId,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Add member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE MEMBER
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Check admin access
    const adminMember = await prisma.member.findFirst({
      where: { tripId, userId: session.user.id, role: "ADMIN" },
    });

    if (!adminMember) {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
    }

    // Prevent admin from removing themselves
    if (memberId === adminMember.id) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    await prisma.member.delete({ where: { id: memberId } });

    return NextResponse.json({ message: "Member removed" });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
