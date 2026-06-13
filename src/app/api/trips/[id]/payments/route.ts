import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// CREATE PAYMENT
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    // We do not require a session here because we want unauthenticated members 
    // with the private share link to be able to log PENDING payments.

    const { id: tripId } = await params;
    const { amount, paymentDate, upiRef, notes, proofImage, memberId, status } = await req.json();

    if (!amount || !paymentDate || !memberId) {
      return NextResponse.json(
        { error: "Amount, date, and member are required" },
        { status: 400 }
      );
    }

    // Verify member belongs to this trip
    const member = await prisma.member.findFirst({
      where: { id: memberId, tripId },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found in this trip" }, { status: 404 });
    }

    let finalStatus = "PENDING";
    if (status && session?.user) {
      const adminMember = await prisma.member.findFirst({
        where: { tripId, userId: session.user.id, role: "ADMIN" },
      });
      if (adminMember) finalStatus = status;
    }

    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        paymentDate: new Date(paymentDate),
        upiRef: upiRef || null,
        notes: notes || null,
        proofImage: proofImage || null,
        status: finalStatus as any,
        tripId,
        memberId,
      },
      include: { member: true },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// UPDATE PAYMENT STATUS (Admin approve/reject)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId } = await params;

    // Check admin
    const adminMember = await prisma.member.findFirst({
      where: { tripId, userId: session.user.id, role: "ADMIN" },
    });

    if (!adminMember) {
      return NextResponse.json({ error: "Only admins can approve/reject payments" }, { status: 403 });
    }

    const { paymentId, status } = await req.json();

    if (!paymentId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Payment ID and valid status required" }, { status: 400 });
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
      include: { member: true },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
