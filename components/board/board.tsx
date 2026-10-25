"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { moveApplication } from "@/lib/actions/applications";
import { STATUS_LABELS, formatSalary } from "@/lib/format";
import {
  STATUSES,
  type Application,
  type Status,
} from "@/lib/validation/application";

type Move = { id: string; status: Status; position: number };

// New cards go to the end of the target column.
function nextPosition(apps: Application[], status: Status) {
  const positions = apps
    .filter((a) => a.status === status)
    .map((a) => a.position);
  return positions.length ? Math.max(...positions) + 1000 : 1000;
}

export function Board({ apps }: { apps: Application[] }) {
  const [optimisticApps, applyOptimistic] = useOptimistic(
    apps,
    (current, move: Move) =>
      current.map((a) =>
        a.id === move.id
          ? { ...a, status: move.status, position: move.position }
          : a,
      ),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeApp = activeId
    ? optimisticApps.find((a) => a.id === activeId) ?? null
    : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function move(id: string, status: Status) {
    const app = optimisticApps.find((a) => a.id === id);
    if (!app || app.status === status) return;

    const next: Move = {
      id,
      status,
      position: nextPosition(optimisticApps, status),
    };

    setError(null);
    startTransition(async () => {
      applyOptimistic(next);
      try {
        await moveApplication(next);
      } catch {
        // When this transition ends, React reverts the optimistic card.
        setError(
          `Couldn't move ${app.roleTitle} at ${app.company}. The change was not saved.`,
        );
      }
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const status = event.over?.id as Status | undefined;
    if (status) move(String(event.active.id), status);
  }

  return (
    <div className="mt-6">
      {error && (
        <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {isPending ? "Saving move…" : ""}
      </p>

      <DndContext
        id="job-board"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          {STATUSES.map((status) => (
            <Column
              key={status}
              status={status}
              apps={optimisticApps.filter((a) => a.status === status)}
              onMove={move}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeApp ? (
            <div className="rotate-2 cursor-grabbing rounded-md bg-white p-3 shadow-xl ring-1 ring-neutral-300">
              <div className="flex items-start gap-2">
                <span aria-hidden="true" className="text-neutral-400">
                  ⠿
                </span>
                <CardBody app={activeApp} />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  apps,
  onMove,
}: {
  status: Status;
  apps: Application[];
  onMove: (id: string, status: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`col-${status}`}
      className={`rounded-lg p-3 transition-colors ${
        isOver ? "bg-blue-50 ring-2 ring-blue-300" : "bg-neutral-100"
      }`}
    >
      <h2 id={`col-${status}`} className="mb-3 text-sm font-semibold">
        {STATUS_LABELS[status]}{" "}
        <span className="text-neutral-500">({apps.length})</span>
      </h2>
      <ul className="min-h-16 space-y-2">
        {apps.map((app) => (
          <Card key={app.id} app={app} onMove={onMove} />
        ))}
        {apps.length === 0 && (
          <li className="rounded-md border border-dashed border-neutral-300 p-3 text-center text-xs text-neutral-500">
            Drop applications here
          </li>
        )}
      </ul>
    </section>
  );
}

function Card({
  app,
  onMove,
}: {
  app: Application;
  onMove: (id: string, status: Status) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
  });

  // No transform here: DragOverlay moves the visible copy, and the source
  // card just dims in place.
  return (
    <li
      ref={setNodeRef}
      className={`rounded-md bg-white p-3 shadow-sm transition-opacity ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`Drag ${app.roleTitle} at ${app.company}`}
          className="touch-none cursor-grab text-neutral-400"
          {...listeners}
          {...attributes}
        >
          ⠿
        </button>
        <CardBody app={app} linked />
      </div>

      <label className="mt-2 block text-xs text-neutral-600">
        Move to{" "}
        <select
          value={app.status}
          onChange={(e) => onMove(app.id, e.target.value as Status)}
          className="ml-1 rounded border border-neutral-300 bg-white px-1 py-0.5"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
}

// Shared by the card and the drag overlay. Only the card links to the detail
// page, so the overlay never contains interactive elements.
function CardBody({ app, linked = false }: { app: Application; linked?: boolean }) {
  const salary = formatSalary(app);

  return (
    <div className="min-w-0">
      {linked ? (
        <Link
          href={`/applications/${app.id}`}
          className="font-medium underline-offset-2 hover:underline"
        >
          {app.roleTitle}
        </Link>
      ) : (
        <p className="font-medium">{app.roleTitle}</p>
      )}
      <p className="text-sm text-neutral-600">{app.company}</p>
      {salary && <p className="mt-1 text-xs text-neutral-500">{salary}</p>}
    </div>
  );
}