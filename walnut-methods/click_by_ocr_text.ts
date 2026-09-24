import type { WalnutAndroidContext } from './walnut';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

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

  // ── 3. Run OCR via system tesseract CLI ──────────────────────────────────
  const ocrResults = await detectTextFromScreen(screenshotBase64, ctx);

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
//
// Shells out to the system `tesseract` CLI with `tsv` output format.
// TSV columns (0-indexed):
//   5 = left, 6 = top, 7 = width, 8 = height, 11 = text
// Uses only Node.js built-ins (fs, os, path, child_process) — no npm packages,
// so esbuild can always bundle this without needing node_modules.
// ─────────────────────────────────────────────────────────────────────────────

async function detectTextFromScreen(
  screenshotBase64: string,
  ctx: WalnutAndroidContext
): Promise<OCRTextResult[]> {
  const tmpDir = os.tmpdir();
  const imgPath = path.join(tmpDir, `walnut_ocr_${Date.now()}.png`);
  // tesseract appends the extension itself, so we give it a stem
  const tsvStem = path.join(tmpDir, `walnut_ocr_${Date.now()}_out`);
  const tsvPath = tsvStem + '.tsv';

  try {
    // Write screenshot PNG to a temp file
    fs.writeFileSync(imgPath, Buffer.from(screenshotBase64, 'base64'));

    // Run: tesseract <imgPath> <tsvStem> tsv
    try {
      await execFileAsync('tesseract', [imgPath, tsvStem, 'tsv']);
    } catch (err: any) {
      throw new Error(
        `Tesseract CLI failed. Make sure tesseract is installed and on PATH.\n` +
          (err?.message ?? String(err))
      );
    }

    // Read the TSV output
    if (!fs.existsSync(tsvPath)) {
      throw new Error(`Tesseract did not produce output file: ${tsvPath}`);
    }

    const tsv = fs.readFileSync(tsvPath, 'utf8');
    ctx.log(`Tesseract TSV output received (${tsv.split('\n').length} lines)`);

    return parseTsv(tsv);
  } finally {
    // Clean up temp files
    for (const f of [imgPath, tsvPath]) {
      try { fs.unlinkSync(f); } catch { /* ignore */ }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// parseTsv — extract word-level bounding boxes from tesseract TSV output
//
// TSV header:
//   level page_num block_num par_num line_num word_num left top width height conf text
//   0     1        2         3       4        5        6    7   8     9      10   11
// level=5 rows are individual words.
// ─────────────────────────────────────────────────────────────────────────────

function parseTsv(tsv: string): OCRTextResult[] {
  const results: OCRTextResult[] = [];
  const lines = tsv.split('\n');

  // Skip the header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split('\t');
    if (cols.length < 12) continue;

    const level = parseInt(cols[0], 10);
    if (level !== 5) continue; // level 5 = word

    const left   = parseInt(cols[6],  10);
    const top    = parseInt(cols[7],  10);
    const width  = parseInt(cols[8],  10);
    const height = parseInt(cols[9],  10);
    const conf   = parseFloat(cols[10]);
    const word   = cols[11].trim();

    // Skip empty words or words with zero confidence
    if (!word || conf < 0) continue;

    results.push({ text: word, x: left, y: top, width, height });
  }

  return results;
}

// ─────────────────────────────────────────────────────────────────────────────
// normalizeText — trim edges and collapse inner whitespace.
// Case is preserved so "Submit" ≠ "submit" and numeric strings work as-is.
// ─────────────────────────────────────────────────────────────────────────────

function normalizeText(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}
