"use client";

import { useState, useEffect, useRef } from "react";
import type { Note } from "./NotesApp";

interface NoteEditorProps {
  note: Note | null;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionErrorEvent = { error: string };

export default function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle("");
      setContent("");
    }
  }, [note]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || content.trim().split(/\s+/).slice(0, 5).join(" ") || "Без названия";
    onSave(finalTitle, content);
  };

  const toggleDictation = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!Ctor) {
      setSpeechError("Браузер не поддерживает распознавание речи");
      return;
    }

    const rec = new Ctor();
    rec.lang = "ru-RU";
    rec.continuous = true;
    rec.interimResults = false;

    rec.onresult = (e) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
      }
      if (finalText) {
        const prev = contentRef.current;
        const sep = prev && !prev.endsWith(" ") && !prev.endsWith("\n") ? " " : "";
        setContent(prev + sep + finalText.trim());
      }
    };

    rec.onerror = (e) => {
      setSpeechError(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "Нет доступа к микрофону"
          : `Ошибка: ${e.error}`
      );
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    setSpeechError(null);
    setListening(true);
    rec.start();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <input
        type="text"
        placeholder="Заголовок заметки..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-lg lg:text-2xl font-bold px-4 lg:px-6 py-3 lg:py-4 bg-transparent border-b outline-none placeholder:opacity-50 shrink-0"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        autoFocus
      />
      <div className="relative flex-1 flex flex-col">
        <textarea
          placeholder="Начните писать или нажмите микрофон..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 w-full px-4 lg:px-6 py-3 lg:py-4 pr-16 bg-transparent outline-none resize-none text-base leading-relaxed placeholder:opacity-50"
          style={{ color: "var(--foreground)" }}
        />
        <button
          type="button"
          onClick={toggleDictation}
          title={listening ? "Остановить запись" : "Надиктовать голосом"}
          className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center rounded-full text-white transition-colors cursor-pointer active:scale-95"
          style={{
            backgroundColor: listening ? "#dc2626" : "var(--accent)",
            animation: listening ? "pulse 1.2s ease-in-out infinite" : undefined,
          }}
        >
          {listening ? (
            <span className="block w-3 h-3 bg-white rounded-sm" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
          )}
        </button>
        {speechError && (
          <div
            className="absolute top-16 right-3 text-xs px-3 py-2 rounded-lg"
            style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}
          >
            {speechError}
          </div>
        )}
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>
      <div
        className="flex gap-3 px-4 lg:px-6 py-3 lg:py-4 border-t shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="submit"
          disabled={!title.trim() && !content.trim()}
          className="flex-1 lg:flex-none px-5 py-3 lg:py-2.5 rounded-xl text-white font-medium transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed active:scale-95 text-base"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 lg:flex-none px-5 py-3 lg:py-2.5 rounded-xl font-medium transition-colors cursor-pointer active:scale-95 text-base"
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
