import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { callMultiRtmpVendor, callObs } from "../lib/obs-client";

type Settings = JsonObject;

/**
 * Equivalente al boton "Stop all" del dock nativo: para todos los targets extra
 * (Youtube/Kick) y despues el stream principal.
 */
@action({ UUID: "tv.noxtaipan.confluence.stop-all" })
export class StopAll extends SingletonAction<Settings> {
	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		try {
			await callMultiRtmpVendor("StopAll");
			const status = await callObs<{ outputActive: boolean }>("GetStreamStatus");
			if (status.outputActive) {
				await callObs("StopStream");
			}
			await ev.action.showOk();
		} catch (err) {
			streamDeck.logger.error(`stop-all: error - ${err}`);
			await ev.action.showAlert();
		}
	}
}
