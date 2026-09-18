import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { callObs } from "../lib/obs-client";

type Settings = JsonObject;

const POLL_INTERVAL_MS = 4000;

/**
 * Arranca/para el stream principal de OBS (el que va a Twitch), equivalente al boton
 * "Start main stream (Twitch)" del dock nativo de Confluence Multistream. Usa el
 * request nativo de obs-websocket (StartStream/StopStream), no el vendor del plugin.
 */
@action({ UUID: "tv.noxtaipan.confluence.main-stream" })
export class MainStream extends SingletonAction<Settings> {
	private readonly pollers = new Map<string, ReturnType<typeof setInterval>>();

	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		await this.refreshState(ev.action);
		const timer = setInterval(() => {
			this.refreshState(ev.action).catch((err) => streamDeck.logger.debug(`main-stream: poll fallo - ${err}`));
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

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		try {
			await callObs("ToggleStream");
			await this.refreshState(ev.action);
		} catch (err) {
			streamDeck.logger.error(`main-stream: error al alternar el stream principal - ${err}`);
			await ev.action.showAlert();
		}
	}

	private async refreshState(action: WillAppearEvent<Settings>["action"]): Promise<void> {
		if (!action.isKey()) {
			return;
		}
		try {
			const status = await callObs<{ outputActive: boolean }>("GetStreamStatus");
			await action.setState(status.outputActive ? 1 : 0);
		} catch (err) {
			streamDeck.logger.debug(`main-stream: no se pudo refrescar estado - ${err}`);
		}
	}
}
