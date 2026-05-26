const rawSiteUrl = import.meta.env.VITE_SITE_URL as string | undefined;

export const SITE_URL = rawSiteUrl?.replace(/\/$/, "") ?? "";

export const SITE_NAME = "NexTalk";

export const DEFAULT_DESCRIPTION =
  "NexTalk is a chat app for messaging friends and family with group chats, voice messages, and audio or video calls.";

export const DEFAULT_TITLE = "NexTalk — Chat with friends and family";

export const DEFAULT_KEYWORDS =
  "NexTalk, chat app, messaging, group chat, video call, voice message, real-time chat";

export function absoluteUrl(path: string): string {
  if (!SITE_URL) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
}

export function ogImageUrl(): string {
  return absoluteUrl("/logo.png");
}
