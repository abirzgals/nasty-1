const TRIGGER_WORDS = [
  "запиши в календарь",
  "добавь в календарь",
  "напомни",
  "поставь напоминание",
  "в календарь",
];

const WEEKDAYS: Record<string, number> = {
  "понедельник": 1, "вторник": 2, "среду": 3, "среда": 3,
  "четверг": 4, "пятницу": 5, "пятница": 5,
  "субботу": 6, "суббота": 6, "воскресенье": 0, "воскресение": 0,
};

const MONTHS: Record<string, number> = {
  "января": 0, "февраля": 1, "марта": 2, "апреля": 3,
  "мая": 4, "июня": 5, "июля": 6, "августа": 7,
  "сентября": 8, "октября": 9, "ноября": 10, "декабря": 11,
  "январь": 0, "февраль": 1, "март": 2, "апрель": 3,
  "май": 4, "июнь": 5, "июль": 6, "август": 7,
  "сентябрь": 8, "октябрь": 9, "ноябрь": 10, "декабрь": 11,
};

const WORD_NUMBERS: Record<string, number> = {
  "час": 1, "два": 2, "три": 3, "четыре": 4, "пять": 5,
  "шесть": 6, "семь": 7, "восемь": 8, "девять": 9, "десять": 10,
  "одиннадцать": 11, "двенадцать": 12, "час дня": 13, "два часа": 14,
};

export interface CalendarEvent {
  title: string;
  date: Date;
  duration: number; // minutes
}

export function detectCalendarTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  return TRIGGER_WORDS.some((t) => lower.includes(t));
}

export function parseCalendarEvent(text: string): CalendarEvent | null {
  const lower = text.toLowerCase();

  // Remove trigger words to get the title
  let cleaned = lower;
  for (const t of TRIGGER_WORDS) {
    cleaned = cleaned.replace(t, "");
  }

  const now = new Date();
  let eventDate = new Date(now);
  let hasDate = false;
  let hasTime = false;
  let duration = 60;

  // Parse "завтра"
  if (lower.includes("завтра")) {
    eventDate.setDate(eventDate.getDate() + 1);
    cleaned = cleaned.replace("завтра", "");
    hasDate = true;
  }

  // Parse "послезавтра"
  if (lower.includes("послезавтра")) {
    eventDate.setDate(eventDate.getDate() + 2);
    cleaned = cleaned.replace("послезавтра", "");
    hasDate = true;
  }

  // Parse "сегодня"
  if (lower.includes("сегодня")) {
    cleaned = cleaned.replace("сегодня", "");
    hasDate = true;
  }

  // Parse "через N дней/часов"
  const throughMatch = lower.match(/через\s+(\d+|два|три|четыре|пять)\s+(дн|час|день|дня)/);
  if (throughMatch) {
    const num = parseInt(throughMatch[1]) || WORD_NUMBERS[throughMatch[1]] || 1;
    if (throughMatch[2].startsWith("дн") || throughMatch[2].startsWith("день") || throughMatch[2].startsWith("дня")) {
      eventDate.setDate(eventDate.getDate() + num);
      hasDate = true;
    } else if (throughMatch[2].startsWith("час")) {
      eventDate.setHours(eventDate.getHours() + num);
      hasDate = true;
      hasTime = true;
    }
    cleaned = cleaned.replace(throughMatch[0], "");
  }

  // Parse weekday "в понедельник", "во вторник"
  for (const [day, num] of Object.entries(WEEKDAYS)) {
    if (lower.includes(day)) {
      const current = now.getDay();
      let diff = num - current;
      if (diff <= 0) diff += 7;
      eventDate.setDate(now.getDate() + diff);
      cleaned = cleaned.replace(new RegExp(`(в[о]?\\s+)?${day}`), "");
      hasDate = true;
      break;
    }
  }

  // Parse "15 мая", "20 января"
  const dateMatch = lower.match(/(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    const month = MONTHS[dateMatch[2]];
    eventDate.setMonth(month, day);
    if (eventDate < now) eventDate.setFullYear(eventDate.getFullYear() + 1);
    cleaned = cleaned.replace(dateMatch[0], "");
    hasDate = true;
  }

  // Parse time "в 15:00", "в 15 00", "в 15 часов"
  const timeMatch = lower.match(/в\s+(\d{1,2})[:\s]?(\d{2})?\s*(час|утра|дня|вечера)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const period = timeMatch[3];
    if (period === "дня" || period === "вечера") {
      if (hours < 12) hours += 12;
    }
    eventDate.setHours(hours, minutes, 0, 0);
    cleaned = cleaned.replace(timeMatch[0], "");
    hasTime = true;
  }

  // Parse word-based time "в час", "в два", "в три часа"
  if (!hasTime) {
    for (const [word, num] of Object.entries(WORD_NUMBERS)) {
      const regex = new RegExp(`в\\s+${word}(\\s+час)?`);
      if (regex.test(lower)) {
        let hours = num;
        if (hours <= 12 && hours < 7) hours += 12; // assume PM for small numbers
        eventDate.setHours(hours, 0, 0, 0);
        cleaned = cleaned.replace(regex, "");
        hasTime = true;
        break;
      }
    }
  }

  if (!hasDate && !hasTime) return null;

  // Default time if only date specified
  if (hasDate && !hasTime) {
    eventDate.setHours(10, 0, 0, 0);
  }

  // Clean up title
  let title = cleaned
    .replace(/[,\.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!title) title = "Напоминание";

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, date: eventDate, duration };
}

export function openGoogleCalendar(event: CalendarEvent) {
  const start = event.date;
  const end = new Date(start.getTime() + event.duration * 60000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);

  window.open(url.toString(), "_blank");
}

export function generateICSUrl(event: CalendarEvent): string {
  const start = event.date;
  const end = new Date(start.getTime() + event.duration * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `UID:${crypto.randomUUID()}@notes-app`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
}
