import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { callMultiRtmpVendor, callObs } from "../lib/obs-client";

type Settings = JsonObject;

const MAIN_STREAM_MARGIN_MS = 1000;

/**
 * Equivalente al boton "Start all" del dock nativo: arranca el stream principal
 * primero (Youtube/Kick comparten su encoder con el, ver [[project_confluence]] -
 * fallan con "Failed to create encoder object" si arrancan antes) y despues los
 * targets extra via el vendor `StartAll`, que a diferencia del boton nativo no
 * toca el stream principal por su cuenta.
 */
@action({ UUID: "tv.noxtaipan.confluence.start-all" })
export class StartAll extends SingletonAction<Settings> {
	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		try {
			const status = await callObs<{ outputActive: boolean }>("GetStreamStatus");
			if (!status.outputActive) {
				await callObs("StartStream");
				await new Promise((resolve) => setTimeout(resolve, MAIN_STREAM_MARGIN_MS));
			}
			await callMultiRtmpVendor("StartAll");
			await ev.action.showOk();
		} catch (err) {
			streamDeck.logger.error(`start-all: error - ${err}`);
			await ev.action.showAlert();
		}
	}
}
