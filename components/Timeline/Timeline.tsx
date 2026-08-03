"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  buildDayIndex,
  buildMonthLabels,
  currentWeekColumnIndices,
  generateDefaultRange,
  resolveColumnIndex,
  toISODate,
} from "@/lib/dates";
import { QUARTERS_PER_DAY, type ItemColor, type ItemKind, type TimelineItem } from "@/types/planning";
import Header from "@/components/Header";
import EditModeToggle from "@/components/EditModeToggle";
import NotesWidget from "@/components/NotesWidget";
import { useSnackbar } from "@/components/Snackbar/SnackbarProvider";
import DayColumn from "./DayColumn";
import MonthLabel from "./MonthLabel";
import TodayMarker from "./TodayMarker";
import CurrentWeekTint from "./CurrentWeekTint";
import ItemBlock, { type DragMode } from "./ItemBlock";
import ItemEditorPopover from "./ItemEditorPopover";
import itemBlockStyles from "./ItemBlock.module.scss";
import styles from "./Timeline.module.scss";

const MONTHS_BACK = 6;
const INITIAL_MONTHS_FORWARD = 12;
const LOAD_MORE_MONTHS = 3;
const MIN_LANES = 6;
const ITEM_HEIGHT = 60;
const ITEM_GAP = 8;
const ROW_HEIGHT = ITEM_HEIGHT + ITEM_GAP;
const LOAD_MORE_WIDTH = 140;
// Visual-only breathing room between blocks on the same row. Insets the
// rendered box symmetrically; the underlying quarter-day start/end (and thus
// drag/resize snapping) is untouched.
const H_GAP = 8;
const H_GAP_MIN_WIDTH = 12;

function insetRect(left: number, width: number): { left: number; width: number } {
  const inset = Math.min(H_GAP / 2, Math.max(width - H_GAP_MIN_WIDTH, 0) / 2);
  return { left: left + inset, width: width - inset * 2 };
}
// Mirrors $month-label-height in styles/_variables.scss.
const MONTH_LABEL_HEIGHT = 80;
// Mirrors $column-header-height in styles/_variables.scss.
const DAY_ROW_HEIGHT = 96;
// Mirrors $month-label-height + $column-header-height in styles/_variables.scss.
const HEADER_HEIGHT = MONTH_LABEL_HEIGHT + DAY_ROW_HEIGHT;

interface DraftRange {
  startIndex: number; // quarter-day index
  endIndex: number; // quarter-day index, inclusive
  lane: number;
}

interface DragState {
  mode: DragMode | "create";
  itemId?: string;
  anchorIndex: number; // quarter-day index
  originStart: number;
  originEnd: number;
  currentStart?: number;
  currentEnd?: number;
  anchorY: number;
  originLane: number;
  currentLane?: number;
  moved: boolean;
}

export default function Timeline() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [monthsForward, setMonthsForward] = useState(INITIAL_MONTHS_FORWARD);
  const [dayWidth, setDayWidth] = useState(132);
  const [dayWidthReady, setDayWidthReady] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [creatingDraft, setCreatingDraft] = useState<DraftRange | null>(null);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    itemId: string;
    startIndex: number;
    endIndex: number;
    lane: number;
  } | null>(null);
  const [hoverCell, setHoverCell] = useState<{ quarter: number; lane: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const hasScrolledRef = useRef(false);
  const today = useMemo(() => new Date(), []);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setDayWidth(mq.matches ? 60 : 132);
    update();
    setDayWidthReady(true);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    function updateHeight() {
      if (scrollRef.current) setViewportHeight(scrollRef.current.clientHeight);
    }
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    fetch("/api/items")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data) => setItems(data.items ?? []))
      .catch(() => {});
    fetch("/api/auth/status")
      .then((res) => (res.ok ? res.json() : { editMode: false }))
      .then((data) => setEditMode(!!data.editMode))
      .catch(() => {});
  }, []);

  const days = useMemo(
    () => generateDefaultRange(today, MONTHS_BACK, monthsForward),
    [today, monthsForward]
  );
  const dayIndex = useMemo(() => buildDayIndex(days), [days]);
  const months = useMemo(() => buildMonthLabels(days), [days]);
  const todayIndex = useMemo(() => resolveColumnIndex(dayIndex, today), [dayIndex, today]);
  const weekIndices = useMemo(() => currentWeekColumnIndices(dayIndex, today), [dayIndex, today]);
  const weekTint = useMemo(() => {
    if (weekIndices.length === 0) return null;
    const min = Math.min(...weekIndices);
    const max = Math.max(...weekIndices);
    return { left: min * dayWidth, width: (max - min + 1) * dayWidth };
  }, [weekIndices, dayWidth]);

  const totalWidth = days.length * dayWidth;
  const quarterWidth = dayWidth / QUARTERS_PER_DAY;
  const totalQuarters = days.length * QUARTERS_PER_DAY;

  function quarterIndexOf(dateISO: string, offset: number): number | undefined {
    const dIdx = dayIndex.get(dateISO);
    return dIdx === undefined ? undefined : dIdx * QUARTERS_PER_DAY + offset;
  }

  function quarterToDateOffset(q: number): { date: string; offset: number } {
    const clamped = Math.min(Math.max(q, 0), totalQuarters - 1);
    const dIdx = Math.floor(clamped / QUARTERS_PER_DAY);
    return { date: toISODate(days[dIdx]), offset: clamped % QUARTERS_PER_DAY };
  }

  // Rows are positioned manually (by dragging) — never auto-assigned by overlap.
  const positioned = useMemo(() => {
    return items
      .map((item) => {
        // Legacy items predating quarter-day snapping have no offset fields; default to full-day.
        const startIndex = quarterIndexOf(item.startDate, item.startOffset ?? 0);
        const endIndex = quarterIndexOf(item.endDate, item.endOffset ?? QUARTERS_PER_DAY - 1);
        if (startIndex === undefined || endIndex === undefined) return null;
        return { item, startIndex, endIndex, lane: item.lane ?? 0 };
      })
      .filter(
        (v): v is { item: TimelineItem; startIndex: number; endIndex: number; lane: number } =>
          v !== null
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, dayIndex]);

  const totalLanes = Math.max(MIN_LANES, ...positioned.map((p) => p.lane + 1));
  const bodyHeight = Math.max(totalLanes * ROW_HEIGHT + ITEM_GAP, viewportHeight - HEADER_HEIGHT);

  function renderDayDividers(top?: number) {
    return days.map((day, i) =>
      i === 0 ? null : (
        <div
          key={i}
          className={day.getDay() === 1 ? styles.weekDivider : styles.divider}
          style={{ left: i * dayWidth, ...(top !== undefined ? { top } : {}) }}
        />
      )
    );
  }

  useEffect(() => {
    if (!dayWidthReady || hasScrolledRef.current) return;
    const scroll = scrollRef.current;
    if (!scroll || days.length === 0) return;
    scroll.scrollLeft = Math.max(todayIndex * dayWidth - scroll.clientWidth / 2, 0);
    hasScrolledRef.current = true;
  }, [dayWidthReady, todayIndex, dayWidth, days.length]);

  function scrollToToday() {
    const scroll = scrollRef.current;
    if (!scroll) return;
    scroll.scrollTo({
      left: Math.max(todayIndex * dayWidth - scroll.clientWidth / 2, 0),
      behavior: "smooth",
    });
  }

  function quarterFromClientX(clientX: number): number {
    const body = bodyRef.current;
    if (!body) return 0;
    const rect = body.getBoundingClientRect();
    const idx = Math.floor((clientX - rect.left) / quarterWidth);
    return Math.min(Math.max(idx, 0), totalQuarters - 1);
  }

  function laneFromClientY(clientY: number): number {
    const body = bodyRef.current;
    if (!body) return 0;
    const rect = body.getBoundingClientRect();
    return Math.max(0, Math.floor((clientY - rect.top) / ROW_HEIGHT));
  }

  function handleWindowPointerMove(e: PointerEvent) {
    const drag = dragStateRef.current;
    if (!drag) return;
    const idx = quarterFromClientX(e.clientX);

    if (drag.mode === "create") {
      if (idx !== drag.anchorIndex) drag.moved = true;
      drag.currentStart = Math.min(drag.anchorIndex, idx);
      drag.currentEnd = Math.max(drag.anchorIndex, idx);
      setCreatingDraft({ startIndex: drag.currentStart, endIndex: drag.currentEnd, lane: drag.originLane });
      return;
    }

    const delta = idx - drag.anchorIndex;
    const duration = drag.originEnd - drag.originStart;
    if (drag.mode === "move") {
      const newStart = Math.min(Math.max(drag.originStart + delta, 0), totalQuarters - 1 - duration);
      drag.currentStart = newStart;
      drag.currentEnd = newStart + duration;
      const deltaLane = Math.round((e.clientY - drag.anchorY) / ROW_HEIGHT);
      drag.currentLane = Math.max(0, drag.originLane + deltaLane);
    } else if (drag.mode === "resize-start") {
      drag.currentStart = Math.min(Math.max(drag.originStart + delta, 0), drag.originEnd);
      drag.currentEnd = drag.originEnd;
    } else {
      drag.currentEnd = Math.max(Math.min(drag.originEnd + delta, totalQuarters - 1), drag.originStart);
      drag.currentStart = drag.originStart;
    }

    if (idx !== drag.anchorIndex || drag.currentLane !== drag.originLane) drag.moved = true;
    setDragPreview({
      itemId: drag.itemId!,
      startIndex: drag.currentStart,
      endIndex: drag.currentEnd,
      lane: drag.currentLane ?? drag.originLane,
    });
  }

  function handleWindowPointerUp() {
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", handleWindowPointerUp);
    const drag = dragStateRef.current;
    dragStateRef.current = null;
    if (!drag) return;

    if (drag.mode === "create") {
      const start = drag.currentStart ?? drag.anchorIndex;
      const end = drag.currentEnd ?? drag.anchorIndex;
      setCreatingDraft({ startIndex: start, endIndex: end, lane: drag.originLane });
      return;
    }

    const itemId = drag.itemId!;
    const start = drag.currentStart ?? drag.originStart;
    const end = drag.currentEnd ?? drag.originEnd;
    const lane = drag.currentLane ?? drag.originLane;
    setDragPreview(null);

    if (!drag.moved) {
      setItems((prev) => {
        const original = prev.find((i) => i.id === itemId);
        if (original) setEditingItem(original);
        return prev;
      });
      return;
    }

    if (start === drag.originStart && end === drag.originEnd && lane === drag.originLane) return;

    const { date: startDate, offset: startOffset } = quarterToDateOffset(start);
    const { date: endDate, offset: endOffset } = quarterToDateOffset(end);
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, startDate, startOffset, endDate, endOffset, lane } : i))
    );
    fetch(`/api/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, startOffset, endDate, endOffset, lane }),
    }).catch(() => {});
  }

  function handleBodyPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!editMode) {
      showSnackbar("Can't edit in view mode", { variant: "error" });
      return;
    }
    const idx = quarterFromClientX(e.clientX);
    const lane = laneFromClientY(e.clientY);
    dragStateRef.current = {
      mode: "create",
      anchorIndex: idx,
      originStart: idx,
      originEnd: idx,
      anchorY: e.clientY,
      originLane: lane,
      currentLane: lane,
      moved: false,
    };
    setCreatingDraft({ startIndex: idx, endIndex: idx, lane });
    setHoverCell(null);
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
  }

  function handleBodyPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!editMode || dragStateRef.current || creatingDraft || editingItem) {
      if (hoverCell) setHoverCell(null);
      return;
    }
    const target = e.target as HTMLElement;
    if (target.closest(`.${itemBlockStyles.item}`)) {
      if (hoverCell) setHoverCell(null);
      return;
    }
    setHoverCell({ quarter: quarterFromClientX(e.clientX), lane: laneFromClientY(e.clientY) });
  }

  function handleBodyPointerLeave() {
    setHoverCell(null);
  }

  function handleItemDragStart(item: TimelineItem, mode: DragMode, e: ReactPointerEvent) {
    e.stopPropagation();
    if (!editMode) return;
    const startIndex = quarterIndexOf(item.startDate, item.startOffset ?? 0);
    const endIndex = quarterIndexOf(item.endDate, item.endOffset ?? QUARTERS_PER_DAY - 1);
    if (startIndex === undefined || endIndex === undefined) return;
    const idx = quarterFromClientX(e.clientX);
    const lane = item.lane ?? 0;
    dragStateRef.current = {
      mode,
      itemId: item.id,
      anchorIndex: idx,
      originStart: startIndex,
      originEnd: endIndex,
      anchorY: e.clientY,
      originLane: lane,
      currentLane: lane,
      moved: false,
    };
    setDragPreview({ itemId: item.id, startIndex, endIndex, lane });
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
  }

  async function handleCreateSave(values: {
    kind: ItemKind;
    title: string;
    subtitle: string;
    color: ItemColor;
  }) {
    if (!creatingDraft) return;
    const { date: startDate, offset: startOffset } = quarterToDateOffset(creatingDraft.startIndex);
    const { date: endDate, offset: endOffset } = quarterToDateOffset(creatingDraft.endIndex);
    const lane = creatingDraft.lane;
    setCreatingDraft(null);
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, startOffset, endDate, endOffset, lane, ...values }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
    }
  }

  async function handleEditSave(values: {
    kind: ItemKind;
    title: string;
    subtitle: string;
    color: ItemColor;
  }) {
    if (!editingItem) return;
    const id = editingItem.id;
    setEditingItem(null);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...values } : i)));
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
  }

  async function handleDelete() {
    if (!editingItem) return;
    const id = editingItem.id;
    setEditingItem(null);
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/items/${id}`, { method: "DELETE" });
  }

  async function handleLogin(password: string): Promise<{ ok: boolean; message?: string }> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setEditMode(true);
      return { ok: true };
    }
    const data = await res.json().catch(() => null);
    return { ok: false, message: data?.error };
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEditMode(false);
  }

  async function handleBackup() {
    const res = await fetch("/api/backup", { method: "POST" }).catch(() => null);
    if (res?.ok) {
      showSnackbar("Backup saved");
    } else {
      showSnackbar("Backup failed", { variant: "error" });
    }
  }

  return (
    <div className={styles.page}>
      <Header>
        <button type="button" className={styles.todayButton} onClick={scrollToToday}>
          Today
        </button>
        {editMode && (
          <button type="button" className={styles.todayButton} onClick={handleBackup}>
            Backup now
          </button>
        )}
        <EditModeToggle editMode={editMode} onLogin={handleLogin} onLogout={handleLogout} />
      </Header>
      <NotesWidget editMode={editMode} />

      <div className={styles.scroll} ref={scrollRef}>
        <div className={styles.sticky} style={{ width: totalWidth }}>
          {weekTint && (
            <CurrentWeekTint
              left={weekTint.left}
              width={weekTint.width}
              variant="header"
              top={MONTH_LABEL_HEIGHT}
            />
          )}
          <TodayMarker left={todayIndex * dayWidth} variant="header" top={MONTH_LABEL_HEIGHT} />
          {renderDayDividers(MONTH_LABEL_HEIGHT)}
          <div className={styles.monthRow} style={{ width: totalWidth }}>
            {months.map((m) => (
              <MonthLabel
                key={`${m.label}-${m.startIndex}`}
                label={m.label}
                left={m.startIndex * dayWidth}
                width={m.span * dayWidth}
              />
            ))}
          </div>
          <div className={styles.dayRow} style={{ width: totalWidth }}>
            {days.map((day, i) => (
              <DayColumn key={i} date={day} width={dayWidth} />
            ))}
          </div>
        </div>

        <div
          className={styles.body}
          ref={bodyRef}
          style={{ width: totalWidth + LOAD_MORE_WIDTH, height: bodyHeight }}
          onPointerDown={handleBodyPointerDown}
          onPointerMove={handleBodyPointerMove}
          onPointerLeave={handleBodyPointerLeave}
        >
          {weekTint && <CurrentWeekTint left={weekTint.left} width={weekTint.width} />}
          <TodayMarker left={todayIndex * dayWidth} />

          {renderDayDividers()}

          {hoverCell && (
            <div
              className={styles.hoverCell}
              style={{
                left: hoverCell.quarter * quarterWidth,
                width: quarterWidth,
                top: hoverCell.lane * ROW_HEIGHT + ITEM_GAP,
                height: ITEM_HEIGHT,
              }}
            />
          )}

          {Array.from({ length: Math.floor(bodyHeight / ROW_HEIGHT) + 1 }, (_, n) => (
            <div key={n} className={styles.rowDivider} style={{ top: n * ROW_HEIGHT }} />
          ))}

          {positioned.length === 0 && editMode && (
            <span className={styles.empty}>Drag across days to add your first item</span>
          )}

          {positioned.map(({ item, startIndex, endIndex, lane }) => {
            const preview = dragPreview?.itemId === item.id ? dragPreview : null;
            const s = preview ? preview.startIndex : startIndex;
            const e = preview ? preview.endIndex : endIndex;
            const l = preview ? preview.lane : lane;
            const isLeave = item.kind === "leave";
            const rect = insetRect(s * quarterWidth, (e - s + 1) * quarterWidth);
            return (
              <ItemBlock
                key={item.id}
                item={item}
                editable={editMode}
                isDragging={!!preview}
                left={rect.left}
                width={rect.width}
                top={isLeave ? 0 : l * ROW_HEIGHT + ITEM_GAP}
                height={isLeave ? bodyHeight : undefined}
                onDragStart={handleItemDragStart}
              />
            );
          })}

          {creatingDraft &&
            (() => {
              const rect = insetRect(
                creatingDraft.startIndex * quarterWidth,
                (creatingDraft.endIndex - creatingDraft.startIndex + 1) * quarterWidth
              );
              return (
                <div
                  className={`${itemBlockStyles.item} ${itemBlockStyles.draft}`}
                  style={{
                    left: rect.left,
                    width: rect.width,
                    top: creatingDraft.lane * ROW_HEIGHT + ITEM_GAP,
                  }}
                />
              );
            })()}

          <button
            type="button"
            className={styles.loadMore}
            style={{ left: totalWidth, width: LOAD_MORE_WIDTH }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setMonthsForward((m) => m + LOAD_MORE_MONTHS)}
          >
            Load 3 more months →
          </button>
        </div>
      </div>

      {creatingDraft &&
        (() => {
          const start = quarterToDateOffset(creatingDraft.startIndex);
          const end = quarterToDateOffset(creatingDraft.endIndex);
          return (
            <ItemEditorPopover
              mode="create"
              startDate={start.date}
              endDate={end.date}
              onSave={handleCreateSave}
              onCancel={() => setCreatingDraft(null)}
            />
          );
        })()}

      {editingItem && (
        <ItemEditorPopover
          mode="edit"
          startDate={editingItem.startDate}
          endDate={editingItem.endDate}
          initialKind={editingItem.kind ?? "work"}
          initialTitle={editingItem.title}
          initialSubtitle={editingItem.subtitle}
          initialColor={editingItem.color}
          onSave={handleEditSave}
          onCancel={() => setEditingItem(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
