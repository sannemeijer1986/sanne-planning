import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { isAuthorized } from "@/lib/auth";
import { getPlanningData, savePlanningData } from "@/lib/blobStore";
import { isValidRange } from "@/lib/dates";
import { ITEM_COLORS, type CreateItemInput, type TimelineItem } from "@/types/planning";

export async function GET() {
  const data = await getPlanningData();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Partial<CreateItemInput> | null;
  const { startDate, startOffset, endDate, endOffset, title, subtitle, color } = body ?? {};

  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    typeof startOffset !== "number" ||
    typeof endOffset !== "number" ||
    typeof title !== "string" ||
    typeof subtitle !== "string" ||
    typeof color !== "string" ||
    !(ITEM_COLORS as readonly string[]).includes(color) ||
    !isValidRange(startDate, startOffset, endDate, endOffset)
  ) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const item: TimelineItem = {
    id: nanoid(),
    startDate,
    startOffset,
    endDate,
    endOffset,
    title: title.slice(0, 80),
    subtitle: subtitle.slice(0, 120),
    color: color as TimelineItem["color"],
    createdAt: now,
    updatedAt: now,
  };

  const data = await getPlanningData();
  data.items.push(item);
  await savePlanningData(data);

  return NextResponse.json(item, { status: 201 });
}
