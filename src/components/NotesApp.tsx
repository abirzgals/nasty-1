"use client";

import { useState, useEffect, useMemo } from "react";
import NotesList from "./NotesList";
import NoteEditor from "./NoteEditor";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "notes-app-data";

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveNotes(notes);
  }, [notes, loaded]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = q
      ? notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q)
        )
      : notes;
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, search]);

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null;

  const handleNew = () => {
    setSelectedId(null);
    setEditing(true);
  };

  const handleSelect = (note: Note) => {
    setSelectedId(note.id);
    setEditing(true);
  };

  const handleSave = (title: string, content: string) => {
    if (selectedId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedId
            ? { ...n, title, content, updatedAt: Date.now() }
            : n
        )
      );
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(newNote.id);
    }
    setEditing(false);
  };

  const handleDelete = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  if (!loaded) return null;

  return (
    <div className="flex h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Sidebar */}
      <aside
        className="w-80 shrink-0 flex flex-col border-r"
        style={{
          backgroundColor: "var(--card-bg)",
          borderColor: "var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-4 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)" }}
        >
          <h1 className="text-lg font-bold">Записная книжка</h1>
          <button
            onClick={handleNew}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white text-xl font-bold transition-colors cursor-pointer"
            style={{ backgroundColor: "var(--accent)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--accent)")
            }
            title="Новая заметка"
          >
            +
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none border"
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <NotesList
          notes={filtered}
          selectedId={selectedId}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />

        <div
          className="px-4 py-3 text-xs border-t"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Всего заметок: {notes.length}
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col" style={{ backgroundColor: "var(--card-bg)" }}>
        {editing ? (
          <NoteEditor
            note={selectedNote}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : selectedNote ? (
          <div className="flex-1 overflow-y-auto">
            <div
              className="px-8 py-6 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)" }}
            >
              <h2 className="text-2xl font-bold">{selectedNote.title}</h2>
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer transition-colors"
                style={{ backgroundColor: "var(--accent)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--accent)")
                }
              >
                Редактировать
              </button>
            </div>
            <div className="px-8 py-6 whitespace-pre-wrap leading-relaxed">
              {selectedNote.content || (
                <span className="opacity-40">Пустая заметка</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center opacity-40">
              <p className="text-5xl mb-4">📝</p>
              <p className="text-lg">Выберите заметку или создайте новую</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
