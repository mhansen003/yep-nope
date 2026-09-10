// Generates the 40-image reaction set via nano-banana (gemini-2.5-flash-image) on OpenRouter.
// Pass 1 makes a single base character; every later call feeds that base back in as a vision
// reference so the same character survives all 40 poses.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const KEY = readFileSync(process.env.OR_KEY_PATH, "utf8").trim();
const OUT = join(process.cwd(), "public", "e40");
const BASE = join(process.cwd(), "scripts", "base.png");
mkdirSync(OUT, { recursive: true });

const STYLE = [
  "Bold graphic-novel caricature illustration, thick confident black ink outlines,",
  "flat cel-shaded color blocking with a few hard highlight shapes, slight halftone grain.",
  "Sticker-art / vinyl-toy energy. NOT photorealistic, NOT a photograph, NOT 3D render.",
  "Square composition, chest-up framing, character fills the frame, bold flat single-color background.",
  "No text, no letters, no words, no logos, no watermarks anywhere in the image.",
].join(" ");

const CHARACTER = [
  "A fictional original character: a charismatic Bay Area rap veteran in his fifties.",
  "Round friendly face, warm brown skin, full salt-and-pepper black beard and mustache,",
  "close-cropped hair under a flat-brim snapback, dark wraparound sunglasses,",
  "heavy gold rope chain, oversized graphic tee, big expressive hands.",
  "Exaggerated cartoon proportions, larger-than-life confident presence.",
].join(" ");

const YUP = [
  "grinning wide with both thumbs up, head tilted back, pure approval",
  "pointing straight at the viewer with one finger, eyebrows up, co-signing hard",
  "fanning out a thick stack of blank cash notes, smug delighted smirk",
  "both arms thrown up in celebration, mouth open mid-shout, hyped",
  "leaning way back in a chair with hands laced behind head, satisfied boss posture",
  "giving a slow single nod, one eyebrow raised over the shades, quiet respect",
  "clenched fist raised high in solidarity, chin lifted, proud",
  "flashing a huge open-mouthed laugh, one hand slapping his own knee",
  "making an OK / perfect pinch gesture near his chin, connoisseur approval",
  "arms crossed but smiling warmly, radiating that's-right confidence",
  "reaching out for a handshake toward the viewer, welcoming grin",
  "tapping his temple with one finger, smart-move smirk",
  "blowing a kiss off his fingertips like a chef, delighted",
  "double-finger-guns pointed at the viewer, playful wink over the shades",
  "holding an invisible crown above his own head, regal and pleased",
  "one hand flat over his heart, sincere approving nod",
  "shoulder-shrug of delight with palms up, eyebrows high, pleasantly surprised",
  "leaning in close to the camera with a conspiratorial you-already-know grin",
  "dusting his shoulder off with a satisfied side smile",
  "both hands raised in a wide victorious V, beaming",
];

const NOPE = [
  "arms crossed into a hard X in front of his chest, firm refusal",
  "one palm held flat up toward the viewer in a full stop gesture, unimpressed",
  "shaking his head slowly, lips pressed flat, deep disapproval",
  "wagging a single index finger side to side, scolding",
  "leaning back away from the viewer with a disgusted grimace, recoiling",
  "hand covering his whole face in a heavy facepalm",
  "peering over the top of his shades with a withering side-eye",
  "turning his shoulder and waving the viewer off dismissively",
  "pinching the bridge of his nose, exhausted and over it",
  "both palms up and shoulders shrugged in a flat absolutely-not shrug",
  "one eyebrow crushed down in a deep skeptical scowl",
  "pointing firmly off to the side, telling the viewer to leave",
  "blowing a raspberry with cheeks puffed, mocking dismissal",
  "hands clapped over his own ears, refusing to hear it",
  "flat unimpressed deadpan stare directly at the viewer, totally still",
  "wiping his hands clean of it, done-with-this expression",
  "head thrown back with a sarcastic disbelieving laugh",
  "arms folded, looking away and up at the ceiling, ignoring the viewer",
  "one hand up beside his mouth to whisper no, mock-secretive",
  "recoiling with both hands shielding himself, playfully horrified",
];

async function nano(prompt, refB64) {
  const content = [{ type: "text", text: prompt }];
  if (refB64) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/png;base64,${refB64}` },
    });
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      if (attempt === 4) throw new Error(`${res.status} ${body.slice(0, 300)}`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
      continue;
    }
    const json = await res.json();
    const url = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url) {
      if (attempt === 4) throw new Error("no image in response");
      await new Promise((r) => setTimeout(r, 3000 * attempt));
      continue;
    }
    return Buffer.from(url.split(",")[1], "base64");
  }
}

async function makeBase() {
  if (existsSync(BASE)) return readFileSync(BASE).toString("base64");
  const png = await nano(
    `${CHARACTER} He faces the camera dead-on with a neutral confident closed-mouth expression, hands at his sides. This is a reference character sheet. ${STYLE} Background: flat deep teal.`
  );
  writeFileSync(BASE, png);
  console.log("base character written");
  return png.toString("base64");
}

async function one(verdict, idx, desc, ref) {
  const file = join(OUT, `${verdict}-${String(idx + 1).padStart(2, "0")}.webp`);
  if (existsSync(file)) return "skip";
  const bg =
    verdict === "yup"
      ? "flat vivid apple-green background"
      : "flat vivid crimson-red background";
  const png = await nano(
    `Redraw THIS EXACT SAME CHARACTER from the reference image, keeping his face, beard, sunglasses, snapback and chain identical. New pose: he is ${desc}. ${STYLE} Background: ${bg}.`,
    ref
  );
  await sharp(png)
    .resize(768, 768, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(file);
  return "ok";
}

const ref = await makeBase();
const jobs = [
  ...YUP.map((d, i) => ["yup", i, d]),
  ...NOPE.map((d, i) => ["nope", i, d]),
];

let done = 0;
const LANES = 5;
await Promise.all(
  Array.from({ length: LANES }, async (_, lane) => {
    for (let i = lane; i < jobs.length; i += LANES) {
      const [v, idx, desc] = jobs[i];
      try {
        const r = await one(v, idx, desc, ref);
        console.log(`[${++done}/${jobs.length}] ${v}-${idx + 1} ${r}`);
      } catch (e) {
        console.log(`[${++done}/${jobs.length}] ${v}-${idx + 1} FAIL ${e.message}`);
      }
    }
  })
);
console.log("image generation complete");
