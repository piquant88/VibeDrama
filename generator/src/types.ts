export type Scene = {
  image: string; // path relative to content/ root
  audio?: string; // path relative to content/ root
  caption: string; // on-screen subtitle
  narration: string; // full voiceover text, powers the app's Read mode
  durationSec: number;
};

export type CatalogEpisode = {
  id: string;
  index: number;
  title: string;
  scenes: Scene[];
};

export type CatalogSeries = {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  cover: string; // path relative to content/ root
  freeEpisodeCount: number;
  coinsPerEpisode: number;
  plannedEpisodeTitles: string[]; // full season outline, used to generate future episodes
  episodes: CatalogEpisode[];
};

export type Catalog = {
  version: number;
  updatedAt: string;
  series: CatalogSeries[];
};

export type SeriesConcept = {
  title: string;
  tagline: string;
  genre: string;
  coverPrompt: string;
  episodeTitles: string[];
};

export type EpisodeScript = {
  scenes: {
    narration: string; // spoken voiceover line
    caption: string; // short on-screen text
    imagePrompt: string; // visual description for image generation
  }[];
};
