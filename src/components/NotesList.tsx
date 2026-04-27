"use client";

import type { Note } from "./NotesApp";

interface NotesListProps {
  notes: Note[];
  selectedId: string | null;
  onSelect: (note: Note) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onArchive: (id: string) => void;
  isArchiveView: boolean;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotesList({
  notes,
  selectedId,
  onSelect,
  onDelete,
  onPin,
  onArchive,
  isArchiveView,
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <p style={{ textAlign: "center", opacity: 0.5, fontSize: 16 }}>
          {isArchiveView ? "Архив пуст" : "Нет заметок. Нажмите «+» чтобы создать."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {notes.map((note) => {
        const selected = selectedId === note.id;
        return (
          <div
            key={note.id}
            onClick={() => onSelect(note)}
            style={{
              padding: "12px 16px",
              cursor: "pointer",
              borderBottom: "1px solid var(--border)",
              backgroundColor: selected ? "var(--accent)" : "transparent",
              color: selected ? "#fff" : "var(--foreground)",
            }}
          >
            <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontWeight: 600, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                  {note.pinned && !isArchiveView ? "📌 " : ""}{note.title}
                </h3>
                <p style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 4, opacity: selected ? 0.8 : 0.6 }}>
                  {note.images?.length ? `📷 ${note.images.length} фото` : note.content || "Пустая заметка"}
                </p>
                <p style={{ fontSize: 12, marginTop: 4, opacity: selected ? 0.7 : 0.4 }}>
                  {formatDate(note.updatedAt)}
                </p>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {!isArchiveView && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onPin(note.id); }}
                    title={note.pinned ? "Открепить" : "Закрепить"}
                    style={{
                      width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: 8, border: "none", background: "none", cursor: "pointer",
                      opacity: note.pinned ? 1 : 0.3, fontSize: 14,
                      color: selected ? "#fff" : "var(--foreground)",
                    }}
                  >
                    📌
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive(note.id); }}
                  title={isArchiveView ? "Восстановить" : "В архив"}
                  style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, border: "none", background: "none", cursor: "pointer",
                    opacity: 0.4, fontSize: 14,
                    color: selected ? "#fff" : "var(--foreground)",
                  }}
                >
                  {isArchiveView ? "↩️" : "📥"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
                  title="Удалить"
                  style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 8, border: "none", background: "none", cursor: "pointer",
                    opacity: 0.4, fontSize: 14,
                    color: "var(--danger)",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
