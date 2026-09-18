import streamDeck from "@elgato/streamdeck";

export type ConfluenceSettings = {
	confluenceUrl?: string;
};

const DEFAULT_URL = "http://127.0.0.1:7773";

async function getBaseUrl(): Promise<string> {
	const settings = await streamDeck.settings.getGlobalSettings<ConfluenceSettings>();
	return (settings.confluenceUrl || DEFAULT_URL).replace(/\/+$/, "");
}

export async function request<T = unknown>(path: string, init?: RequestInit): Promise<T> {
	const baseUrl = await getBaseUrl();
	const res = await fetch(`${baseUrl}${path}`, {
		headers: { "Content-Type": "application/json" },
		...init
	});
	if (!res.ok) {
		throw new Error(`Confluence respondio ${res.status} en ${path}`);
	}
	return res.json() as Promise<T>;
}

export type PushAllBody = {
	title?: string;
	tags?: string;
	twitchGameId?: string;
	youtubeCategoryId?: string;
	kickCategoryId?: string;
};

export type PushResult = Record<string, { ok: boolean; error?: string }>;

export async function pushAll(body: PushAllBody): Promise<PushResult> {
	return request<PushResult>("/api/push-all", { method: "POST", body: JSON.stringify(body) });
}

export async function pushPlatform(platform: "twitch" | "youtube" | "kick", body: PushAllBody): Promise<{ ok: boolean; error?: string }> {
	return request(`/api/push/${platform}`, { method: "POST", body: JSON.stringify(body) });
}

export async function sendChatMessage(message: string, platforms: string[]): Promise<PushResult> {
	return request<PushResult>("/api/chat/send", {
		method: "POST",
		body: JSON.stringify({ message, platforms })
	});
}
