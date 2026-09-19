import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { createTwitchClip } from "../lib/confluence-client";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type Settings = JsonObject;

/**
 * Crea un clip de Twitch via Confluence (equivalente al boton "Crear clip
 * (Twitch)" del dock de Stream Info). Twitch solo puede clippear un canal
 * en vivo - si falla lo mas probable es que el stream este offline.
 * Abre el edit_url devuelto en el navegador default via cmd /c start -
 * mismo mecanismo que Windows Explorer usa para "abrir con", sin pasar la
 * URL por un shell string (evita problemas de escaping/injection).
 */
@action({ UUID: "tv.noxtaipan.confluence.create-clip" })
export class CreateClip extends SingletonAction<Settings> {
	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		try {
			const { ok, result, error } = await createTwitchClip();
			if (!ok || !result) throw new Error(error ?? "respuesta sin resultado");
			await execFileAsync("cmd.exe", ["/c", "start", "", result.editUrl]);
			await ev.action.showOk();
		} catch (err) {
			streamDeck.logger.error(`create-clip: error - ${err}`);
			await ev.action.showAlert();
		}
	}
}
