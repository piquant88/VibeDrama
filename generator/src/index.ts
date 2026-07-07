import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateImage } from './images.ts';
import { generateEpisodeScript, generateSeriesConcept } from './script.ts';
import { estimateDurationSec, generateVoiceover } from './tts.ts';
import type { Catalog, CatalogEpisode, CatalogSeries, Scene } from './types.ts';

const CONTENT_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', 'content');
const CATALOG_PATH = join(CONTENT_DIR, 'catalog.json');
const EPISODES_PER_SEASON = 10;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

async function loadCatalog(): Promise<Catalog> {
  try {
    return JSON.parse(await readFile(CATALOG_PATH, 'utf8')) as Catalog;
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), series: [] };
  }
}

async function saveCatalog(catalog: Catalog): Promise<void> {
  catalog.updatedAt = new Date().toISOString();
  await mkdir(CONTENT_DIR, { recursive: true });
  await writeFile(CATALOG_PATH, JSON.stringify(catalog, null, 2));
}

async function createSeries(catalog: Catalog): Promise<CatalogSeries> {
  const concept = await generateSeriesConcept(catalog.series.map((s) => s.title));
  let id = slugify(concept.title);
  if (catalog.series.some((s) => s.id === id)) id = `${id}-${catalog.series.length + 1}`;

  console.log(`Creating new series: "${concept.title}" (${concept.genre})`);
  const cover = await generateImage(CONTENT_DIR, `${id}/cover`, concept.coverPrompt);

  const series: CatalogSeries = {
    id,
    title: concept.title,
    tagline: concept.tagline,
    genre: concept.genre,
    cover,
    freeEpisodeCount: 3,
    coinsPerEpisode: 25,
    plannedEpisodeTitles: concept.episodeTitles.slice(0, EPISODES_PER_SEASON),
    episodes: [],
  };
  catalog.series.push(series);
  return series;
}

async function generateNextEpisode(series: CatalogSeries): Promise<CatalogEpisode> {
  const index = series.episodes.length + 1;
  const title = series.plannedEpisodeTitles[index - 1] ?? `Episode ${index}`;
  console.log(`Generating "${series.title}" EP ${index}: ${title}`);

  const script = await generateEpisodeScript(
    series.title,
    series.tagline,
    series.genre,
    index,
    title,
    series.episodes.map((e) => e.title)
  );

  const scenes: Scene[] = [];
  for (let i = 0; i < script.scenes.length; i++) {
    const s = script.scenes[i];
    const relBase = `${series.id}/ep${index}/scene${i + 1}`;
    console.log(`  scene ${i + 1}/${script.scenes.length}: ${s.caption}`);
    const image = await generateImage(CONTENT_DIR, relBase, s.imagePrompt);
    const audio = await generateVoiceover(CONTENT_DIR, relBase, s.narration);
    scenes.push({
      image,
      ...(audio ? { audio } : {}),
      caption: s.caption,
      durationSec: estimateDurationSec(s.narration),
    });
  }

  const episode: CatalogEpisode = { id: `${series.id}-ep${index}`, index, title, scenes };
  series.episodes.push(episode);
  return episode;
}

async function main() {
  const epArg = process.argv.indexOf('--episodes');
  const count = epArg >= 0 ? Math.max(1, parseInt(process.argv[epArg + 1], 10) || 1) : 1;

  const catalog = await loadCatalog();
  console.log(
    `Catalog: ${catalog.series.length} series, ` +
      `${catalog.series.reduce((n, s) => n + s.episodes.length, 0)} episodes. Generating ${count} new episode(s)...`
  );
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('Note: no ANTHROPIC_API_KEY/profile detected — template scripts will be used if the API is unreachable.');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.log('Note: no OPENAI_API_KEY — placeholder images, no voiceover.');
  }

  for (let i = 0; i < count; i++) {
    let series = catalog.series.find((s) => s.episodes.length < EPISODES_PER_SEASON);
    if (!series) series = await createSeries(catalog);
    await generateNextEpisode(series);
    await saveCatalog(catalog); // save incrementally so partial runs still publish
  }

  console.log(`Done. Catalog now has ${catalog.series.length} series.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
