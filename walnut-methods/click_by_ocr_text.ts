import type { WalnutAndroidContext } from './walnut';
import Tesseract from 'tesseract.js';

/** @walnut_method
 * name: Click By OCR Text
 * description: Capture the Android screen, run OCR, and tap occurrence ${index} of text ${text}
 * actionType: custom_click_by_ocr_text
 * context: android
 * needsLocator: false
 * category: Android OCR
 */
export async function clickByOCRText(ctx: WalnutAndroidContext) {
  const text: string = ctx.args[0];
  const index: number = parseInt(ctx.args[1], 10);

  ctx.log(`Method: clickByOCRText`);
  ctx.log(`Platform: Android`);
  ctx.log(`Text: ${text}`);
  ctx.log(`Requested Index: ${index}`);

  // ── 1. Index validation ──────────────────────────────────────────────────
  if (index <= 0) {
    throw new Error('Index must be greater than or equal to 1.');
  }

  // ── 2. Capture screenshot ────────────────────────────────────────────────
  const screenshotBase64: string = await ctx.callTool('getScreenshot', {});
  if (!screenshotBase64) {
    throw new Error('Failed to capture Android device screenshot.');
  }

  // ── 3. Run OCR via tesseract.js ──────────────────────────────────────────
  const ocrResults = await detectTextFromScreen(screenshotBase64);

  if (ocrResults.length === 0) {
    throw new Error('OCR could not detect any text on the current Android screen.');
  }

  // ── 4. Normalize & match ─────────────────────────────────────────────────
  const normalizedInput = normalizeText(text);

  const matches = ocrResults.filter(
    (r) => normalizeText(r.text) === normalizedInput
  );

  if (matches.length === 0) {
    const detected = ocrResults.map((r) => `"${r.text}"`).join(', ');
    throw new Error(
      `OCR text not found.\n\nText: ${text}\n\nDetected text on screen: [${detected}]`
    );
  }

  // ── 5. Sort top-to-bottom, left-to-right (row tolerance = 20 px) ─────────
  const ROW_TOLERANCE = 20;
  matches.sort((a, b) => {
    const rowDiff = a.y - b.y;
    if (Math.abs(rowDiff) > ROW_TOLERANCE) return rowDiff;
    return a.x - b.x;
  });

  ctx.log(`OCR Matches Found: ${matches.length}`);

  // ── 6. Apply 1-based index ───────────────────────────────────────────────
  if (index > matches.length) {
    throw new Error(
      `OCR text index out of range.\n\nText: ${text}\nRequested Index: ${index}\nAvailable Matches: ${matches.length}`
    );
  }

  const selected = matches[index - 1];

  ctx.log(`Selected Match: ${index}`);
  ctx.log(
    `Bounding Box: x=${selected.x}, y=${selected.y}, width=${selected.width}, height=${selected.height}`
  );

  // ── 7. Calculate tap coordinates ─────────────────────────────────────────
  const centerX = Math.round(selected.x + selected.width / 2);
  const centerY = Math.round(selected.y + selected.height / 2);

  ctx.log(`Tap Coordinates: x=${centerX}, y=${centerY}`);

  // ── 8. Validate against screen dimensions ────────────────────────────────
  const screenSize: { width: number; height: number } = await ctx.callTool(
    'getDeviceScreenSize',
    {}
  );

  if (
    centerX < 0 ||
    centerX > screenSize.width ||
    centerY < 0 ||
    centerY > screenSize.height
  ) {
    throw new Error(
      `Calculated tap coordinates (${centerX}, ${centerY}) are outside the screen bounds ` +
        `(${screenSize.width} x ${screenSize.height}). Refusing unsafe tap.`
    );
  }

  // ── 9. Perform Appium coordinate tap ─────────────────────────────────────
  ctx.log(`Action: Android Coordinate Tap`);
  await ctx.callTool('tapByCoordinates', { x: centerX, y: centerY });

  ctx.log(`Status: SUCCESS`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal OCR model
// ─────────────────────────────────────────────────────────────────────────────

interface OCRTextResult {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// detectTextFromScreen — reusable OCR service
// Returns every word-level result with its bounding box from a base64 PNG/JPEG.
// ─────────────────────────────────────────────────────────────────────────────

async function detectTextFromScreen(
  screenshotBase64: string
): Promise<OCRTextResult[]> {
  // Appium screenshots are already valid PNGs — decode base64 directly to Buffer.
  // No image-conversion library needed.
  const imageBuffer: Buffer = Buffer.from(screenshotBase64, 'base64');

  // Run Tesseract with word-level data.
  // Cast result.data to `any` to access the `words` array — the tesseract.js
  // declarations type it as `Page` which may not expose `words` in all versions.
  const result = await Tesseract.recognize(imageBuffer, 'eng', {
    logger: () => {}, // suppress progress noise
  });

  const data = (result as any).data as any;
  const words: any[] = data.words ?? [];

  const ocrResults: OCRTextResult[] = [];

  for (const word of words) {
    const rawText = String(word.text ?? '').trim();
    if (!rawText) continue;

    const { x0, y0, x1, y1 } = word.bbox as {
      x0: number; y0: number; x1: number; y1: number;
    };
    ocrResults.push({
      text: rawText,
      x: x0,
      y: y0,
      width: x1 - x0,
      height: y1 - y0,
    });
  }

  return ocrResults;
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeText — trim edges and collapse inner whitespace.
// Case is preserved so "Submit" ≠ "submit" and numeric strings work as-is.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeText(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}
