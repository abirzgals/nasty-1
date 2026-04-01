"use client";

import type { Note } from "./NotesApp";

interface NotesListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotesList({
  notes,
  selectedId,
  onSelect,
  onDelete,
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-center opacity-50">
          Нет заметок. Нажмите &laquo;+&raquo; чтобы создать.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {notes.map((note) => (
        <div
          key={note.id}
          onClick={() => onSelect(note)}
          className="px-4 py-3 cursor-pointer border-b transition-colors"
          style={{
            borderColor: "var(--border)",
            backgroundColor:
              selectedId === note.id
                ? "var(--accent)"
                : "transparent",
            color:
              selectedId === note.id ? "#fff" : "var(--foreground)",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{note.title}</h3>
              <p
                className="text-sm truncate mt-1"
                style={{
                  opacity: selectedId === note.id ? 0.8 : 0.6,
                }}
              >
                {note.content || "Пустая заметка"}
              </p>
              <p
                className="text-xs mt-1"
                style={{
                  opacity: selectedId === note.id ? 0.7 : 0.4,
                }}
              >
                {formatDate(note.updatedAt)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-sm transition-colors opacity-40 hover:opacity-100 cursor-pointer"
              style={{ color: "var(--danger)" }}
              title="Удалить"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
