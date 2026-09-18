import streamDeck from "@elgato/streamdeck";
import OBSWebSocket from "obs-websocket-js";

const VENDOR_NAME = "sorayuki.multi_rtmp";

export type ObsSettings = {
	obsHost?: string;
	obsPort?: number;
	obsPassword?: string;
};

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4455;

let obs: OBSWebSocket | null = null;
let connecting: Promise<OBSWebSocket> | null = null;

async function getObsSettings(): Promise<ObsSettings> {
	return streamDeck.settings.getGlobalSettings<ObsSettings>();
}

async function connect(): Promise<OBSWebSocket> {
	const settings = await getObsSettings();
	const host = settings.obsHost || DEFAULT_HOST;
	const port = settings.obsPort || DEFAULT_PORT;
	const url = `ws://${host}:${port}`;

	const client = new OBSWebSocket();
	client.on("ConnectionClosed", () => {
		streamDeck.logger.info("obs-websocket: conexion cerrada");
		if (obs === client) {
			obs = null;
		}
	});

	await client.connect(url, settings.obsPassword || undefined);
	streamDeck.logger.info(`obs-websocket: conectado a ${url}`);
	return client;
}

/**
 * Devuelve una conexion viva a obs-websocket, conectando (o reconectando) segun haga falta.
 * Unica conexion compartida entre todas las instancias de acciones del plugin.
 */
async function getObs(): Promise<OBSWebSocket> {
	if (obs) {
		return obs;
	}
	if (!connecting) {
		connecting = connect()
			.then((client) => {
				obs = client;
				return client;
			})
			.finally(() => {
				connecting = null;
			});
	}
	return connecting;
}

/**
 * Llama a un request del vendor `sorayuki.multi_rtmp` que expone obs-multi-rtmp-ws
 * (StartTarget/StopTarget/ToggleTarget/ListTargets/GetTargetState/GetTargetStats, etc).
 * Tira si la respuesta trae `success: false` (target no encontrado, etc) en vez de
 * fallar en silencio - el handler C++ siempre responde con ese campo.
 */
export async function callMultiRtmpVendor<T = Record<string, unknown>>(
	requestType: string,
	requestData: Record<string, unknown> = {}
): Promise<T> {
	const client = await getObs();
	// `requestData` es un objeto JSON plano; el tipo JsonObject de obs-websocket-js
	// (via type-fest) no calza 1:1 con el de @elgato/utils, asi que se salva con un
	// `any` acotado en este unico call site en vez de pelear dos JsonObject de
	// terceros incompatibles entre si.
	const { responseData } = await client.call<"CallVendorRequest">("CallVendorRequest", {
		vendorName: VENDOR_NAME,
		requestType,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		requestData: requestData as any
	});
	const data = responseData as { success?: boolean; error?: string } & Record<string, unknown>;
	if (data.success === false) {
		throw new Error(data.error || `${requestType} fallo sin mensaje de error`);
	}
	return data as T;
}

/**
 * Resuelve el nombre de un target (Youtube/Kick, como se ve en el dock nativo) a su
 * id interno. Necesario porque `FindPushWidgetByIdOrName` en el plugin de OBS tiene
 * un bug: `obs_data_get_string(request_data, "id")` devuelve "" (no null) cuando el
 * campo "id" no viene en el request, y `if (targetId)` en C++ es true para un
 * puntero valido aunque apunte a texto vacio - asi que SIEMPRE toma el camino de
 * busqueda por id (con id="") y nunca llega a comparar por nombre, aunque se mande
 * `name` correctamente. Buscar por `id` en cambio funciona perfecto (probado
 * directo), asi que este helper hace la resolucion nombre->id de este lado.
 */
export async function resolveTargetId(name: string): Promise<string> {
	const { targets } = await callMultiRtmpVendor<{ targets: { id: string; name: string }[] }>("ListTargets");
	const normalized = name.trim().toLowerCase();
	const match = targets.find((t) => t.name.trim().toLowerCase() === normalized);
	if (!match) {
		const available = targets.map((t) => t.name).join(", ") || "ninguno";
		throw new Error(`Target "${name}" no encontrado. Targets disponibles: ${available}`);
	}
	return match.id;
}

/**
 * Llama a un request nativo de obs-websocket (StartStream/StopStream/ToggleStream/
 * GetStreamStatus, etc) - controla el stream principal de OBS, no los targets extra
 * del plugin de multistream.
 */
export async function callObs<T = Record<string, unknown>>(
	requestType: string,
	requestData?: Record<string, unknown>
): Promise<T> {
	const client = await getObs();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const response = await client.call(requestType as never, requestData as any);
	return response as T;
}
