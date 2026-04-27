"use client";

import { useState, useEffect, useRef } from "react";
import type { Note } from "./NotesApp";

interface NoteEditorProps {
  note: Note | null;
  onSave: (title: string, content: string, images: string[]) => void;
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

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h * maxSize) / w; w = maxSize; }
          else { w = (w * maxSize) / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function ChecklistEditor({ content, onChange }: { content: string; onChange: (c: string) => void }) {
  const lines = content.split("\n");
  const [newItem, setNewItem] = useState("");

  const toggleItem = (index: number) => {
    const updated = lines.map((line, i) => {
      if (i !== index) return line;
      return line.startsWith("[x]") ? line.replace("[x]", "[ ]") : line.replace("[ ]", "[x]");
    });
    onChange(updated.join("\n"));
  };

  const removeItem = (index: number) => {
    onChange(lines.filter((_, i) => i !== index).join("\n"));
  };

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    onChange((content ? content + "\n" : "") + `[ ] ${text}`);
    setNewItem("");
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
      {lines.filter(Boolean).map((line, i) => {
        const checked = line.startsWith("[x]");
        const text = line.replace(/^\[[ x]\] /, "");
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => toggleItem(i)}
              style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0, cursor: "pointer",
                border: checked ? "none" : "2px solid var(--border)",
                backgroundColor: checked ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 14,
              }}
            >
              {checked ? "✓" : ""}
            </button>
            <span style={{
              flex: 1, fontSize: 16,
              textDecoration: checked ? "line-through" : "none",
              opacity: checked ? 0.5 : 1,
              color: "var(--foreground)",
            }}>
              {text}
            </span>
            <button
              type="button"
              onClick={() => removeItem(i)}
              style={{ background: "none", border: "none", color: "var(--danger)", opacity: 0.4, cursor: "pointer", fontSize: 16, flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        );
      })}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          type="text"
          placeholder="Новый пункт..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
          style={{
            flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 16,
            border: "1px solid var(--border)", backgroundColor: "var(--background)",
            color: "var(--foreground)", outline: "none",
          }}
        />
        <button
          type="button"
          onClick={addItem}
          style={{
            width: 40, height: 40, borderRadius: 10, border: "none",
            backgroundColor: "var(--accent)", color: "#fff", fontSize: 20, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function NoteEditor({ note, onSave, onCancel }: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isChecklist, setIsChecklist] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const contentRef = useRef(content);
  const galleryRef = useRef<HTMLInputElement>(null);
  contentRef.current = content;

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setImages(note.images || []);
      setIsChecklist(note.content.includes("[ ]") || note.content.includes("[x]"));
    } else {
      setTitle("");
      setContent("");
      setImages([]);
    }
  }, [note]);

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || content.trim().split(/\s+/).slice(0, 5).join(" ") || "Фото заметка";
    onSave(finalTitle, content, images);
  };

  const handlePhoto = async (files: FileList | null) => {
    if (!files) return;
    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const resized = await resizeImage(files[i], 1200);
      newImages.push(resized);
    }
    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

  const hasContent = title.trim() || content.trim() || images.length > 0;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <input
        type="text"
        placeholder="Заголовок заметки..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{
          width: "100%",
          fontSize: 18,
          fontWeight: "bold",
          padding: "12px 16px",
          backgroundColor: "transparent",
          borderBottom: "1px solid var(--border)",
          border: "none",
          borderBlockEnd: "1px solid var(--border)",
          outline: "none",
          color: "var(--foreground)",
          flexShrink: 0,
        }}
        autoFocus
      />

      {/* Images preview */}
      {images.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
              <button
                type="button"
                onClick={() => removeImage(i)}
                style={{
                  position: "absolute",
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  backgroundColor: "var(--danger)",
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
        {isChecklist ? (
          <ChecklistEditor content={content} onChange={setContent} />
        ) : (
          <textarea
            placeholder="Начните писать или нажмите микрофон..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              flex: 1,
              width: "100%",
              padding: "12px 16px",
              paddingRight: 56,
              backgroundColor: "transparent",
              outline: "none",
              resize: "none",
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--foreground)",
              border: "none",
            }}
          />
        )}
        <button
          type="button"
          onClick={toggleDictation}
          title={listening ? "Остановить запись" : "Надиктовать голосом"}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: listening ? "#dc2626" : "var(--accent)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            animation: listening ? "pulse 1.2s ease-in-out infinite" : undefined,
          }}
        >
          {listening ? (
            <span style={{ display: "block", width: 12, height: 12, backgroundColor: "#fff", borderRadius: 2 }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
            </svg>
          )}
        </button>
        {speechError && (
          <div style={{ position: "absolute", top: 60, right: 12, fontSize: 12, padding: "8px 12px", borderRadius: 8, backgroundColor: "#fee2e2", color: "#991b1b" }}>
            {speechError}
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`}</style>

      {/* Hidden file input — iOS shows "Take Photo / Photo Library / Choose File" */}
      <input ref={galleryRef} type="file" accept="image/*" multiple onChange={(e) => { handlePhoto(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />

      {/* Bottom toolbar */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border)", flexShrink: 0, alignItems: "center" }}>
        {/* Photo button */}
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          title="Добавить фото"
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: "var(--foreground)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </button>

        {/* Link button */}
        <button
          type="button"
          onClick={() => {
            const url = prompt("Вставьте ссылку:");
            if (url?.trim()) {
              const prev = contentRef.current;
              const sep = prev && !prev.endsWith("\n") ? "\n" : "";
              setContent(prev + sep + url.trim());
            }
          }}
          title="Добавить ссылку"
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            color: "var(--foreground)",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>

        {/* Checklist toggle */}
        <button
          type="button"
          onClick={() => {
            if (!isChecklist) {
              const lines = content.split("\n").filter(Boolean);
              if (lines.length > 0) {
                setContent(lines.map((l) => `[ ] ${l.replace(/^\[[ x]\] /, "")}`).join("\n"));
              } else {
                setContent("[ ] ");
              }
            }
            setIsChecklist(!isChecklist);
          }}
          title={isChecklist ? "Обычный текст" : "Чеклист"}
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            backgroundColor: isChecklist ? "var(--accent)" : "var(--background)",
            color: isChecklist ? "#fff" : "var(--foreground)",
            border: isChecklist ? "none" : "1px solid var(--border)",
            cursor: "pointer",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        </button>

        <div style={{ flex: 1 }} />

        {/* Save */}
        <button
          type="submit"
          disabled={!hasContent}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            backgroundColor: hasContent ? "var(--accent)" : "var(--border)",
            color: hasContent ? "#fff" : "var(--muted)",
            fontWeight: 500,
            fontSize: 16,
            border: "none",
            cursor: hasContent ? "pointer" : "not-allowed",
            opacity: hasContent ? 1 : 0.5,
          }}
        >
          Сохранить
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "10px 20px",
            borderRadius: 12,
            backgroundColor: "var(--border)",
            color: "var(--foreground)",
            fontWeight: 500,
            fontSize: 16,
            border: "none",
            cursor: "pointer",
          }}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
