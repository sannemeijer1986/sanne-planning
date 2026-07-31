import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { getPlanningData, savePlanningData } from "@/lib/blobStore";
import { isValidRange } from "@/lib/dates";
import { ITEM_COLORS, type UpdateItemInput } from "@/types/planning";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Partial<UpdateItemInput> | null;
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data = await getPlanningData();
  const item = data.items.find((i) => i.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextStartDate = typeof body.startDate === "string" ? body.startDate : item.startDate;
  const nextEndDate = typeof body.endDate === "string" ? body.endDate : item.endDate;
  if (!isValidRange(nextStartDate, nextEndDate)) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }

  item.startDate = nextStartDate;
  item.endDate = nextEndDate;
  if (typeof body.title === "string") item.title = body.title.slice(0, 80);
  if (typeof body.subtitle === "string") item.subtitle = body.subtitle.slice(0, 120);
  if (typeof body.color === "string" && (ITEM_COLORS as readonly string[]).includes(body.color)) {
    item.color = body.color as typeof item.color;
  }
  item.updatedAt = new Date().toISOString();

  await savePlanningData(data);
  return NextResponse.json(item);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await getPlanningData();
  const index = data.items.findIndex((i) => i.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  data.items.splice(index, 1);
  await savePlanningData(data);
  return NextResponse.json({ ok: true });
}
