import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";

export async function GET(request: NextRequest) {
  return NextResponse.json({ editMode: await isAuthorized(request) });
}
