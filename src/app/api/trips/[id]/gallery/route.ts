import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// UPLOAD GALLERY ITEM
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

    // Get member for this trip
    const member = await prisma.member.findFirst({
      where: { tripId, userId: session.user.id },
    });

    if (!member) {
      return NextResponse.json({ error: "You are not a member of this trip" }, { status: 403 });
    }

    const { url, type, caption, publicId } = await req.json();

    if (!url || !type) {
      return NextResponse.json({ error: "URL and type are required" }, { status: 400 });
    }

    const galleryItem = await prisma.gallery.create({
      data: {
        url,
        type,
        caption: caption || null,
        publicId: publicId || null,
        tripId,
        uploadedById: member.id,
      },
      include: { uploadedBy: true },
    });

    return NextResponse.json(galleryItem, { status: 201 });
  } catch (error) {
    console.error("Upload gallery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET GALLERY ITEMS with pagination
export async function GET(
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const where = {
      tripId,
      ...(search && {
        OR: [
          { caption: { contains: search, mode: "insensitive" as const } },
          { uploadedBy: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      prisma.gallery.findMany({
        where,
        include: { uploadedBy: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.gallery.count({ where }),
    ]);

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Get gallery error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
