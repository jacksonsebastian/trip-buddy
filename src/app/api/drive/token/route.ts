import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function POST() {
  try {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      return NextResponse.json({ error: "Google OAuth credentials not configured" }, { status: 500 });
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const token = await auth.getAccessToken();

    if (!token.token) {
      throw new Error("Failed to retrieve access token");
    }

    return NextResponse.json({
      accessToken: token.token,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
    });
  } catch (error) {
    console.error("Drive token error:", error);
    return NextResponse.json({ error: "Failed to generate upload token" }, { status: 500 });
  }
}
