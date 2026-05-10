// Mushroom batches — chosen by Johnny when he mails a batch.
// chain identifier becomes "morel #7", "chanterelle #3", etc.
export const MUSHROOM_BATCHES = [
  'chanterelle', 'morel', 'oyster', 'lion\u2019s mane',
  'chicken-of-the-woods', 'hen-of-the-woods', 'porcini',
  'shaggy mane', 'fairy ring', 'inkcap', 'puffball',
  'earthstar', 'dryad\u2019s saddle', 'bluefoot', 'wood blewit',
  'velvet shank', 'candy cap', 'milkcap', 'deer mushroom',
  'parasol', 'orange peel', 'beefsteak', 'lobster', 'trumpet',
  'brittlegill', 'indigo', 'violet cort', 'golden waxcap',
  'snow fungus', 'turkey tail', 'artist\u2019s conk', 'reishi',
  'enoki', 'shiitake', 'nameko', 'maitake',
] as const;

// Secret code wordlists — combined as `quality-thing-NN`
// e.g. "gentle-river-47", "mossy-letter-12"
export const CODE_QUALITIES = [
  'gentle', 'quiet', 'slow', 'soft', 'warm', 'kind', 'still', 'calm',
  'brave', 'bright', 'hushed', 'golden', 'tender', 'patient', 'easy',
  'faithful', 'simple', 'humble', 'open', 'near', 'far', 'free',
  'hidden', 'distant', 'deep', 'wide', 'small', 'drifting', 'wandering',
  'wakeful', 'sleepy', 'sunlit', 'moonlit', 'dusty', 'mossy', 'foggy',
  'misty', 'dewy', 'cloudy', 'steady', 'woven', 'mended', 'folded',
  'crumpled', 'dappled', 'weathered', 'evening', 'morning', 'autumn',
  'winter', 'summer', 'spring', 'salt', 'smoke', 'hopeful',
] as const;

export const CODE_THINGS = [
  'river', 'ember', 'lantern', 'harbor', 'garden', 'orchard', 'meadow',
  'hollow', 'cottage', 'kitchen', 'hearth', 'window', 'doorway',
  'threshold', 'letter', 'postcard', 'envelope', 'ribbon', 'thread',
  'cloth', 'blanket', 'quilt', 'candle', 'kettle', 'teacup', 'journal',
  'page', 'chapter', 'library', 'bookshelf', 'paperback', 'fountain',
  'well', 'brook', 'creek', 'footpath', 'lane', 'hillside', 'valley',
  'clearing', 'grove', 'willow', 'cedar', 'alder', 'birch', 'sparrow',
  'finch', 'swallow', 'robin', 'crow', 'lark', 'owl', 'fox', 'hare',
  'deer', 'bee', 'moth', 'firefly', 'dragonfly', 'snail', 'lichen',
  'fern', 'moss', 'pinecone', 'acorn', 'seed', 'pebble', 'shell',
  'feather', 'stone', 'driftwood', 'kindling', 'gatepost', 'chimney',
  'mailbox', 'lullaby',
] as const;

/** Generate a random secret code like "gentle-river-47" */
export function generateSecretCode(): string {
  const q = CODE_QUALITIES[Math.floor(Math.random() * CODE_QUALITIES.length)];
  const t = CODE_THINGS[Math.floor(Math.random() * CODE_THINGS.length)];
  const n = String(10 + Math.floor(Math.random() * 90)); // 10-99
  return `${q}-${t}-${n}`;
}

/** Normalize user input: lowercase, trim, collapse whitespace to single hyphens */
export function normalizeCode(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-');
}
