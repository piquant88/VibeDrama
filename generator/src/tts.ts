import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

/** Rough spoken duration estimate: ~2.5 words per second, min 4s. */
export function estimateDurationSec(narration: string): number {
  const words = narration.trim().split(/\s+/).length;
  return Math.max(4, Math.round(words / 2.5) + 1);
}

/**
 * Generate a voiceover mp3 for `narration`. Returns the catalog-relative path,
 * or null when TTS is unavailable (no OPENAI_API_KEY) — the app then shows the
 * scene silently for its estimated duration.
 */
export async function generateVoiceover(
  contentDir: string,
  relBase: string, // e.g. "my-series/ep1/scene1" (no extension)
  narration: string
): Promise<string | null> {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-tts',
        voice: 'nova',
        input: narration,
        response_format: 'mp3',
      }),
    });
    if (!res.ok) throw new Error(`audio API ${res.status}: ${await res.text()}`);
    const rel = `${relBase}.mp3`;
    const out = join(contentDir, rel);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, Buffer.from(await res.arrayBuffer()));
    return rel;
  } catch (err) {
    console.warn(`TTS failed, episode will be silent: ${(err as Error).message}`);
    return null;
  }
}
