import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { sendChatMessage } from "../lib/confluence-client";

type Settings = JsonObject & {
	message?: string;
	twitch?: boolean;
	youtube?: boolean;
	kick?: boolean;
};

/**
 * Manda un mensaje predefinido al chat de Confluence Chat, a las plataformas
 * que esten tildadas - via /api/chat/send. Cada botn guarda su propio mensaje,
 * asi que se pueden armar varios (ej. "!discord", "brb", "gracias por el sub").
 */
@action({ UUID: "tv.noxtaipan.confluence.chat-send" })
export class ChatSend extends SingletonAction<Settings> {
	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const { message } = ev.payload.settings;
		const twitch = ev.payload.settings.twitch ?? true;
		const youtube = ev.payload.settings.youtube ?? true;
		const kick = ev.payload.settings.kick ?? true;

		if (!message) {
			await ev.action.showAlert();
			return;
		}

		const platforms: string[] = [];
		if (twitch) platforms.push("twitch");
		if (youtube) platforms.push("youtube");
		if (kick) platforms.push("kick");

		if (platforms.length === 0) {
			await ev.action.showAlert();
			return;
		}

		try {
			const result = await sendChatMessage(message, platforms);
			const failures = Object.entries(result)
				.filter(([, r]) => !r.ok)
				.map(([platform, r]) => `${platform}: ${r.error}`);

			if (failures.length > 0) {
				streamDeck.logger.error(`chat-send: fallo en ${failures.join(" | ")}`);
				await ev.action.showAlert();
			} else {
				await ev.action.showOk();
			}
		} catch (err) {
			streamDeck.logger.error(`chat-send: error - ${err}`);
			await ev.action.showAlert();
		}
	}
}
