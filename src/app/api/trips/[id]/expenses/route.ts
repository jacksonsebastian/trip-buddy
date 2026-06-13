import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// CREATE EXPENSE (Admin only)
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
      return NextResponse.json({ error: "Only admins can add expenses" }, { status: 403 });
    }

    const { title, category, amount, date, notes, billImage, paidById } = await req.json();

    if (!title || !category || !amount || !date) {
      return NextResponse.json(
        { error: "Title, category, amount, and date are required" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        category,
        amount: parseFloat(amount),
        date: new Date(date),
        notes: notes || null,
        billImage: billImage || null,
        tripId,
        paidById: paidById || null,
      },
      include: { paidBy: true },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE EXPENSE (Admin only)
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

    const adminMember = await prisma.member.findFirst({
      where: { tripId, userId: session.user.id, role: "ADMIN" },
    });

    if (!adminMember) {
      return NextResponse.json({ error: "Only admins can delete expenses" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return NextResponse.json({ error: "Expense ID required" }, { status: 400 });
    }

    await prisma.expense.delete({ where: { id: expenseId } });

    return NextResponse.json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Delete expense error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
