import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `Ты — ассистент в приложении заметок. Пользователь надиктовал текст. Определи, что он хочет:

1. "note" — просто заметка, ничего больше
2. "calendar" — нужно создать событие в календаре (встреча, напоминание, задача с датой/временем)
3. "email" — нужно написать/отправить письмо

Верни JSON (и ТОЛЬКО JSON, без markdown):
{
  "type": "note" | "calendar" | "email",
  "title": "краткий заголовок",
  "calendar": {
    "title": "название события",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "duration": 60
  },
  "email": {
    "to": "адрес если указан, иначе пустая строка",
    "subject": "тема письма",
    "body": "текст письма"
  }
}

Поля calendar и email заполняй только если type соответствует.
Для calendar: если дата не указана явно, используй завтра. Если время не указано, используй 10:00.
Текущая дата и время: ${new Date().toISOString()}`;

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const { text } = await req.json();

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ type: "note", title: text.slice(0, 50) });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch {
    return NextResponse.json({ type: "note", title: text.slice(0, 50) });
  }
}
