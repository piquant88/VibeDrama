import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

/**
 * Generate an image for `prompt` and save it under contentDir.
 * Returns the catalog-relative path of the saved file.
 * Uses OpenAI gpt-image-1 when OPENAI_API_KEY is set; otherwise falls back to
 * a deterministic picsum.photos placeholder so the pipeline runs key-free.
 */
export async function generateImage(
  contentDir: string,
  relBase: string, // e.g. "my-series/ep1/scene1" (no extension)
  prompt: string
): Promise<string> {
  if (OPENAI_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          size: '1024x1536',
          quality: 'medium',
        }),
      });
      if (!res.ok) throw new Error(`images API ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { data: { b64_json: string }[] };
      const rel = `${relBase}.png`;
      const out = join(contentDir, rel);
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, Buffer.from(data.data[0].b64_json, 'base64'));
      return rel;
    } catch (err) {
      console.warn(`Image generation failed, using placeholder: ${(err as Error).message}`);
    }
  }

  // Placeholder: deterministic seed from the prompt so reruns are stable.
  const seed = createHash('sha1').update(relBase + prompt).digest('hex').slice(0, 12);
  const res = await fetch(`https://picsum.photos/seed/${seed}/720/1280`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`picsum fetch failed: ${res.status}`);
  const rel = `${relBase}.jpg`;
  const out = join(contentDir, rel);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(await res.arrayBuffer()));
  return rel;
}
