import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { backupPlanningData, getPlanningData } from "@/lib/blobStore";

function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function handleBackup(request: NextRequest) {
  if (!isCronAuthorized(request) && !(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getPlanningData();
  const pathname = await backupPlanningData(data);

  return NextResponse.json({ ok: true, pathname });
}

export async function GET(request: NextRequest) {
  return handleBackup(request);
}

export async function POST(request: NextRequest) {
  return handleBackup(request);
}
