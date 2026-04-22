const EMAIL_TRIGGERS = [
  "напиши письмо",
  "написать письмо",
  "создай письмо",
  "создай email",
  "создай имейл",
  "отправь письмо",
  "отправить письмо",
  "email",
  "имейл",
  "емейл",
];

export function detectEmailTrigger(text: string): boolean {
  const lower = text.toLowerCase();
  return EMAIL_TRIGGERS.some((t) => lower.includes(t));
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
}

export function parseEmail(text: string): EmailData {
  let lower = text.toLowerCase();

  for (const t of EMAIL_TRIGGERS) {
    lower = lower.replace(t, "");
  }

  let to = "";
  const emailMatch = lower.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    to = emailMatch[0];
    lower = lower.replace(to, "");
  }

  const cleaned = lower.replace(/[,\.]+/g, " ").replace(/\s+/g, " ").trim();

  const words = cleaned.split(" ").filter(Boolean);
  const subject = words.slice(0, 6).join(" ");
  const body = cleaned;

  return {
    to,
    subject: subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : "Без темы",
    body: body || "",
  };
}

export function openGmailDraft(data: EmailData) {
  const params = new URLSearchParams();
  params.set("view", "cm");
  params.set("fs", "1");
  if (data.to) params.set("to", data.to);
  params.set("su", data.subject);
  params.set("body", data.body);

  window.open(`https://mail.google.com/mail/?${params}`, "_blank");
}
