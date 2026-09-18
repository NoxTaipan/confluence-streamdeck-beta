import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { pushAll, pushPlatform } from "../lib/confluence-client";

type Settings = JsonObject & {
	title?: string;
	tags?: string;
	twitchGameId?: string;
	youtubeCategoryId?: string;
	kickCategoryId?: string;
	twitch?: boolean;
	youtube?: boolean;
	kick?: boolean;
};

/**
 * Empuja titulo/tags/categoria a Twitch, YouTube y Kick de una - equivalente al
 * boton "Push" del dock de Confluence Stream Info, pero sin tener que abrirlo.
 * Cada instancia de este boton guarda su propia config, asi que se pueden armar
 * varios presets (ej. "Just Chatting" vs "Valorant") como botones separados.
 */
@action({ UUID: "tv.noxtaipan.confluence.push-info" })
export class PushInfo extends SingletonAction<Settings> {
	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const { title, tags, twitchGameId, youtubeCategoryId, kickCategoryId } = ev.payload.settings;
		const twitch = ev.payload.settings.twitch ?? true;
		const youtube = ev.payload.settings.youtube ?? true;
		const kick = ev.payload.settings.kick ?? true;

		if (!twitch && !youtube && !kick) {
			await ev.action.showAlert();
			return;
		}

		const body = { title, tags, twitchGameId, youtubeCategoryId, kickCategoryId };

		try {
			let failures: string[] = [];
			if (twitch && youtube && kick) {
				const result = await pushAll(body);
				failures = Object.entries(result)
					.filter(([, r]) => !r.ok)
					.map(([platform, r]) => `${platform}: ${r.error}`);
			} else {
				const platforms: Array<"twitch" | "youtube" | "kick"> = [];
				if (twitch) platforms.push("twitch");
				if (youtube) platforms.push("youtube");
				if (kick) platforms.push("kick");

				const results = await Promise.allSettled(platforms.map((p) => pushPlatform(p, body)));
				results.forEach((result, i) => {
					if (result.status === "rejected") {
						failures.push(`${platforms[i]}: ${result.reason}`);
					} else if (!result.value.ok) {
						failures.push(`${platforms[i]}: ${result.value.error}`);
					}
				});
			}

			if (failures.length > 0) {
				streamDeck.logger.error(`push-info: fallo en ${failures.join(" | ")}`);
				await ev.action.showAlert();
			} else {
				await ev.action.showOk();
			}
		} catch (err) {
			streamDeck.logger.error(`push-info: error - ${err}`);
			await ev.action.showAlert();
		}
	}
}
