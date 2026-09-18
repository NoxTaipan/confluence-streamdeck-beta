// Genera los PNG que pide el manifest de Stream Deck a partir de SVGs
// inline, usando la paleta de marca de Confluence (confluence/public/style.css).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const BG = "#0c0e13";
const ACCENT = "#6ee7b7";
const TWITCH = "#9146ff";
const YOUTUBE = "#ff3b5c";
const MUTED = "#3a4058";

async function render(svg, size, outPath) {
  await mkdir(dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
}

// Icono principal del plugin (imgs/plugin/icon.png) y de categoria
// (imgs/plugin/category-icon.png) NO se generan aca - son arte real (Nano
// Banana) procesado a mano una sola vez, ver scripts/process-brand-icons.mjs.
// No pisar esos archivos desde este script.

// Glifo de "broadcast" (arcos de senal) para la lista de acciones -
// monocromatico blanco sobre transparente, como pide el schema.
const broadcastGlyph = (size, color = "#ffffff") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="${size}" height="${size}">
  <circle cx="10" cy="14" r="2.1" fill="${color}"/>
  <path d="M5.5 10.5a6.4 6.4 0 0 1 9 0" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M2.5 7.3a10.6 10.6 0 0 1 15 0" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</svg>`;

// Icono de la tecla (72/144): fondo del panel + el mismo glifo, en gris
// (detenido) o verde de acento (corriendo).
const keyIcon = (size, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${BG}"/>
  <g transform="translate(20,18) scale(3)">
    <circle cx="10" cy="14" r="2.1" fill="${color}"/>
    <path d="M5.5 10.5a6.4 6.4 0 0 1 9 0" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M2.5 7.3a10.6 10.6 0 0 1 15 0" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

// Trazos reales de marca (Simple Icons, CC0) - mismos exactos que usa
// confluence/public/platform-icons.js, fuente unica de iconos de plataforma
// en toda la suite. Placa de color + logo, escalado para la tecla fisica.
const PLATFORM_LOGOS = {
  twitch: {
    path: "M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z",
    viewBox: "0 0 24 24"
  },
  youtube: {
    path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
    viewBox: "0 0 24 24"
  },
  kick: {
    path: "M1.333 0h8v5.333H12V2.667h2.667V0h8v8H20v2.667h-2.667v2.666H20V16h2.667v8h-8v-2.667H12v-2.666H9.333V24h-8Z",
    viewBox: "0 0 24 24"
  }
};

const platformBadgeIcon = (size, plate, logoColor, platform) => {
  const logo = PLATFORM_LOGOS[platform];
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${BG}"/>
  <rect x="18" y="18" width="64" height="64" rx="14" fill="${plate}"/>
  <g transform="translate(29,29) scale(${46 / 24})">
    <path fill="${logoColor}" d="${logo.path}"/>
  </g>
</svg>`;
};

const root = "tv.noxtaipan.confluence.sdPlugin";

await render(broadcastGlyph(20), 20, `${root}/imgs/actions/multistream-target/icon.png`);
await render(broadcastGlyph(40), 40, `${root}/imgs/actions/multistream-target/icon@2x.png`);

// Fallback generico (target con nombre que no matchea ninguna plataforma
// conocida) - mismo estilo que antes.
await render(keyIcon(72, MUTED), 72, `${root}/imgs/actions/multistream-target/key-off.png`);
await render(keyIcon(144, MUTED), 144, `${root}/imgs/actions/multistream-target/key-off@2x.png`);
await render(keyIcon(72, ACCENT), 72, `${root}/imgs/actions/multistream-target/key-on.png`);
await render(keyIcon(144, ACCENT), 144, `${root}/imgs/actions/multistream-target/key-on@2x.png`);

// Iconos con el logo real por plataforma (Twitch/YouTube/Kick) - el plugin los
// aplica en tiempo de ejecucion via action.setImage() segun el nombre
// configurado (ver resolvePlatformIcon en multistream-target.ts). Apagado =
// placa gris, prendido = placa del color real de la marca.
const PLATFORM_STYLE = {
  twitch: { plate: TWITCH, logo: "#ffffff" },
  youtube: { plate: YOUTUBE, logo: "#ffffff" },
  kick: { plate: "#53fc18", logo: BG }
};
for (const [platform, style] of Object.entries(PLATFORM_STYLE)) {
  await render(platformBadgeIcon(72, MUTED, "#e6e8ee", platform), 72, `${root}/imgs/actions/multistream-target/key-${platform}-off.png`);
  await render(platformBadgeIcon(144, MUTED, "#e6e8ee", platform), 144, `${root}/imgs/actions/multistream-target/key-${platform}-off@2x.png`);
  await render(platformBadgeIcon(72, style.plate, style.logo, platform), 72, `${root}/imgs/actions/multistream-target/key-${platform}-on.png`);
  await render(platformBadgeIcon(144, style.plate, style.logo, platform), 144, `${root}/imgs/actions/multistream-target/key-${platform}-on@2x.png`);
}

// main-stream: siempre Twitch, mismo tratamiento en la tecla (gris apagado /
// violeta Twitch prendido). El icono de la lista de acciones (20/40) se
// mantiene monocromatico blanco sobre transparente, como exige el schema.
await render(broadcastGlyph(20), 20, `${root}/imgs/actions/main-stream/icon.png`);
await render(broadcastGlyph(40), 40, `${root}/imgs/actions/main-stream/icon@2x.png`);
await render(platformBadgeIcon(72, MUTED, "#e6e8ee", "twitch"), 72, `${root}/imgs/actions/main-stream/key-off.png`);
await render(platformBadgeIcon(144, MUTED, "#e6e8ee", "twitch"), 144, `${root}/imgs/actions/main-stream/key-off@2x.png`);
await render(platformBadgeIcon(72, TWITCH, "#ffffff", "twitch"), 72, `${root}/imgs/actions/main-stream/key-on.png`);
await render(platformBadgeIcon(144, TWITCH, "#ffffff", "twitch"), 144, `${root}/imgs/actions/main-stream/key-on@2x.png`);

// start-all / stop-all / restart-confluence / push-info: idealmente arte real
// (Nano Banana) procesado via scripts/process-brand-icons.mjs - pero ese script
// necesita los JPG de origen en Downloads, que no siempre estan disponibles
// (se borran despues de procesarlos). Estos glifos simples son un respaldo en
// el mismo estilo que el resto: si corres process-brand-icons.mjs despues con
// el arte real, esos archivos pisan a estos sin problema.
const playGlyph = (size, color = "#ffffff") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="${size}" height="${size}">
  <path d="M5.5 3.5v13l11-6.5Z" fill="${color}"/>
</svg>`;
const playIcon = (size, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${BG}"/>
  <path d="M38 26v48l40-24Z" fill="${color}"/>
</svg>`;
await render(playGlyph(20), 20, `${root}/imgs/actions/start-all/icon.png`);
await render(playGlyph(40), 40, `${root}/imgs/actions/start-all/icon@2x.png`);
await render(playIcon(72, ACCENT), 72, `${root}/imgs/actions/start-all/key.png`);
await render(playIcon(144, ACCENT), 144, `${root}/imgs/actions/start-all/key@2x.png`);

const stopGlyph = (size, color = "#ffffff") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="${size}" height="${size}">
  <rect x="4.5" y="4.5" width="11" height="11" rx="1.5" fill="${color}"/>
</svg>`;
const stopIcon = (size, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${BG}"/>
  <rect x="30" y="30" width="40" height="40" rx="6" fill="${color}"/>
</svg>`;
const STOP_RED = "#ff5c5c";
await render(stopGlyph(20), 20, `${root}/imgs/actions/stop-all/icon.png`);
await render(stopGlyph(40), 40, `${root}/imgs/actions/stop-all/icon@2x.png`);
await render(stopIcon(72, STOP_RED), 72, `${root}/imgs/actions/stop-all/key.png`);
await render(stopIcon(144, STOP_RED), 144, `${root}/imgs/actions/stop-all/key@2x.png`);

const refreshGlyph = (size, color = "#ffffff") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="${size}" height="${size}">
  <path d="M15.5 10a5.5 5.5 0 1 1-1.9-4.16" stroke="${color}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  <path d="M14 2.8v3.6h-3.6" stroke="${color}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
const refreshIcon = (size, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${BG}"/>
  <g transform="translate(20,20) scale(3)">
    <path d="M15.5 10a5.5 5.5 0 1 1-1.9-4.16" stroke="${color}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M14 2.8v3.6h-3.6" stroke="${color}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
await render(refreshGlyph(20), 20, `${root}/imgs/actions/restart-confluence/icon.png`);
await render(refreshGlyph(40), 40, `${root}/imgs/actions/restart-confluence/icon@2x.png`);
await render(refreshIcon(72, ACCENT), 72, `${root}/imgs/actions/restart-confluence/key.png`);
await render(refreshIcon(144, ACCENT), 144, `${root}/imgs/actions/restart-confluence/key@2x.png`);

const uploadGlyph = (size, color = "#ffffff") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="${size}" height="${size}">
  <path d="M10 3v9.5M10 3l-3.4 3.4M10 3l3.4 3.4" stroke="${color}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3.5 14.5v1.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-1.5" stroke="${color}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
</svg>`;
const uploadIcon = (size, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${BG}"/>
  <g transform="translate(20,20) scale(3)">
    <path d="M10 3v9.5M10 3l-3.4 3.4M10 3l3.4 3.4" stroke="${color}" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M3.5 14.5v1.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-1.5" stroke="${color}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;
await render(uploadGlyph(20), 20, `${root}/imgs/actions/push-info/icon.png`);
await render(uploadGlyph(40), 40, `${root}/imgs/actions/push-info/icon@2x.png`);
await render(uploadIcon(72, ACCENT), 72, `${root}/imgs/actions/push-info/key.png`);
await render(uploadIcon(144, ACCENT), 144, `${root}/imgs/actions/push-info/key@2x.png`);

// status-dial: glifo simple de "medidor" para el icono de accion y el circulo
// del dial en la app (no tiene arte real todavia).
const gaugeGlyph = (size, color = "#ffffff") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="${size}" height="${size}">
  <path d="M3 14a7 7 0 0 1 14 0" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <path d="M10 14 L13.2 9.5" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  <circle cx="10" cy="14" r="1.3" fill="${color}"/>
</svg>`;
const gaugeIcon = (size, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <circle cx="50" cy="50" r="48" fill="${BG}"/>
  <g transform="translate(20,22) scale(3)">
    <path d="M3 14a7 7 0 0 1 14 0" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M10 14 L13.2 9.5" stroke="${color}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="10" cy="14" r="1.3" fill="${color}"/>
  </g>
</svg>`;
await render(gaugeGlyph(20), 20, `${root}/imgs/actions/status-dial/icon.png`);
await render(gaugeGlyph(40), 40, `${root}/imgs/actions/status-dial/icon@2x.png`);
await render(gaugeIcon(72, ACCENT), 72, `${root}/imgs/actions/status-dial/dial.png`);
await render(gaugeIcon(144, ACCENT), 144, `${root}/imgs/actions/status-dial/dial@2x.png`);

// chat-send: glifo simple de burbuja de chat.
const chatGlyph = (size, color = "#ffffff") => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="${size}" height="${size}">
  <path d="M3 4.5h14v9H8l-3.2 2.6V13.5H3z" stroke="${color}" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
</svg>`;
const chatIcon = (size, color) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <rect width="100" height="100" fill="${BG}"/>
  <g transform="translate(20,22) scale(3)">
    <path d="M3 4.5h14v9H8l-3.2 2.6V13.5H3z" stroke="${color}" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
  </g>
</svg>`;
await render(chatGlyph(20), 20, `${root}/imgs/actions/chat-send/icon.png`);
await render(chatGlyph(40), 40, `${root}/imgs/actions/chat-send/icon@2x.png`);
await render(chatIcon(72, ACCENT), 72, `${root}/imgs/actions/chat-send/key.png`);
await render(chatIcon(144, ACCENT), 144, `${root}/imgs/actions/chat-send/key@2x.png`);

console.log("Iconos generados.");
