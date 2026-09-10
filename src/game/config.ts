/**
 * GAME CONFIGURATION & TUNING — "Save the Market"
 * All balance variables, lexicons, crisis tuning and colors live here.
 */

export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

export const GAME_CONFIG = {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    // Pillar of Time
    initialTime: 200.0,        // seconds the run starts with
    victoryMilestone: 300.0,   // reach this to solidify the market
    timeDrainPerSecond: 1.0,   // real-time depletion
    // Vitality
    maxHealth: 100,
    // Crises
    crisesToVictory: 8,        // resolve 8 major crises to win as well
    crisisHesitationWindow: 18, // seconds before an unanswered crisis bites
    hesitationDamage: 6,
    // Judgment ranges (plan §3)
    strong: { hpMin: 10, hpMax: 20, timeMin: 8, timeMax: 20 },
    weak: { hpMin: 5, hpMax: 15, timeMin: 0, timeMax: 0 },
    harmful: { hpMin: 15, hpMax: 25, timeMin: 10, timeMax: 25 },
};

export const COLORS = {
    BACKGROUND: 0x0a0612,
    TEXT: '#f4ecdc',
    PILLAR: 0x63e6ff,
    PILLAR_GLOW: 0x9df3ff,
    EMBER: 0xffb454,
    MIST: 0x8f7fb8,
    GROUND: 0x2a1f3d,
    GROUND_TOP: 0x4a3768,
    VOID: 0x120a1e,
    DANGER: 0xff4d6d,
    VITAL: 0x57e389,
} as const;

// ---------------------------------------------------------------------------
// NATURAL LANGUAGE LEXICONS (plan §3)
// ---------------------------------------------------------------------------
export const STRONG_VERBS = [
    'anchor', 'secure', 'rekindle', 'relight', 'light', 'ignite', 'kindle',
    'recite', 'chant', 'sing', 'unite', 'rally', 'gather', 'brace', 'reinforce',
    'stabilize', 'steady', 'restore', 'rebuild', 'repair', 'mend', 'tie', 'bind',
    'throw', 'scatter', 'sprinkle', 'burn incense', 'ignite incense', 'shout names',
    'call out', 'name', 'remember', 'memorize', 'organize', 'direct', 'lead',
    'protect', 'shield', 'hold', 'support', 'lift', 'carry', 'rescue', 'save',
    'calm', 'soothe', 'comfort', 'reassure', 'bargain', 'barter', 'trade',
    'sell', 'price', 'count', 'stack', 'arrange', 'prop up', 'nail', 'hammer',
    'stitch', 'sew', 'weave', 'brew', 'cook', 'bake', 'grind', 'pour',
    'splash', 'spray', 'douse', 'extinguish', 'smother', 'douse the flames',
    'evacuate', 'guide', 'escort', 'form a chain', 'human chain', 'bucket brigade',
    'ring the bell', 'bang the drum', 'play music', 'clap', 'stomp',
    'plant', 'water', 'feed', 'share', 'give bread', 'distribute',
    'write', 'record', 'document', 'photograph', 'sketch', 'map',
    'smell', 'taste the spice', 'crush spices', 'grind spices', 'burn spices',
    'wave the flag', 'raise the banner', 'hang lanterns', 'string lights',
] as const;

export const WEAK_PHRASES = [
    'look around', 'wait', 'watch', 'observe', 'think', 'wonder', 'hesitate',
    'ask', 'question', 'maybe', 'perhaps', 'not sure', 'i dont know',
    "i don't know", 'hide', 'duck', 'crouch', 'step back', 'back away',
    'run away slowly', 'walk away', 'leave slowly', 'stand still', 'freeze',
    'do nothing', 'nothing', 'see what happens', 'pray', 'hope', 'wish',
    'panic quietly', 'mumble', 'whisper', 'shrug', 'stall', 'delay',
    'consider', 'ponder', 'contemplate', 'look', 'stare', 'glance', 'peek',
] as const;

export const HARMFUL_PHRASES = [
    'smash', 'break everything', 'destroy', 'burn the stalls', 'burn it',
    'burn down', 'set fire', 'arson', 'steal', 'loot', 'plunder', 'rob',
    'give up', 'surrender', 'close my eyes', 'close eyes', 'give in',
    'scream in despair', 'scream', 'shriek', 'wail', 'run away screaming',
    'flee', 'abandon', 'ignore', 'spit', 'curse the market', 'kick',
    'punch', 'attack', 'hurt', 'kill', 'push people', 'trample', 'stampede',
    'tear down', 'demolish', 'shatter', 'void take', 'join the void',
    'embrace the void', 'welcome the void', 'laugh maniacally', 'eat the ash',
    'drink the fog', 'cut the rope', 'break the pillar', 'extinguish the lanterns',
] as const;

// Words that signal decisiveness / specificity (boost STRONG confidence)
export const DECISIVE_MARKERS = [
    'immediately', 'now', 'quickly', 'firmly', 'together', 'all of them',
    'every', 'with both hands', 'loudly', 'carefully', 'gently', 'strong',
    'i will', 'i grab', 'i take', 'i pull', 'i push', 'i lift', 'i tie',
    'i shout', 'i sing', 'i light', 'i throw', 'i hand', 'i help',
] as const;

// ---------------------------------------------------------------------------
// MARKET SUGGESTIONS & THEMES (plan §2 MENU)
// ---------------------------------------------------------------------------
export const MARKET_SUGGESTIONS = [
    'Grand Bazaar of Istanbul',
    'Pike Place Market',
    'Tsukiji Outer Market',
    'Marrakesh Souks',
    'Mercado Central de Santiago',
    'Camden Market',
] as const;

export interface MarketTheme {
    key: string;
    label: string;
    sensory: string[];      // ambient sensory fragments
    goods: string[];        // trade goods nouns
    matches: string[];      // substrings that detect this theme from the name
}

export const MARKET_THEMES: MarketTheme[] = [
    {
        key: 'spice', label: 'Spice & Silk Bazaar',
        sensory: ['cumin and saffron dust', 'oiled brass lamps', 'haggled syllables', 'rosewater steam'],
        goods: ['saffron bundles', 'silk bolts', 'brass scales', 'copper lanterns', 'dried chilies'],
        matches: ['bazaar', 'souk', 'istanbul', 'marrakesh', 'spice', 'grand', 'mercado', 'medina', 'khan'],
    },
    {
        key: 'fish', label: 'Harbor Fish Market',
        sensory: ['brine and crushed ice', 'gull cries', 'wet rope', 'slapped fish on steel'],
        goods: ['tuna loins', 'crates of urchin', 'salt cod', 'kelp bundles', 'ice shovels'],
        matches: ['fish', 'tsukiji', 'harbor', 'harbour', 'port', 'seafood', 'wharf', 'pier'],
    },
    {
        key: 'produce', label: 'Produce & Flower Market',
        sensory: ['rain on awnings', 'thrown bouquets', 'coffee steam', 'chalk prices'],
        goods: ['crates of apples', 'flower bouquets', 'cheddar wheels', 'hot bread', 'tulip bulbs'],
        matches: ['pike', 'place', 'farmers', "farmer's", 'produce', 'flower', 'market square'],
    },
    {
        key: 'street', label: 'Street & Craft Market',
        sensory: ['busker chords', 'fried dough', 'spray paint', 'bootlace crowds'],
        goods: ['vinyl records', 'leather jackets', 'handmade candles', 'silver rings', 'street food trays'],
        matches: ['camden', 'street', 'night', 'craft', 'flea', 'bazaar market', 'alley'],
    },
];

export const DEFAULT_THEME = MARKET_THEMES[0];

// ---------------------------------------------------------------------------
// CRISIS ARCHETYPES (plan §2 PLAYING)
// ---------------------------------------------------------------------------
export interface CrisisArchetype {
    key: string;
    title: string;
    description: string;   // uses {market}, {goods}, {sensory}
    sensoryNote: string;
    urgency: number;       // 1..3
    anchorWords: string[]; // topical words that make an action contextually strong
}

export const CRISIS_ARCHETYPES: CrisisArchetype[] = [
    {
        key: 'structural-collapse',
        title: 'Structural Collapse',
        description: 'A support beam in the north arcade of {market} groans and splinters. Stalls slide sideways into a widening seam of gray nothing, and {goods} spill toward the crack. Shoppers freeze mid-bargain as dust hangs unnaturally still in the air.',
        sensoryNote: 'The smell of old timber and {sensory} mixes with cold stone dust.',
        urgency: 3,
        anchorWords: ['brace', 'beam', 'prop', 'secure', 'reinforce', 'tie', 'hold', 'support', 'stabilize', 'evacuate', 'guide'],
    },
    {
        key: 'vanishing-merchants',
        title: 'The Vanishing Merchants',
        description: 'One by one the elders of {market} are fading — first their hands, then their voices. A fishmonger mouths prices no one hears. Without their memories the stalls lose their names, and the letters on every signboard begin to drip like wet ink.',
        sensoryNote: 'Where a merchant stood, only {sensory} remains, thinning.',
        urgency: 3,
        anchorWords: ['name', 'recite', 'remember', 'sing', 'rally', 'unite', 'call', 'gather', 'hold', 'hands', 'story', 'stories'],
    },
    {
        key: 'fading-aromas',
        title: 'Fading Aromas',
        description: 'The scents of {market} are being drained away. Saffron turns to gray powder, bread cools to paper, and the air tastes of static. Without smell the market loses its oldest anchor, and shoppers wander in circles, unable to find stalls they visited for decades.',
        sensoryNote: 'A faint trace of {sensory} flickers, then dies.',
        urgency: 2,
        anchorWords: ['spice', 'smell', 'burn', 'crush', 'grind', 'brew', 'cook', 'bake', 'incense', 'scatter', 'rosewater', 'coffee'],
    },
    {
        key: 'auditory-static',
        title: 'Auditory Static',
        description: 'Sound inside {market} is corrupting. Haggling turns to radio hiss, coins clink a half-second late, and every footstep echoes from the wrong direction. Children cover their ears as a low hum crawls up through the paving stones into their teeth.',
        sensoryNote: 'Beneath the hum, almost lost: {sensory}.',
        urgency: 2,
        anchorWords: ['sing', 'chant', 'bell', 'drum', 'clap', 'music', 'shout', 'call', 'rhythm', 'stomp', 'loudly'],
    },
    {
        key: 'lantern-void',
        title: 'The Lantern Void',
        description: 'Every lamp in {market} gutters at once. A sphere of absolute dark rolls down the main aisle, swallowing stalls whole; what it passes over simply stops existing. The remaining light pools around a handful of trembling lanterns and one dying brazier.',
        sensoryNote: 'At the dark’s edge you still catch {sensory}, then nothing.',
        urgency: 3,
        anchorWords: ['light', 'lantern', 'rekindle', 'relight', 'ignite', 'kindle', 'candle', 'lamp', 'brazier', 'ember', 'torch'],
    },
    {
        key: 'panic-crowd',
        title: 'Panic in the Crowd',
        description: 'A scream tears through {market} and the crowd surges. Bodies slam into stall frames, {goods} crunch underfoot, and the crush pushes everyone toward the thinning edge of reality where the cobblestones already end in pale mist.',
        sensoryNote: 'Over the panic, thin and fading: {sensory}.',
        urgency: 3,
        anchorWords: ['calm', 'guide', 'chain', 'soothe', 'direct', 'lead', 'reassure', 'steady', 'organize', 'escort', 'together'],
    },
    {
        key: 'memory-dissolution',
        title: 'Dissolution of Memory',
        description: 'You forget why you came to {market}. Your own reflection in a brass scale-pan looks borrowed. Around you, regulars stare at stalls they have shopped for forty years and recognize nothing — the market is being forgotten, and forgetting is a two-way door.',
        sensoryNote: 'One memory survives, stubborn: {sensory}.',
        urgency: 2,
        anchorWords: ['remember', 'name', 'recite', 'write', 'record', 'story', 'stories', 'photograph', 'price', 'sing', 'memory'],
    },
    {
        key: 'time-vortex',
        title: 'The Time Vortex',
        description: 'Above {market} a slow whirlpool of gray seconds opens, siphoning time itself. Clocks run backward, bread un-bakes, and the Pillar of Time flickers as stolen minutes spiral upward. Every trader watches their livelihood age and un-age in waves.',
        sensoryNote: 'The vortex smells faintly of {sensory} and ozone.',
        urgency: 3,
        anchorWords: ['anchor', 'pillar', 'stabilize', 'steady', 'brace', 'hold', 'bind', 'tie', 'counter', 'plant', 'ground'],
    },
];

// ---------------------------------------------------------------------------
// SENSORY DEGRADATION TIERS (plan §4)
// ---------------------------------------------------------------------------
export interface DegradationTier {
    tier: 1 | 2 | 3 | 4;
    label: string;
    effects: string[];
    vignette: number;   // 0..1 alpha
    desaturate: number; // 0..1
    glitch: boolean;
}

export const DEGRADATION_TIERS: DegradationTier[] = [
    { tier: 1, label: 'CRISP REALITY', effects: ['soft ambient hustle', 'glowing lantern particles', 'vivid colors'], vignette: 0.10, desaturate: 0.0, glitch: false },
    { tier: 2, label: 'SOFTENING', effects: ['ground softens into mist', 'words flicker', 'whispers replace crowd chatter'], vignette: 0.28, desaturate: 0.25, glitch: false },
    { tier: 3, label: 'FADING', effects: ['sepia drift', 'vignette pulsation', 'chromatic aberration', 'frantic crises'], vignette: 0.48, desaturate: 0.55, glitch: true },
    { tier: 4, label: 'CRITICAL DISSOLUTION', effects: ['low-pass hum', 'glitching text', 'violent reality distortions', 'sensory loss'], vignette: 0.70, desaturate: 0.85, glitch: true },
];

export function computeTier(timeRemaining: number, health: number): DegradationTier {
    if (timeRemaining < 50 || health < 25) return DEGRADATION_TIERS[3];
    if (timeRemaining < 100 || health < 50) return DEGRADATION_TIERS[2];
    if (timeRemaining < 160 || health < 75) return DEGRADATION_TIERS[1];
    return DEGRADATION_TIERS[0];
}

export const STORAGE_KEY = 'save-the-market-runs';

export interface RunRecord {
    name: string;
    marketName: string;
    score: number;          // peak time reached
    date: string;
    won: boolean;
    crisesResolved: number;
}