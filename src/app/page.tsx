"use client";

import { useEffect } from "react";
import NotesApp from "@/components/NotesApp";

export default function Home() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return <NotesApp />;
}
