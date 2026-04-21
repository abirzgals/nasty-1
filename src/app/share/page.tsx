"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ShareHandler() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const title = params.get("title") || "";
    const text = params.get("text") || "";
    const url = params.get("url") || "";

    const noteTitle = title || "Сохранённая ссылка";
    const parts = [text, url].filter(Boolean);
    const noteContent = parts.join("\n\n");

    if (noteContent) {
      const STORAGE_KEY = "notes-app-data";
      let notes = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) notes = JSON.parse(raw);
      } catch {}

      const newNote = {
        id: crypto.randomUUID(),
        title: noteTitle,
        content: noteContent,
        images: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      notes.unshift(newNote);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    router.replace("/");
  }, [params, router]);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontSize: 18,
      color: "var(--muted)",
    }}>
      Сохраняю...
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Сохраняю...</div>}>
      <ShareHandler />
    </Suspense>
  );
}
