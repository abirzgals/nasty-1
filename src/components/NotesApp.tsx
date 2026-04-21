"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import NotesList from "./NotesList";
import NoteEditor from "./NoteEditor";

export interface Note {
  id: string;
  title: string;
  content: string;
  images: string[];
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

type MobileView = "list" | "view" | "edit";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const isMobile = useIsMobile();

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

  const handleNew = useCallback(() => {
    setSelectedId(null);
    setEditing(true);
    setMobileView("edit");
  }, []);

  const handleSelect = useCallback((note: Note) => {
    setSelectedId(note.id);
    setEditing(false);
    setMobileView("view");
  }, []);

  const handleSave = useCallback((title: string, content: string, images: string[]) => {
    if (selectedId) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedId
            ? { ...n, title, content, images, updatedAt: Date.now() }
            : n
        )
      );
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        images,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedId(newNote.id);
    }
    setEditing(false);
    setMobileView("list");
  }, [selectedId]);

  const handleDelete = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditing(false);
      setMobileView("list");
    }
  }, [selectedId]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setMobileView("list");
  }, []);

  const handleBack = useCallback(() => {
    setSelectedId(null);
    setEditing(false);
    setMobileView("list");
  }, []);

  const handleEdit = useCallback(() => {
    setEditing(true);
    setMobileView("edit");
  }, []);

  const showSidebar = !isMobile || mobileView === "list";
  const showMain = !isMobile || mobileView !== "list";

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", backgroundColor: "var(--background)" }}>

      {showSidebar && (
        <aside
          style={{
            width: isMobile ? "100%" : 320,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: isMobile ? "none" : "1px solid var(--border)",
            height: "100%",
            backgroundColor: "var(--card-bg)",
          }}
        >
          <div
            style={{
              padding: "16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <h1 style={{ fontSize: 18, fontWeight: "bold", margin: 0 }}>Записная книжка</h1>
            <button
              onClick={handleNew}
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                backgroundColor: "var(--accent)",
                color: "#fff",
                fontSize: 20,
                fontWeight: "bold",
                border: "none",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>

          <div style={{ padding: "12px 16px", flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                fontSize: 16,
                outline: "none",
                border: "1px solid var(--border)",
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
                boxSizing: "border-box",
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
            style={{
              padding: "12px 16px",
              fontSize: 12,
              borderTop: "1px solid var(--border)",
              color: "var(--muted)",
              flexShrink: 0,
            }}
          >
            Всего заметок: {notes.length} · v3.0
          </div>
        </aside>
      )}

      {showMain && (
        <main
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
            overflow: "hidden",
            backgroundColor: "var(--card-bg)",
          }}
        >
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {isMobile && (
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                  <button
                    onClick={handleCancel}
                    style={{ fontSize: 16, cursor: "pointer", color: "var(--accent)", background: "none", border: "none", padding: 0 }}
                  >
                    ← Назад
                  </button>
                </div>
              )}
              <div style={{ flex: 1, overflow: "hidden" }}>
                <NoteEditor
                  note={selectedNote}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              </div>
            </div>
          ) : selectedNote ? (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  padding: isMobile ? "12px 16px" : "16px 32px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                {isMobile && (
                  <button
                    onClick={handleBack}
                    style={{ fontSize: 16, cursor: "pointer", color: "var(--accent)", background: "none", border: "none", padding: 0, flexShrink: 0 }}
                  >
                    ←
                  </button>
                )}
                <h2 style={{ fontSize: isMobile ? 18 : 24, fontWeight: "bold", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, margin: 0 }}>
                  {selectedNote.title}
                </h2>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#fff",
                    backgroundColor: "var(--accent)",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Редактировать
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 16px" : "24px 32px", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 16 }}>
                {selectedNote.images?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    {selectedNote.images.map((img, i) => (
                      <img key={i} src={img} alt="" style={{ width: "100%", maxWidth: 300, borderRadius: 12 }} />
                    ))}
                  </div>
                )}
                {selectedNote.content || (
                  !selectedNote.images?.length && <span style={{ opacity: 0.4 }}>Пустая заметка</span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", opacity: 0.4 }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>📝</p>
                <p style={{ fontSize: 18 }}>Выберите заметку или создайте новую</p>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
