"use client";

import { useState } from "react";

export default function SetupPage() {
  const [copied, setCopied] = useState(false);
  const bookmarkletCode = `javascript:void(window.open('https://notes-app-omega-green.vercel.app/share?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title)))`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 24px",
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
      fontFamily: "-apple-system, sans-serif",
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
      <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 24, textAlign: "center" }}>
        Сохранять ссылки из Safari
      </h1>

      <div style={{
        maxWidth: 340,
        width: "100%",
        backgroundColor: "var(--card-bg)",
        borderRadius: 16,
        padding: 20,
        border: "1px solid var(--border)",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Быстрая настройка:</h2>

        <div style={{ fontSize: 15, lineHeight: 1.8 }}>
          <p style={{ marginBottom: 12 }}>
            <b>1.</b> Нажмите кнопку ниже — скопируется код
          </p>

          <button
            onClick={handleCopy}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              backgroundColor: copied ? "#22c55e" : "var(--accent)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            {copied ? "Скопировано!" : "Скопировать код"}
          </button>

          <p style={{ marginBottom: 8 }}>
            <b>2.</b> Добавьте <b>любую</b> страницу в закладки Safari (нажмите Поделиться → Добавить закладку)
          </p>
          <p style={{ marginBottom: 8 }}>
            <b>3.</b> Откройте закладки, найдите её, нажмите <b>Править</b>
          </p>
          <p style={{ marginBottom: 8 }}>
            <b>4.</b> Удалите адрес и <b>вставьте</b> скопированный код
          </p>
          <p style={{ marginBottom: 8 }}>
            <b>5.</b> Переименуйте в <b>&quot;В заметки&quot;</b>
          </p>
        </div>
      </div>

      <div style={{
        maxWidth: 340,
        width: "100%",
        marginTop: 24,
        backgroundColor: "var(--card-bg)",
        borderRadius: 16,
        padding: 20,
        border: "1px solid var(--border)",
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Как пользоваться:</h2>
        <div style={{ fontSize: 15, lineHeight: 1.8 }}>
          <p>Откройте любой сайт → нажмите в адресной строке → выберите закладку <b>&quot;В заметки&quot;</b> → ссылка сохранится!</p>
        </div>
      </div>

      <a
        href="/"
        style={{
          marginTop: 32,
          color: "var(--accent)",
          fontSize: 16,
          textDecoration: "none",
        }}
      >
        ← Вернуться к заметкам
      </a>
    </div>
  );
}
