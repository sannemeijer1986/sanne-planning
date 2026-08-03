import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getPlanningData, savePlanningData } from "@/lib/blobStore";
import { NOTES_MAX_LENGTH } from "@/types/planning";

export async function GET() {
  const data = await getPlanningData();
  return NextResponse.json({ notes: data.notes ?? "" });
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { notes?: unknown } | null;
  if (typeof body?.notes !== "string") {
    return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
  }

  const data = await getPlanningData();
  data.notes = body.notes.slice(0, NOTES_MAX_LENGTH);
  await savePlanningData(data);

  return NextResponse.json({ ok: true });
}
