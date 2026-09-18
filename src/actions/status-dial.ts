import streamDeck, { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { request } from "../lib/confluence-client";
import { callObs } from "../lib/obs-client";

type Settings = JsonObject;

const POLL_INTERVAL_MS = 5000;

type ChatStatus = { twitch: boolean; youtube: boolean; kick: boolean };

/**
 * Dial de Stream Deck+ (sin botones, solo pantalla) con un resumen del estado
 * de Confluence: cuantas plataformas tienen el chat conectado, y si el stream
 * principal (Twitch) esta en vivo. Solo lee, no dispara nada al girar/tocar -
 * el dial es puramente informativo en v1.
 */
@action({ UUID: "tv.noxtaipan.confluence.status-dial" })
export class StatusDial extends SingletonAction<Settings> {
	private readonly pollers = new Map<string, ReturnType<typeof setInterval>>();

	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		await this.refresh(ev.action);
		const timer = setInterval(() => {
			this.refresh(ev.action).catch((err) => streamDeck.logger.debug(`status-dial: poll fallo - ${err}`));
		}, POLL_INTERVAL_MS);
		this.pollers.set(ev.action.id, timer);
	}

	override onWillDisappear(ev: WillDisappearEvent<Settings>): void {
		const timer = this.pollers.get(ev.action.id);
		if (timer) {
			clearInterval(timer);
			this.pollers.delete(ev.action.id);
		}
	}

	private async refresh(action: WillAppearEvent<Settings>["action"]): Promise<void> {
		if (!action.isDial()) return;

		let chatText = "Chat: ?";
		try {
			const chat = await request<ChatStatus>("/api/push/status");
			const connected = [chat.twitch, chat.youtube, chat.kick].filter(Boolean).length;
			chatText = `Chat ${connected}/3`;
		} catch (err) {
			streamDeck.logger.debug(`status-dial: no se pudo leer estado de chat - ${err}`);
		}

		let streamText = "Twitch: ?";
		try {
			const status = await callObs<{ outputActive: boolean }>("GetStreamStatus");
			streamText = status.outputActive ? "Twitch LIVE" : "Twitch off";
		} catch (err) {
			streamDeck.logger.debug(`status-dial: no se pudo leer estado del stream - ${err}`);
		}

		try {
			await action.setFeedback({ value: `${chatText}  ${streamText}` });
		} catch (err) {
			streamDeck.logger.debug(`status-dial: no se pudo actualizar feedback - ${err}`);
		}
	}
}
