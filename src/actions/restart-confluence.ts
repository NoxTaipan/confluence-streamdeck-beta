import streamDeck, { action, KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

type Settings = JsonObject;

// Ruta a tu propio checkout de confluence(-beta) - configurala con la variable
// de entorno CONFLUENCE_DIR (Panel de control -> Variables de entorno, o
// [Environment]::SetEnvironmentVariable("CONFLUENCE_DIR", "C:/ruta/a/confluence", "User")
// en PowerShell) y reinicia Stream Deck para que la tome. Sin esa variable,
// esta accion no va a encontrar los scripts y va a fallar con un error claro
// en vez de apuntar silenciosamente a la carpeta de otra persona.
const CONFLUENCE_DIR = process.env.CONFLUENCE_DIR;

/**
 * Reinicia el servidor de Confluence corriendo los mismos dos scripts que ya usa
 * el boton "Reiniciar" del dock nativo de OBS y obs-autostart.lua: stop.ps1 (mata
 * el PID guardado si sigue vivo) y start-hidden.vbs (lo relanza oculto).
 */
@action({ UUID: "tv.noxtaipan.confluence.restart-confluence" })
export class RestartConfluence extends SingletonAction<Settings> {
	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		if (!CONFLUENCE_DIR) {
			streamDeck.logger.error("restart-confluence: falta la variable de entorno CONFLUENCE_DIR");
			await ev.action.showAlert();
			return;
		}
		try {
			await execFileAsync("powershell.exe", [
				"-NoProfile",
				"-ExecutionPolicy",
				"Bypass",
				"-File",
				`${CONFLUENCE_DIR}/scripts/stop.ps1`
			]);
			await execFileAsync("wscript.exe", [`${CONFLUENCE_DIR}/scripts/start-hidden.vbs`]);
			await ev.action.showOk();
		} catch (err) {
			streamDeck.logger.error(`restart-confluence: error - ${err}`);
			await ev.action.showAlert();
		}
	}
}
