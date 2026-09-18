import streamDeck, {
	action,
	DidReceiveSettingsEvent,
	KeyDownEvent,
	PropertyInspectorDidAppearEvent,
	SingletonAction,
	WillAppearEvent
} from "@elgato/streamdeck";
import type { JsonObject } from "@elgato/utils";
import { callMultiRtmpVendor, resolveTargetId } from "../lib/obs-client";

type Mode = "start" | "stop" | "toggle";

type Settings = JsonObject & {
	targetName?: string;
	mode?: Mode;
};

type KeyAction = WillAppearEvent<Settings>["action"];

const KNOWN_PLATFORMS = ["twitch", "youtube", "kick"] as const;

/**
 * Resuelve el logo de plataforma a mostrar segun el nombre configurado (mismo
 * matching por substring que usa UpdateBadge() en push-widget.cpp: "twitch"/
 * "youtube"/"kick" en el nombre). Si no matchea ninguna, `undefined` deja el
 * icono generico del manifest.
 */
function resolvePlatformImage(targetName: string | undefined, state: 0 | 1): string | undefined {
	const name = (targetName || "").toLowerCase();
	const platform = KNOWN_PLATFORMS.find((p) => name.includes(p));
	if (!platform) return undefined;
	return `imgs/actions/multistream-target/key-${platform}-${state === 1 ? "on" : "off"}.png`;
}

async function applyState(action: KeyAction, targetName: string | undefined, state: 0 | 1): Promise<void> {
	if (!action.isKey()) return;
	await action.setState(state);
	await action.setImage(resolvePlatformImage(targetName, state));
}

/**
 * Boton que arranca/para/alterna un target de Confluence Multistream (Youtube/Kick,
 * u otro nombre configurado en el plugin nativo de OBS) via el vendor `sorayuki.multi_rtmp`
 * de obs-websocket.
 *
 * `GetTargetState`/`ToggleTarget` del lado de OBS resultaron no ser confiables (devuelven
 * "stopped" incluso con el target realmente streameando - confirmado con pruebas directas).
 * Por eso la decision de arrancar/parar en modo "Alternar" usa el propio estado que ya
 * pinta el boton (`ev.payload.state`) como fuente de verdad en vez de volver a preguntarle
 * a OBS, y siempre manda `StartTarget`/`StopTarget` explicito - nunca `ToggleTarget`.
 *
 * `DisableAutomaticStates: true` en el manifest es obligatorio para esto: sin eso, Stream
 * Deck alterna el estado visual solo en cada tecla, peleando con `setState()` propio y
 * haciendo que el "estado actual" nunca sea confiable.
 */
@action({ UUID: "tv.noxtaipan.confluence.multistream-target" })
export class MultistreamTarget extends SingletonAction<Settings> {
	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		const { targetName } = ev.payload.settings;
		if (!ev.action.isKey()) return;

		// Icono de plataforma aplica ya mismo aunque no se pueda confirmar el estado real.
		await ev.action.setImage(resolvePlatformImage(targetName, (ev.payload.state ?? 0) as 0 | 1));

		if (!targetName) return;
		try {
			const id = await resolveTargetId(targetName);
			const state = await callMultiRtmpVendor<{ state?: string }>("GetTargetState", { id });
			// Un "stopped" de GetTargetState no es confiable, asi que solo se usa para
			// prender el icono si por casualidad acierta - nunca para apagarlo.
			if (state.state === "running") {
				await applyState(ev.action, targetName, 1);
			}
		} catch (err) {
			streamDeck.logger.debug(`multistream-target: no se pudo sincronizar estado inicial de "${targetName}" - ${err}`);
		}
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): Promise<void> {
		if (!ev.action.isKey()) return;
		await ev.action.setImage(resolvePlatformImage(ev.payload.settings.targetName, (ev.payload.state ?? 0) as 0 | 1));
	}

	/**
	 * Apenas se abre el Property Inspector, le empuja la lista real de targets
	 * (ListTargets) para que arme un dropdown - asi no se puede repetir el bug
	 * de escribir "YouTube" en vez de "Youtube" a mano.
	 */
	override async onPropertyInspectorDidAppear(ev: PropertyInspectorDidAppearEvent<Settings>): Promise<void> {
		try {
			const { targets } = await callMultiRtmpVendor<{ targets: { id: string; name: string }[] }>("ListTargets");
			await streamDeck.ui.sendToPropertyInspector({ event: "targets", targets });
		} catch (err) {
			streamDeck.logger.warn(`multistream-target: no se pudo listar targets para el PI - ${err}`);
			await streamDeck.ui.sendToPropertyInspector({ event: "targets", targets: [], error: String(err) });
		}
	}

	override async onKeyDown(ev: KeyDownEvent<Settings>): Promise<void> {
		const { targetName, mode = "toggle" } = ev.payload.settings;
		if (!targetName) {
			await ev.action.showAlert();
			return;
		}

		let requestType: string;
		let nextState: 0 | 1;
		if (mode === "start") {
			requestType = "StartTarget";
			nextState = 1;
		} else if (mode === "stop") {
			requestType = "StopTarget";
			nextState = 0;
		} else {
			const currentState = ev.payload.state ?? 0;
			requestType = currentState === 0 ? "StartTarget" : "StopTarget";
			nextState = currentState === 0 ? 1 : 0;
		}

		try {
			const id = await resolveTargetId(targetName);
			await callMultiRtmpVendor(requestType, { id });
			await applyState(ev.action, targetName, nextState);
		} catch (err) {
			streamDeck.logger.error(`multistream-target: error al ${mode} "${targetName}" - ${err}`);
			await ev.action.showAlert();
		}
	}
}
