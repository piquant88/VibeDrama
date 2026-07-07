import Anthropic from '@anthropic-ai/sdk';
import type { EpisodeScript, SeriesConcept } from './types.ts';

const MODEL = 'claude-opus-4-8';

const SERIES_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Punchy series title, max 8 words' },
    tagline: { type: 'string', description: 'One-sentence hook, max 20 words' },
    genre: { type: 'string', enum: ['Revenge', 'Romance', 'Fantasy', 'Drama', 'Thriller'] },
    coverPrompt: {
      type: 'string',
      description: 'Image-generation prompt for a dramatic vertical cover poster, no text in image',
    },
    episodeTitles: {
      type: 'array',
      items: { type: 'string' },
      description: 'Exactly 10 episode titles forming a complete season arc with cliffhangers',
    },
  },
  required: ['title', 'tagline', 'genre', 'coverPrompt', 'episodeTitles'],
  additionalProperties: false,
} as const;

const EPISODE_SCHEMA = {
  type: 'object',
  properties: {
    scenes: {
      type: 'array',
      description: '6 to 8 scenes',
      items: {
        type: 'object',
        properties: {
          narration: {
            type: 'string',
            description: 'Voiceover line, 1-3 sentences, present tense, melodramatic',
          },
          caption: { type: 'string', description: 'Short on-screen subtitle, max 12 words' },
          imagePrompt: {
            type: 'string',
            description:
              'Image-generation prompt: cinematic vertical frame, consistent characters, photorealistic drama still, no text',
          },
        },
        required: ['narration', 'caption', 'imagePrompt'],
        additionalProperties: false,
      },
    },
  },
  required: ['scenes'],
  additionalProperties: false,
} as const;

function getClient(): Anthropic | null {
  try {
    return new Anthropic();
  } catch {
    return null;
  }
}

async function structuredRequest<T>(
  prompt: string,
  schema: Record<string, unknown>
): Promise<T | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: { format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return null;
    return JSON.parse(text.text) as T;
  } catch (err) {
    console.warn(`Claude request failed, falling back to templates: ${(err as Error).message}`);
    return null;
  }
}

export async function generateSeriesConcept(existingTitles: string[]): Promise<SeriesConcept> {
  const result = await structuredRequest<SeriesConcept>(
    `You are the head writer for a vertical short-drama app (like ReelShort/DramaBox).
Create a new binge-worthy mini-drama series concept in a popular web-drama genre
(revenge, secret billionaire, contract marriage, werewolf/alpha romance, hidden identity, twin swap...).

It must NOT resemble any of these existing series: ${existingTitles.join('; ') || '(none yet)'}

Give exactly 10 episode titles that form one complete season arc — escalating stakes,
a midpoint betrayal, and a finale payoff. Each episode ends on a cliffhanger.`,
    SERIES_SCHEMA
  );
  if (result && result.episodeTitles.length >= 6) return result;

  // Template fallback so the pipeline works without an API key.
  const n = existingTitles.length + 1;
  return {
    title: `Contract Bride ${n > 1 ? n : ''}`.trim(),
    tagline: 'She signed for money. She stayed for revenge.',
    genre: 'Romance',
    coverPrompt: 'dramatic vertical movie poster, bride in red at night, city skyline, cinematic lighting',
    episodeTitles: [
      'The Signature',
      'Strangers at the Altar',
      'His Cold Rules',
      'The Ex Returns',
      'A Kiss for the Cameras',
      'The Hidden Will',
      'Betrayed at Midnight',
      'Her Real Identity',
      'The Contract Burns',
      'Forever, Unsigned',
    ],
  };
}

export async function generateEpisodeScript(
  seriesTitle: string,
  seriesTagline: string,
  genre: string,
  episodeIndex: number,
  episodeTitle: string,
  previousEpisodeTitles: string[]
): Promise<EpisodeScript> {
  const result = await structuredRequest<EpisodeScript>(
    `You are writing episode ${episodeIndex} ("${episodeTitle}") of the vertical mini-drama
"${seriesTitle}" (${genre}) — ${seriesTagline}

Episodes so far: ${previousEpisodeTitles.join('; ') || '(this is the premiere)'}

Write 6-8 scenes for this ~60-second episode. Melodramatic, fast-paced, ends on a cliffhanger.
Keep character names and appearances consistent across the episode; describe the same
protagonists in every imagePrompt so generated images stay visually consistent.`,
    EPISODE_SCHEMA
  );
  if (result && result.scenes.length >= 3) return result;

  // Template fallback.
  return {
    scenes: [
      {
        narration: `Episode ${episodeIndex} begins where everything changed.`,
        caption: episodeTitle,
        imagePrompt: `cinematic vertical drama still, city at dusk, tense atmosphere, ${genre}`,
      },
      {
        narration: 'She thought the worst was behind her. She was wrong.',
        caption: 'She was wrong.',
        imagePrompt: 'cinematic vertical drama still, woman looking at phone in shock, rain outside window',
      },
      {
        narration: 'Across the city, he made a call that would ruin everything.',
        caption: 'One call changes it all',
        imagePrompt: 'cinematic vertical drama still, man in suit on phone, dark office, moody lighting',
      },
      {
        narration: 'The truth was closer than either of them knew.',
        caption: 'To be continued...',
        imagePrompt: 'cinematic vertical drama still, two silhouettes about to meet in a hallway, dramatic light',
      },
    ],
  };
}
