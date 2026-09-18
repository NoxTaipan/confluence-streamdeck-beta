// Procesa las imagenes generadas con Nano Banana a los slots del manifest que
// las necesitan. Se corrio a mano en pasos separados segun se fueron generando
// las imagenes - no forma parte del flujo normal de build (ver gen-icons.mjs,
// que deliberadamente no toca ninguno de los archivos que este script escribe).
import sharp from "sharp";
import { access } from "node:fs/promises";

const root = "tv.noxtaipan.confluence.sdPlugin";
const downloads = "C:/Users/noxta/Downloads";

// Los JPG de origen se generan de a uno y se borran de Downloads despues de
// procesarlos - no siempre estan todos presentes a la vez. Saltar en vez de
// cortar el script entero si falta alguno.
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Nano Banana a veces exporta con margen blanco alrededor de la placa oscura
// (en vez de fondo oscuro edge-to-edge). Reemplaza cualquier pixel casi-blanco
// por el mismo #0c0e13 que usan los demas iconos de la suite, para que no
// quede un borde blanco al redimensionar. No-op si la imagen ya viene con
// fondo oscuro (no hay pixeles casi-blancos que tocar).
const BG_RGB = [0x0c, 0x0e, 0x13];
async function dewhiten(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i] > 235 && out[i + 1] > 235 && out[i + 2] > 235) {
      out[i] = BG_RGB[0];
      out[i + 1] = BG_RGB[1];
      out[i + 2] = BG_RGB[2];
    }
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

// Extrae blanco-sobre-transparente por luminancia (fondo oscuro solido de las
// imagenes generadas -> alpha), para slots que el schema exige monocromaticos.
async function extractWhiteGlyph(srcPath, size) {
  const { data, info } = await sharp(srcPath).resize(200, 200).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const luminance = (data[i] + data[i + 1] + data[i + 2]) / 3;
    const alpha = Math.max(0, Math.min(255, (luminance - 40) * 3));
    out[i] = 255;
    out[i + 1] = 255;
    out[i + 2] = 255;
    out[i + 3] = alpha;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).resize(size, size).png().toBuffer();
}

// 1) Marca de Confluence Suite -> icono principal del plugin (full color, el
// schema lo permite para "Icon", a diferencia de "CategoryIcon").
if (await exists(`${downloads}/confluence-suite.jpg`)) {
  await sharp(`${downloads}/confluence-suite.jpg`).resize(256, 256).png().toFile(`${root}/imgs/plugin/icon.png`);
  await sharp(`${downloads}/confluence-suite.jpg`).resize(512, 512).png().toFile(`${root}/imgs/plugin/icon@2x.png`);
  console.log("- icono principal actualizado.");
} else {
  console.log("- confluence-suite.jpg no esta en Downloads, se deja el icono principal como esta.");
}

// 2) Glifo de broadcast -> icono de categoria (el schema exige
// monocromatico + transparente para "CategoryIcon").
if (await exists(`${downloads}/icono-stream-deck.jpg`)) {
  await sharp(await extractWhiteGlyph(`${downloads}/icono-stream-deck.jpg`, 28)).toFile(`${root}/imgs/plugin/category-icon.png`);
  await sharp(await extractWhiteGlyph(`${downloads}/icono-stream-deck.jpg`, 56)).toFile(`${root}/imgs/plugin/category-icon@2x.png`);
  console.log("- icono de categoria actualizado.");
} else {
  console.log("- icono-stream-deck.jpg no esta en Downloads, se deja el icono de categoria como esta.");
}

// 3) Iconos de accion (Start All / Stop All / Reiniciar Confluence / Push
// Info): key.png a full color, icon.png monocromatico para la lista.
const actionIcons = [
  { file: "start-all.jpg", dir: "start-all" },
  { file: "stop-all.jpg", dir: "stop-all" },
  { file: "reiniciar-confluence.jpg", dir: "restart-confluence" },
  { file: "push-stream-info.jpg", dir: "push-info" }
];
for (const { file, dir } of actionIcons) {
  const src = `${downloads}/${file}`;
  if (!(await exists(src))) {
    console.log(`- ${file} no esta en Downloads, se deja ${dir} como esta.`);
    continue;
  }
  const outDir = `${root}/imgs/actions/${dir}`;
  const clean = await dewhiten(src);
  await sharp(clean).resize(72, 72).png().toFile(`${outDir}/key.png`);
  await sharp(clean).resize(144, 144).png().toFile(`${outDir}/key@2x.png`);
  await sharp(await extractWhiteGlyph(clean, 20)).toFile(`${outDir}/icon.png`);
  await sharp(await extractWhiteGlyph(clean, 40)).toFile(`${outDir}/icon@2x.png`);
  console.log(`- ${dir} actualizado.`);
}

console.log("Iconos de marca procesados.");
