"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import NotesList from "./NotesList";
import NoteEditor from "./NoteEditor";
import CalendarModal from "./CalendarModal";

export interface Note {
  id: string;
  title: string;
  content: string;
  images: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
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

interface NotesAppProps {
  userId: string;
  onLogout: () => void;
}

export default function NotesApp({ userId, onLogout }: NotesAppProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("list");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) {
          setNotes(
            data.map((n) => ({
              id: n.id,
              title: n.title,
              content: n.content,
              images: n.images || [],
              pinned: n.pinned || false,
              archived: n.archived || false,
              createdAt: new Date(n.created_at).getTime(),
              updatedAt: new Date(n.updated_at).getTime(),
            }))
          );
        }
        setLoaded(true);
      });
  }, [userId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = showArchive
      ? notes.filter((n) => n.archived)
      : notes.filter((n) => !n.archived);
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [notes, search, showArchive]);

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

  const handleSave = useCallback(async (title: string, content: string, images: string[]) => {
    const now = new Date().toISOString();

    if (selectedId) {
      await supabase
        .from("notes")
        .update({ title, content, images, updated_at: now })
        .eq("id", selectedId);
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedId
            ? { ...n, title, content, images, updatedAt: Date.now() }
            : n
        )
      );
    } else {
      const { data } = await supabase
        .from("notes")
        .insert({ user_id: userId, title, content, images, created_at: now, updated_at: now })
        .select()
        .single();
      if (data) {
        const newNote: Note = {
          id: data.id,
          title,
          content,
          images,
          pinned: false,
          archived: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setNotes((prev) => [newNote, ...prev]);
        setSelectedId(data.id);
      }
    }
    setEditing(false);
    setMobileView("list");

    const fullText = `${title} ${content}`;
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: fullText }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.type === "calendar" && result.calendar) {
          const start = new Date(`${result.calendar.date}T${result.calendar.time}`);
          const end = new Date(start.getTime() + (result.calendar.duration || 60) * 60000);
          const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
          const params = new URLSearchParams({
            title: result.calendar.title || title,
            start: fmt(start),
            end: fmt(end),
          });
          window.open(`/api/calendar?${params}`, "_self");
        } else if (result.type === "email" && result.email) {
          const p = new URLSearchParams();
          if (result.email.to) p.set("to", result.email.to);
          if (result.email.subject) p.set("subject", result.email.subject);
          if (result.email.body) p.set("body", result.email.body);
          window.location.href = `googlegmail:///co?${p}`;
        }
      })
      .catch(() => {});
  }, [selectedId, userId]);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setEditing(false);
      setMobileView("list");
    }
  }, [selectedId]);

  const handlePin = useCallback(async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const newPinned = !note.pinned;
    await supabase.from("notes").update({ pinned: newPinned }).eq("id", id);
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, pinned: newPinned } : n));
  }, [notes]);

  const handleArchive = useCallback(async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    const newArchived = !note.archived;
    await supabase.from("notes").update({ archived: newArchived }).eq("id", id);
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, archived: newArchived } : n));
    if (selectedId === id) {
      setSelectedId(null);
      setEditing(false);
      setMobileView("list");
    }
  }, [notes, selectedId]);

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

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>
        Загрузка...
      </div>
    );
  }

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
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={onLogout}
                title="Выйти"
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  backgroundColor: "var(--background)",
                  color: "var(--muted)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
              <button
                onClick={() => setShowCalendar(true)}
                title="Добавить в календарь"
                style={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </button>
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
            onPin={handlePin}
            onArchive={handleArchive}
            isArchiveView={showArchive}
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
            <span>Всего: {notes.filter((n) => !n.archived).length}</span>
            <button
              onClick={() => setShowArchive(!showArchive)}
              style={{
                background: "none",
                border: "none",
                color: showArchive ? "var(--accent)" : "var(--muted)",
                cursor: "pointer",
                fontSize: 12,
                padding: 0,
              }}
            >
              {showArchive ? "← Заметки" : `Архив (${notes.filter((n) => n.archived).length})`}
            </button>
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
                {selectedNote.content ? (
                  selectedNote.content.includes("[ ]") || selectedNote.content.includes("[x]") ? (
                    <div>
                      {selectedNote.content.split("\n").filter(Boolean).map((line, i) => {
                        const checked = line.startsWith("[x]");
                        const text = line.replace(/^\[[ x]\] /, "");
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
                            <span style={{
                              width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                              border: checked ? "none" : "2px solid var(--border)",
                              backgroundColor: checked ? "var(--accent)" : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#fff", fontSize: 12,
                            }}>
                              {checked ? "✓" : ""}
                            </span>
                            <span style={{ textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.5 : 1 }}>
                              {text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : selectedNote.content
                ) : (
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

      {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} />}
    </div>
  );
}
