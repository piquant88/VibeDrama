export type Scene = {
  image: string; // absolute URL
  audio?: string; // absolute URL, optional voiceover
  caption: string;
  narration?: string; // full voiceover text, used by Read mode
  durationSec: number;
};

export type Episode = {
  id: string;
  index: number; // 1-based episode number within series
  title: string;
  videoUrl?: string; // classic video episode
  scenes?: Scene[]; // AI-generated motion-comic episode
  durationSec: number;
};

export type Series = {
  id: string;
  title: string;
  tagline: string;
  cover: string;
  genre: string;
  episodes: Episode[];
  freeEpisodeCount: number; // episodes 1..N are free
  coinsPerEpisode: number; // cost to unlock each locked episode
};

// Public domain / freely-licensed sample mp4s used as drama-episode placeholders.
const SAMPLE_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
];

function makeEpisodes(seriesId: string, titles: string[]): Episode[] {
  return titles.map((title, i) => ({
    id: `${seriesId}-ep${i + 1}`,
    index: i + 1,
    title,
    videoUrl: SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length],
    durationSec: 60 + (i % 5) * 15,
  }));
}

export const SERIES: Series[] = [
  {
    id: 'ceo-revenge',
    title: "The CEO's Revenge",
    tagline: 'She was fired in disgrace. She came back to own the company.',
    cover: 'https://picsum.photos/seed/ceo-revenge/400/600',
    genre: 'Revenge',
    freeEpisodeCount: 3,
    coinsPerEpisode: 25,
    episodes: makeEpisodes('ceo-revenge', [
      'Fired Without Warning',
      'A Mysterious Inheritance',
      'Back in the Boardroom',
      'Old Enemies Return',
      'The Secret Shareholder',
      'Betrayal at Midnight',
      'The Truth About Father',
      'Takeover',
      'Love or Leverage',
      'Checkmate',
    ]),
  },
  {
    id: 'secret-billionaire-husband',
    title: 'My Secret Billionaire Husband',
    tagline: 'A marriage of convenience hides a fortune neither expected.',
    cover: 'https://picsum.photos/seed/billionaire-husband/400/600',
    genre: 'Romance',
    freeEpisodeCount: 3,
    coinsPerEpisode: 20,
    episodes: makeEpisodes('secret-billionaire-husband', [
      'The Contract Marriage',
      'Strangers Under One Roof',
      'A Name He Never Used',
      'Paparazzi at the Gate',
      'His Family Finds Out',
      'The First Kiss',
      'Rumors and Lies',
      'Her Past Catches Up',
      'A Choice to Stay',
      'Forever, For Real',
    ]),
  },
  {
    id: 'alpha-rejected-mate',
    title: 'Rejected by the Alpha, Chosen by Fate',
    tagline: "He cast her aside. The moon goddess had other plans.",
    cover: 'https://picsum.photos/seed/alpha-rejected/400/600',
    genre: 'Fantasy',
    freeEpisodeCount: 4,
    coinsPerEpisode: 20,
    episodes: makeEpisodes('alpha-rejected-mate', [
      'The Rejection',
      'A Wolf Without a Pack',
      'The Stranger in the Woods',
      'A Power She Never Knew',
      'The Alpha Regrets',
      'War Between Packs',
      'Her True Form',
      'The Second Bond',
      'A Throne of Her Own',
      'Fate Decides',
    ]),
  },
  {
    id: 'twin-swap',
    title: 'Twin Swap Wedding',
    tagline: 'She took her sister\'s place at the altar. Now she can\'t leave.',
    cover: 'https://picsum.photos/seed/twin-swap/400/600',
    genre: 'Drama',
    freeEpisodeCount: 3,
    coinsPerEpisode: 25,
    episodes: makeEpisodes('twin-swap', [
      'The Bride Who Ran',
      'Wearing Her Sister\'s Veil',
      'A Groom Who Suspects',
      'The Wedding Night Lie',
      'Sister vs Sister',
      'A Mother\'s Secret',
      'The DNA Test',
      'Falling for the Wrong Twin',
      'Exposed at the Gala',
      'Whoever I Choose',
    ]),
  },
  {
    id: 'return-of-the-heiress',
    title: 'Return of the Disowned Heiress',
    tagline: 'They threw her out at sixteen. She came home a legend.',
    cover: 'https://picsum.photos/seed/heiress-return/400/600',
    genre: 'Revenge',
    freeEpisodeCount: 4,
    coinsPerEpisode: 25,
    episodes: makeEpisodes('return-of-the-heiress', [
      'Thrown Out in the Rain',
      'Ten Years Later',
      'An Unrecognizable Face',
      'The Family Dinner',
      'A Company of Her Own',
      'They Want Her Back Now',
      'The Adopted Daughter\'s Lie',
      'A Father\'s Apology, Too Late',
      'The Real Will',
      'Standing Above Them All',
    ]),
  },
];

export function findSeries(id: string): Series | undefined {
  return SERIES.find((s) => s.id === id);
}

export function findEpisode(seriesId: string, episodeId: string): Episode | undefined {
  return findSeries(seriesId)?.episodes.find((e) => e.id === episodeId);
}
