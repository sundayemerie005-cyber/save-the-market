import { AUTO, Events, Game as PhaserGame, Scale, Scene } from 'phaser';
import { COLORS, GAME_CONFIG, GAME_HEIGHT, GAME_WIDTH, computeTier } from './config';
import { LEVEL_MAP, TILE } from './levels';
import { GameControls } from './controls';
import { Crisis, generateCrisis, resetCrisisEngine } from './crisisEngine';
import { ActionVerdict, evaluateAction } from './nlpParser';
import { playSFX } from './audio';

export { GAME_CONFIG, GAME_WIDTH, GAME_HEIGHT, COLORS, LEVEL_MAP, TILE, GameControls };

// ---------------------------------------------------------------------------
// EVENT BUS — shared React <-> Phaser bridge (named export).
// ---------------------------------------------------------------------------
export const EventBus = new Events.EventEmitter();

export type GamePhase = 'MENU' | 'PLAYING' | 'PAUSED' | 'FINISHED';

const StartGame = (parent: string) =>
{
    const config: Phaser.Types.Core.GameConfig = {
        type: AUTO,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        parent,
        backgroundColor: '#0a0612',
        scale: {
            mode: Scale.FIT,
            autoCenter: Scale.CENTER_BOTH,
        },
        input: {
            activePointers: 3,
        },
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 0 },
                fps: 60,
                fixedStep: true,
            },
        },
        scene: [Game],
    };

    const game = new PhaserGame(config);
    if (typeof window !== 'undefined') {
        (window as any).__PHASER_GAME__ = game;
        (window as any).__PHASER_EVENT_BUS__ = EventBus;
    }
    return game;
};

// ---------------------------------------------------------------------------
// THE GAME SCENE — atmospheric void, Pillar of Time beacon, sensory
// degradation engine, survival state machine, EventBus synchronization.
// ---------------------------------------------------------------------------
export class Game extends Scene
{
    private entities: Array<{ update?: (time: number, delta: number) => void }> = [];
    public controls!: GameControls;

    // Survival state
    private phase: GamePhase = 'MENU';
    private timeRemaining = GAME_CONFIG.initialTime;
    private health = GAME_CONFIG.maxHealth;
    private peakTime = GAME_CONFIG.initialTime;
    private crisesResolved = 0;
    private marketName = 'the Market';
    private currentCrisis: Crisis | null = null;
    private crisisTimer = 0;
    private timeEmitAccum = 0;
    private currentTier = 0;

    // Visual objects
    private pillar!: Phaser.GameObjects.Container;
    private pillarFill!: Phaser.GameObjects.Rectangle;
    private pillarGlow!: Phaser.GameObjects.Rectangle;
    private vignette!: Phaser.GameObjects.Rectangle;
    private mistEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private emberEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private worldGroup!: Phaser.GameObjects.Container;
    private groundTiles!: Phaser.Physics.Arcade.StaticGroup;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        // All SFX are procedural (ZzFX via src/game/audio.ts) — no catalog
        // audio files to load; safePlay() guards any future cached keys.
    }

    create ()
    {
        this.controls = new GameControls(this, { joystickRadius: 0, hasActionButton: false });
        this.controls.setVisible(false);

        this.cameras.main.setBackgroundColor(COLORS.BACKGROUND);

        // --- Procedural particle textures (micro dust only — permitted) ---
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle_dot', 8, 8);
        g.clear();
        g.fillStyle(0xffffff, 0.6);
        g.fillCircle(16, 16, 16);
        g.generateTexture('particle_mist', 32, 32);
        g.destroy();

        // --- World container (tinted for desaturation drift) ---
        this.worldGroup = this.add.container(0, 0).setDepth(-10);

        // Deep void gradient bands
        const bands = [0x1a1030, 0x150c28, 0x100820, 0x0c0518];
        bands.forEach((c, i) => {
            const r = this.add.rectangle(
                GAME_WIDTH / 2, (GAME_HEIGHT / bands.length) * i + GAME_HEIGHT / bands.length / 2,
                GAME_WIDTH, GAME_HEIGHT / bands.length + 2, c, 1
            );
            this.worldGroup.add(r);
        });

        // --- Ground reality foundation from LEVEL_MAP (ASCII grid) ---
        this.groundTiles = this.physics.add.staticGroup();
        const mapOffsetX = (GAME_WIDTH - LEVEL_MAP[0].length * TILE) / 2;
        const mapOffsetY = GAME_HEIGHT - LEVEL_MAP.length * TILE - 40;
        for (let r = 0; r < LEVEL_MAP.length; r++) {
            for (let c = 0; c < LEVEL_MAP[r].length; c++) {
                const ch = LEVEL_MAP[r][c];
                const x = mapOffsetX + c * TILE + TILE / 2;
                const y = mapOffsetY + r * TILE + TILE / 2;
                if (ch === '#') {
                    const tile = this.add.rectangle(x, y, TILE, TILE, COLORS.GROUND, 1);
                    tile.setStrokeStyle(1, COLORS.GROUND_TOP, 0.5);
                    this.worldGroup.add(tile);
                    const body = this.groundTiles.create(x, y, 'particle_dot') as Phaser.Physics.Arcade.Sprite;
                    if (body && body.body) {
                        body.setVisible(false);
                        (body.body as Phaser.Physics.Arcade.StaticBody).setSize(TILE, TILE, true);
                    }
                } else if (ch === 'F') {
                    this.buildPillar(x, y);
                }
            }
        }

        // --- Ambient mist + ember particles ---
        this.mistEmitter = this.add.particles(0, 0, 'particle_mist', {
            x: { min: 0, max: GAME_WIDTH },
            y: { min: GAME_HEIGHT * 0.4, max: GAME_HEIGHT },
            lifespan: 6000,
            speedX: { min: -12, max: 12 },
            speedY: { min: -18, max: -4 },
            scale: { start: 1.4, end: 2.6 },
            alpha: { start: 0.10, end: 0 },
            tint: COLORS.MIST,
            frequency: 400,
            quantity: 1,
        }).setDepth(30);

        this.emberEmitter = this.add.particles(0, 0, 'particle_dot', {
            x: { min: GAME_WIDTH * 0.3, max: GAME_WIDTH * 0.7 },
            y: { min: GAME_HEIGHT * 0.5, max: GAME_HEIGHT * 0.8 },
            lifespan: 3500,
            speedY: { min: -40, max: -12 },
            speedX: { min: -8, max: 8 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.9, end: 0 },
            tint: COLORS.EMBER,
            frequency: 260,
            quantity: 1,
        }).setDepth(30);

        // --- Vignette overlay (pulsates at higher tiers) ---
        this.vignette = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.1
        ).setDepth(50);

        // --- EventBus: React -> Scene commands ---
        EventBus.on('market-chosen', this.onMarketChosen, this);
        EventBus.on('action-submitted', this.onActionSubmitted, this);
        EventBus.on('restart-game', this.onRestart, this);
        EventBus.on('toggle-pause', this.onTogglePause, this);

        this.input.keyboard?.on('keydown-ESC', () => this.onTogglePause());

        // Hand this scene to React.
        EventBus.emit('current-scene-ready', this);
        EventBus.emit('phase-changed', 'MENU' as GamePhase);

        this.events.once('shutdown', () =>
        {
            this.time.removeAllEvents();
            this.tweens.killAll();
            this.input.keyboard?.removeAllListeners();
            this.sound.stopAll();
            EventBus.removeListener('market-chosen', this.onMarketChosen, this);
            EventBus.removeListener('action-submitted', this.onActionSubmitted, this);
            EventBus.removeListener('restart-game', this.onRestart, this);
            EventBus.removeListener('toggle-pause', this.onTogglePause, this);
            this.entities = [];
        });
    }

    private buildPillar (x: number, y: number)
    {
        this.pillar = this.add.container(x, y - 120).setDepth(8);

        // Monolith body
        const body = this.add.rectangle(0, 0, 44, 240, 0x1c2f45, 1);
        body.setStrokeStyle(2, COLORS.PILLAR, 0.9);

        // Fill gauge (drains from bottom-anchored)
        this.pillarFill = this.add.rectangle(0, 120, 36, 0, COLORS.PILLAR, 0.85);

        // Glow aura
        this.pillarGlow = this.add.rectangle(0, 0, 60, 256, COLORS.PILLAR_GLOW, 0.12);

        // Rune cap
        const cap = this.add.rectangle(0, -128, 56, 14, COLORS.PILLAR_GLOW, 0.9);

        this.pillar.add([this.pillarGlow, body, this.pillarFill, cap]);

        this.tweens.add({
            targets: this.pillarGlow,
            alpha: { from: 0.06, to: 0.22 },
            duration: 1600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    private onMarketChosen (payload: { marketName: string; theme: string })
    {
        this.marketName = payload?.marketName ?? 'the Market';
        this.startRun();
    }

    private startRun ()
    {
        resetCrisisEngine();
        this.timeRemaining = GAME_CONFIG.initialTime;
        this.health = GAME_CONFIG.maxHealth;
        this.peakTime = GAME_CONFIG.initialTime;
        this.crisesResolved = 0;
        this.crisisTimer = 0;
        this.currentTier = 0;
        this.phase = 'PLAYING';

        this.spawnCrisis();
        this.applyTierVisuals(computeTier(this.timeRemaining, this.health), true);

        EventBus.emit('phase-changed', this.phase);
        EventBus.emit('time-updated', { timeRemaining: this.timeRemaining, maxMilestone: GAME_CONFIG.victoryMilestone });
        EventBus.emit('health-updated', { health: this.health, delta: 0, reason: 'run-start' });
    }

    private spawnCrisis ()
    {
        this.currentCrisis = generateCrisis(this.marketName);
        this.crisisTimer = GAME_CONFIG.crisisHesitationWindow;
        EventBus.emit('crisis-generated', {
            id: this.currentCrisis.id,
            title: this.currentCrisis.title,
            description: this.currentCrisis.description,
            sensoryNote: this.currentCrisis.sensoryNote,
            urgency: this.currentCrisis.urgency,
        });
    }

    private onActionSubmitted (payload: { rawInput: string })
    {
        if (this.phase !== 'PLAYING') return;

        const verdict: ActionVerdict = evaluateAction(payload?.rawInput ?? '', this.currentCrisis);

        this.health = Math.max(0, Math.min(GAME_CONFIG.maxHealth, this.health + verdict.healthDelta));
        this.timeRemaining = Math.max(0, this.timeRemaining + verdict.timeDelta);
        this.peakTime = Math.max(this.peakTime, this.timeRemaining);

        if (verdict.category === 'STRONG') {
            this.crisesResolved += 1;
            this.safePlay('sfx_success');
            playSFX('powerup', 0.5);
            this.flashPillar(0x57e389);
            this.time.delayedCall(700, () => {
                if (this.phase === 'PLAYING') this.spawnCrisis();
            });
        } else if (verdict.category === 'HARMFUL') {
            this.safePlay('sfx_hit');
            playSFX('explosion', 0.6);
            this.cameras.main.shake(420, 0.012);
            this.flashPillar(0xff4d6d);
            this.crisisTimer = Math.max(4, this.crisisTimer - 4);
        } else {
            this.safePlay('sfx_hit');
            playSFX('hit', 0.4);
            this.crisisTimer = Math.max(4, this.crisisTimer - 2);
        }

        EventBus.emit('action-evaluated', {
            category: verdict.category,
            feedback: verdict.feedback,
            healthDelta: verdict.healthDelta,
            timeDelta: verdict.timeDelta,
            sensoryConsequence: verdict.sensoryConsequence,
        });
        EventBus.emit('health-updated', { health: this.health, delta: verdict.healthDelta, reason: verdict.category });
        EventBus.emit('time-updated', { timeRemaining: this.timeRemaining, maxMilestone: GAME_CONFIG.victoryMilestone });

        this.checkEndConditions();
    }

    private onTogglePause ()
    {
        if (this.phase === 'PLAYING') {
            this.phase = 'PAUSED';
            this.tweens.pauseAll();
            EventBus.emit('phase-changed', this.phase);
        } else if (this.phase === 'PAUSED') {
            this.phase = 'PLAYING';
            this.tweens.resumeAll();
            EventBus.emit('phase-changed', this.phase);
        }
    }

    private onRestart ()
    {
        this.tweens.resumeAll();
        this.phase = 'MENU';
        this.currentCrisis = null;
        EventBus.emit('phase-changed', 'MENU' as GamePhase);
        this.applyTierVisuals(computeTier(GAME_CONFIG.initialTime, GAME_CONFIG.maxHealth), true);
    }

    private flashPillar (color: number)
    {
        if (!this.pillarFill) return;
        this.pillarFill.setFillStyle(color, 1);
        this.time.delayedCall(350, () => {
            if (this.pillarFill) this.pillarFill.setFillStyle(COLORS.PILLAR, 0.85);
        });
    }

    private safePlay (key: string)
    {
        if (this.cache?.audio?.exists?.(key) && !this.sound.mute) {
            this.sound.play(key, { volume: 0.7 });
        }
    }

    private checkEndConditions ()
    {
        if (this.phase !== 'PLAYING') return;

        const won = this.timeRemaining >= GAME_CONFIG.victoryMilestone
            || this.crisesResolved >= GAME_CONFIG.crisesToVictory;
        const lost = this.health <= 0 || this.timeRemaining <= 0;

        if (won) this.finish(true, 'Reality solidifies — the market is permanently re-anchored.');
        else if (lost) {
            const reason = this.health <= 0
                ? 'Your vitality hits zero — the dread consumes you as the market dissolves.'
                : 'The Pillar of Time runs dry — the last second flakes away into the gray void.';
            this.finish(false, reason);
        }
    }

    private finish (won: boolean, reason: string)
    {
        this.phase = 'FINISHED';
        this.currentCrisis = null;
        if (won) {
            this.safePlay('sfx_success');
            playSFX('win', 0.8);
        } else {
            playSFX('gameover', 0.8);
            this.cameras.main.shake(700, 0.02);
        }
        EventBus.emit('game-over', {
            won,
            reason,
            stats: {
                survivalTime: Math.round(this.peakTime * 10) / 10,
                crisesResolved: this.crisesResolved,
                marketName: this.marketName,
            },
        });
        EventBus.emit('phase-changed', 'FINISHED' as GamePhase);
    }

    private applyTierVisuals (tierDef: ReturnType<typeof computeTier>, force = false)
    {
        if (!force && tierDef.tier === this.currentTier) return;
        this.currentTier = tierDef.tier;

        // Vignette + desaturation drift via world tint
        if (this.vignette) this.vignette.setAlpha(tierDef.vignette);
        if (this.worldGroup) {
            const gray = Math.round(tierDef.desaturate * 180);
            const tint = 0xffffff - (gray << 16) - (gray << 8) - gray;
            const worldChildren = (this.worldGroup as any).list;
            if (Array.isArray(worldChildren)) {
                worldChildren.forEach((child: any) => {
                    if (child && typeof child.setTint === 'function') child.setTint(tint);
                });
            }
        }
        // Mist thickens, embers die as reality degrades
        if (this.mistEmitter) this.mistEmitter.setFrequency(Math.max(80, 400 - tierDef.tier * 100));
        if (this.emberEmitter) this.emberEmitter.setFrequency(tierDef.tier >= 3 ? 900 : 260);

        EventBus.emit('escalation-tier', { tier: tierDef.tier, effects: tierDef.effects });
    }

    update (time: number, delta: number)
    {
        const dt = delta / 1000;

        for (const entity of this.entities) {
            if (entity.update) entity.update(time, delta);
        }

        if (this.phase !== 'PLAYING') return;

        // Pillar of Time drains in real time
        this.timeRemaining = Math.max(0, this.timeRemaining - GAME_CONFIG.timeDrainPerSecond * dt);
        this.peakTime = Math.max(this.peakTime, this.timeRemaining);

        // Crisis hesitation window
        if (this.currentCrisis) {
            this.crisisTimer -= dt;
            if (this.crisisTimer <= 0) {
                this.health = Math.max(0, this.health - GAME_CONFIG.hesitationDamage);
                EventBus.emit('health-updated', { health: this.health, delta: -GAME_CONFIG.hesitationDamage, reason: 'hesitation' });
                this.spawnCrisis();
                this.checkEndConditions();
            }
        }

        // Pillar gauge visual (fill proportional to milestone progress)
        if (this.pillarFill) {
            const pct = Math.max(0, Math.min(1, this.timeRemaining / GAME_CONFIG.victoryMilestone));
            this.pillarFill.setSize(36, 232 * pct);
            this.pillarFill.setY(120 - 232 * pct);
        }

        // Vignette pulsation at tier 3+
        if (this.vignette && this.currentTier >= 3) {
            const base = computeTier(this.timeRemaining, this.health).vignette;
            this.vignette.setAlpha(base + Math.sin(time / 220) * 0.08);
        }

        // Escalation tier
        this.applyTierVisuals(computeTier(this.timeRemaining, this.health));

        // Throttled time updates to React (~10 Hz)
        this.timeEmitAccum += dt;
        if (this.timeEmitAccum >= 0.1) {
            this.timeEmitAccum = 0;
            EventBus.emit('time-updated', { timeRemaining: this.timeRemaining, maxMilestone: GAME_CONFIG.victoryMilestone });
        }

        this.checkEndConditions();
    }
}

export default StartGame;