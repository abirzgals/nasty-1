"use client";

import { useState, useEffect } from "react";
import type { Note } from "./NotesApp";

interface NoteEditorProps {
  note: Note | null;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

export default function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), content);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <input
        type="text"
        placeholder="Заголовок заметки..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-2xl font-bold px-6 py-4 bg-transparent border-b outline-none placeholder:opacity-50"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        autoFocus
      />
      <textarea
        placeholder="Начните писать..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-1 w-full px-6 py-4 bg-transparent outline-none resize-none text-base leading-relaxed placeholder:opacity-50"
        style={{ color: "var(--foreground)" }}
      />
      <div
        className="flex gap-3 px-6 py-4 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-5 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          style={{ backgroundColor: "var(--accent)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--accent-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--accent)")
          }
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-lg font-medium transition-colors cursor-pointer"
          style={{
            backgroundColor: "var(--border)",
            color: "var(--foreground)",
          }}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
