// States
const S_Loading = 0;
const S_Menu = 1;
const S_Game = 2;
const S_GameOver = 3;

// Screen Consts
const LOGICAL_W = 1920;
const LOGICAL_H = 1080;

const SCREEN_WIDTH = LOGICAL_W;
const SCREEN_HEIGHT = LOGICAL_H;

const MENU_X = LOGICAL_W - 440;
const MENU_Y = 32;
const MENU_W = 400;
const MENU_H = 56;
const MENU_GAP = 64;

// Data
const CRAFT_TIME_SHORT = 1.5;
const CRAFT_TIME_MEDIUM = 2;
const CRAFT_TIME_LONG = 3;
const MAX_TURRET_SLOTS = 4;

const ADVANCEMENTS = [
    { name: "Ancient", xp: 0 },
    { name: "Medieval", xp: 1000 },
    { name: "Industrial", xp: 2500 },
    { name: "Futuristic", xp: 7500 },
];

const UNIT_STATS = [
    {
        melee: { hp: 50, dmg: 6, speed: 80, cost: 20, w: 40, h: 40, craftTime: CRAFT_TIME_SHORT },
        ranged: { hp: 30, dmg: 4, speed: 80, range: 320, cost: 30, w: 32, h: 48, craftTime: CRAFT_TIME_MEDIUM },
        tank: { hp: 160, dmg: 6, speed: 56, cost: 60, w: 64, h: 48, craftTime: CRAFT_TIME_LONG },
    },
    {
        melee: { hp: 70, dmg: 9, speed: 88, cost: 35, w: 40, h: 40, craftTime: CRAFT_TIME_SHORT },
        ranged: { hp: 45, dmg: 6, speed: 88, range: 380, cost: 45, w: 32, h: 48, craftTime: CRAFT_TIME_MEDIUM },
        tank: { hp: 240, dmg: 9, speed: 56, cost: 95, w: 72, h: 56, craftTime: CRAFT_TIME_LONG },
    },
    {
        melee: { hp: 100, dmg: 14, speed: 96, cost: 55, w: 40, h: 40, craftTime: CRAFT_TIME_SHORT },
        ranged: { hp: 65, dmg: 10, speed: 96, range: 440, cost: 70, w: 32, h: 48, craftTime: CRAFT_TIME_MEDIUM },
        tank: { hp: 360, dmg: 14, speed: 56, cost: 150, w: 80, h: 56, craftTime: CRAFT_TIME_LONG },
    },
    {
        melee: { hp: 140, dmg: 20, speed: 104, cost: 80, w: 40, h: 40, craftTime: CRAFT_TIME_SHORT },
        ranged: { hp: 90, dmg: 16, speed: 104, range: 520, cost: 110, w: 32, h: 48, craftTime: CRAFT_TIME_MEDIUM },
        tank: { hp: 520, dmg: 20, speed: 56, cost: 220, w: 88, h: 64, craftTime: CRAFT_TIME_LONG },
    },
];

const TURRET_STATS = [
    { dmg: 6, range: 480, cost: 60 },
    { dmg: 10, range: 600, cost: 100 },
    { dmg: 16, range: 720, cost: 160 },
    { dmg: 24, range: 880, cost: 260 },
];

const ENEMY_PHASES = [
    // Ancient
    {
        unlockTime: 0,
        advancement: 0,
        turretSlots: 0,
        unitWeights: {
            melee: 1,
        },
        turretSwapChance: 0,
    },
    {
        unlockTime: 30,
        advancement: 0,
        turretSlots: 1,
        unitWeights: {
            melee: 1,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 60,
        advancement: 0,
        turretSlots: 1,
        unitWeights: {
            melee: 0.7,
            ranged: 0.3,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 120,
        advancement: 0,
        turretSlots: 1,
        unitWeights: {
            melee: 0.4,
            ranged: 0.4,
            tank: 0.2,
        },
        turretSwapChance: 0.05,
    },

    // Medieval
    {
        unlockTime: 210,
        advancement: 1,
        turretSlots: 1,
        unitWeights: {
            melee: 1,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 240,
        advancement: 1,
        turretSlots: 2,
        unitWeights: {
            melee: 1,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 270,
        advancement: 1,
        turretSlots: 2,
        unitWeights: {
            melee: 0.7,
            ranged: 0.3,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 330,
        advancement: 1,
        turretSlots: 2,
        unitWeights: {
            melee: 0.4,
            ranged: 0.4,
            tank: 0.2,
        },
        turretSwapChance: 0.2,
    },

    // Industrial
    {
        unlockTime: 420,
        advancement: 2,
        turretSlots: 2,
        unitWeights: {
            melee: 1,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 450,
        advancement: 2,
        turretSlots: 3,
        unitWeights: {
            melee: 1,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 480,
        advancement: 2,
        turretSlots: 3,
        unitWeights: {
            melee: 0.7,
            ranged: 0.3,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 540,
        advancement: 2,
        turretSlots: 3,
        unitWeights: {
            melee: 0.4,
            ranged: 0.4,
            tank: 0.2,
        },
        turretSwapChance: 0.2,
    },

    // Futuristic
    {
        unlockTime: 630,
        advancement: 3,
        turretSlots: 3,
        unitWeights: {
            melee: 1,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 660,
        advancement: 3,
        turretSlots: 4,
        unitWeights: {
            melee: 1,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 690,
        advancement: 3,
        turretSlots: 4,
        unitWeights: {
            melee: 0.7,
            ranged: 0.3,
        },
        turretSwapChance: 0.2,
    },
    {
        unlockTime: 750,
        advancement: 3,
        turretSlots: 4,
        unitWeights: {
            melee: 0.4,
            ranged: 0.4,
            tank: 0.2,
        },
        turretSwapChance: 0.05,
    },
    {
        unlockTime: 900,
        advancement: 3,
        turretSlots: 4,
        unitWeights: {
            melee: 0.2,
            ranged: 0.4,
            tank: 0.4,
        },
        turretSwapChance: 0.05,
    },
];


const MENUS = {
    root: () => [
        { label: "Spawn Unit", action: () => menuMode = "units" },
        { label: "Add Turret", action: () => menuMode = "turrets" },
        { label: "Sell Turret", action: sellTurret },
        { label: factions.player.turretSlots <= MAX_TURRET_SLOTS ? `Add Turret Slot (${factions.player.turretSlots * 100})` : `Max Turret Slots`, action: buySlot },
        {
            label: ADVANCEMENTS[factions.player.advancement + 1]
                ? `Advance (${ADVANCEMENTS[factions.player.advancement + 1].xp})`
                : "Max Age",
            action: advanceAge
        }
    ],

    units: () => [
        { label: "< Back", action: () => menuMode = "root" },
        ...["melee", "ranged", "tank"].map(type => ({
            label: `${type} (${UNIT_STATS[factions.player.advancement][type].cost})`,
            action: () => queueUnit(type)
        }))
    ],

    turrets: () => [
        { label: "< Back", action: () => menuMode = "root" },
        {
            label: `Turret (${TURRET_STATS[factions.player.advancement].cost})`,
            action: buyTurret
        }
    ]
};


// Init
instance = litecanvas({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    pixelart: false,
});

use(pluginAssetLoader);

let state, stateTimer;
let unitQueue, craftTimer;
let menuMode;
let enemySpawnTimer;
let gameResult;
let projectiles;

const LANE_Y = LOGICAL_H - 200;
const BASE_LEFT = 80;
const BASE_RIGHT = LOGICAL_W - 120;

function init() {
    textsize(36);
    clearGame();
    setState(S_Menu);
}

function clearGame() {
    factions = {
        player: makeFaction(+1, BASE_LEFT),
        enemy: makeFaction(-1, BASE_RIGHT),
    };

    unitQueue = [];
    craftTimer = 0;
    enemySpawnTimer = 0;
    projectiles = [];
    menuMode = "root";
}

function setState(s) {
    state = s;
    stateTimer = 0;
    timescale(s === S_Game ? 1 : 0);
}

// Update
function update(dt) {
    stateTimer += dt;

    if (state !== S_Game) return;
    for (const f of Object.values(factions)) {
        f.base.hp = Math.min(f.base.hp + dt * 0.25, f.base.maxHP);
    }

    updateCrafting(dt);
    updateUnits(dt);
    updateTurrets(dt);
    updateProjectiles(dt);
    spawnEnemies(dt);
}

function draw() {
    cls(0);
    push();

    if (state === S_Menu) {
        textalign('center', 'middle');

        const titleX = LOGICAL_W / 2;
        const titleY = LOGICAL_H / 2 - 100;

        text(titleX, titleY, "AEONS OF WARFARE", 3);

        const buttonWidth = 400;
        const buttonHeight = 80;
        const buttonX = (LOGICAL_W - buttonWidth) / 2;
        const buttonY = LOGICAL_H / 2;

        rectfill(buttonX, buttonY, buttonWidth, buttonHeight, 1);

        const buttonTextY = buttonY + (buttonHeight / 2) + 2;
        text(titleX, buttonTextY, "START", 3);

        textalign('start', 'top');
    }

    if (state === S_Game) {
        drawBattlefield();

        drawBase(factions.player, 3);
        drawBase(factions.enemy, 1);

        drawFactionUnits(factions.player, 3);
        drawFactionUnits(factions.enemy, 1);

        drawFactionTurrets(factions.player, 2);
        drawFactionTurrets(factions.enemy, 1);

        drawProjectiles();
        drawUI();
        drawMenu();
    }

    if (state === S_GameOver) {
        text(800, 480, gameResult, 3);
    }

    pop();
}

// Input
function tap(x, y) {
    if (state === S_Menu) {
        if (x >= 760 && x <= 1160 && y >= 580 && y <= 652) {
            setState(S_Game);
        }
        return;
    }

    if (state === S_Game) {
        handleMenuTap(x, y);
    }
}


function handleMenuTap(x, y) {
    const buttons = MENUS[menuMode]?.();
    if (!buttons) return;

    let by = MENU_Y;

    for (const b of buttons) {
        const hit =
            x >= MENU_X &&
            x <= MENU_X + MENU_W &&
            y >= by &&
            y <= by + MENU_H;

        if (hit) {
            b.action();
            return;
        }

        by += MENU_GAP;
    }
}

// UI
function drawUI() {
    const f = factions.player;
    text(20, 20, `Gold: ${f.gold}`, 3);
    text(20, 72, `XP: ${f.xp}`, 3);
    text(20, 124, ADVANCEMENTS[factions.player.advancement].name, 1);

    rect(640, 20, 640, 32, 1);

    if (!unitQueue.length) return;
    const s = UNIT_STATS[f.advancement][unitQueue[0]];
    rectfill(640, 20, (craftTimer / s.craftTime) * 640, 32, 3);
}

function drawMenu() {
    const buttons = MENUS[menuMode]?.();
    if (!buttons) return;

    let y = MENU_Y;

    for (const b of buttons) {
        rectfill(MENU_X, y, MENU_W, MENU_H, 1);
        text(MENU_X + 16, y + 12, b.label, 3);
        y += MENU_GAP;
    }
}

// UI Actions
function queueUnit(type) {
    const f = factions.player;
    if (unitQueue.length >= 5) return;

    const stats = UNIT_STATS[f.advancement][type];
    if (f.gold < stats.cost) return;

    f.gold -= stats.cost;
    unitQueue.push(type);
}

function buyTurret() {
    const f = factions.player;
    const t = TURRET_STATS[f.advancement];
    if (f.turrets.length >= f.turretSlots || f.gold < t.cost) return;

    addTurret(f);
}

function addTurret(f) {
    const t = TURRET_STATS[f.advancement];
    f.gold -= t.cost;
    f.turrets.push({
        ...t,
        x: f.base.x - 20,
        y: f.base.y - 72 - 60 * f.turrets.length,
        angle: 0,
        cd: 0,
    });
}

function sellTurret() {
    const f = factions.player;
    if (f.turrets.length === 0) return;

    const refund = Math.floor(TURRET_STATS[f.advancement].cost * 0.5);
    gold += refund;
    f.turrets.pop();
}

function buySlot() {
    let f = factions.player;
    if (f.turretSlots >= MAX_TURRET_SLOTS) return;

    const cost = 100 * f.turretSlots;
    if (f.gold < cost) return;

    f.gold -= cost;
    f.turretSlots++;
}

function advanceAge() {
    const f = factions.player;
    if (f.advancement + 1 >= ADVANCEMENTS.length) return;

    const next = ADVANCEMENTS[f.advancement + 1];
    if (f.xp < next.xp) return;

    f.advancement++;
}

// Gameplay
function updateCrafting(dt) {
    if (!unitQueue.length) return;
    const f = factions.player;
    const s = UNIT_STATS[f.advancement][unitQueue[0]];
    craftTimer += dt;
    if (craftTimer >= s.craftTime) {
        spawnUnit(f, unitQueue.shift());
        craftTimer -= s.craftTime;
    }
}

function spawnUnit(faction, type) {
    const s = UNIT_STATS[faction.advancement][type];
    const unit = {
        ...s,
        type,
        x: faction.base.x + faction.dir * 32,
        y: LANE_Y,
        cd: 0,
        faction,
        maxHP: s.hp,
        rewardXP: Math.floor(s.cost * 0.5),
        rewardGold: Math.floor(s.cost * 0.5),
    };
    faction.units.push(unit);
    return unit;
}

function spawnEnemies(dt) {
    let enemy = factions.enemy;
    enemySpawnTimer -= dt;
    enemy.gold += dt * 3;

    if (enemySpawnTimer > 0 || enemy.gold <= 0) return;

    const phase = getEnemyPhase(stateTimer / 10);

    enemy.advancement = phase.advancement;
    enemy.turretSlots = phase.turretSlots;
    // This shouldn't be called from here, but rn I don't care so
    spawnEnemyTurrets(enemy, phase, phase.turretSwapChance);

    const unitType = rollWeighted(phase.unitWeights);
    const unit = spawnUnit(enemy, unitType);

    enemy.gold -= unit.cost;
    enemySpawnTimer += unit.craftTime;
}


function spawnEnemyTurrets(enemy, turretSwapChance) {
    if (enemy.turrets.length < enemy.turretSlots) {
        addTurret(enemy);
        return;
    }

    if (
        enemy.turrets.length &&
        Math.random() < turretSwapChance
    ) {
        enemy.turrets.shift();
        addTurret(enemy);
    }
}


function updateUnits(dt) {
    updateFactionUnits(factions.player, factions.enemy, dt);
    updateFactionUnits(factions.enemy, factions.player, dt);
}
function updateFactionUnits(faction, enemy, dt) {
    for (const u of faction.units) {
        const target =
            enemy.units.find(e => Math.abs(e.x - u.x) < (e.w + u.w) / 2 + (u.range || 48)) || (Math.abs(enemy.base.x - u.x) < 48 ? enemy.base : null);

        if (target) attack(u, target, dt);

        if (!isBlocked(u)) {
            u.x += u.speed * dt * faction.dir;
        }
    }

    for (const dead of enemy.units) {
        if (dead.hp <= 0) {
            faction.xp += dead.rewardXP || 0;
            faction.gold += dead.rewardGold || 0;
        }
    }

    enemy.units = enemy.units.filter(u => u.hp > 0);
}

function updateTurrets(dt) {
    const { player, enemy } = factions;

    for (const t of player.turrets) {
        t.cd -= dt;
        const target = enemy.units.find(e => Math.abs(e.x - t.x) < t.range);
        if (!target) continue;

        t.angle = Math.atan2(target.y - t.y, target.x - t.x);

        if (t.cd <= 0) {
            t.cd = 1;
            projectiles.push({
                x: t.x,
                y: t.y,
                vx: Math.cos(t.angle) * 880,
                vy: Math.sin(t.angle) * 880,
                dmg: t.dmg,
                target,
            });
        }
    }
}

function updateProjectiles(dt) {
    for (const p of projectiles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (Math.abs(p.x - p.target.x) < 24) {
            p.target.hp -= p.dmg;
            p.hit = true;
        }
    }

    projectiles = projectiles.filter(p => !p.hit);
}

// Helpers
function makeFaction(dir, baseX) {
    return {
        dir,
        units: [],
        turrets: [],
        base: {
            x: baseX,
            y: LANE_Y - 160,
            hp: 500,
            maxHP: 500,
            w: 40,
            h: 160,
        },
        gold: dir === 1 ? 100 : 0,
        xp: 0,
        advancement: 0,
        turretSlots: 1,
    };
}

function attack(attacker, target, dt) {
    attacker.cd -= dt;
    if (attacker.cd > 0) return;

    attacker.cd = 0.8;

    if (target.hp !== undefined) {
        target.hp -= attacker.dmg;
    }
}

function isBlocked(u) {
    const dir = u.faction.dir;

    const inFrontAndClose = (ox, ow = 0) =>
        Math.sign(ox - u.x) === dir &&
        Math.abs(ox - u.x) < (u.w + ow) / 2 + 8;

    const friendlyBlock = u.faction.units.some(o =>
        o !== u && inFrontAndClose(o.x, o.w)
    );

    const enemyFaction = u.faction === factions.player
        ? factions.enemy
        : factions.player;

    const enemyBlock = enemyFaction.units.some(o =>
        inFrontAndClose(o.x, o.w)
    );

    const enemyBase = enemyFaction.base;
    const baseBlock =
        Math.abs(enemyBase.x - u.x) <= (u.range || 48) &&
        Math.sign(enemyBase.x - u.x) === dir;

    return friendlyBlock || enemyBlock || baseBlock;
}


function endGame(result) {
    gameResult = result;
    setState(S_GameOver);
}

function getEnemyPhase(time) {
    let phase = ENEMY_PHASES[0];
    for (const p of ENEMY_PHASES) {
        if (time >= p.unlockTime) phase = p;
        else break;
    }
    return phase;
}

function rollWeighted(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;

    for (const [key, w] of entries) {
        if ((r -= w) <= 0) return key;
    }
}

// Draw
function drawBattlefield() {
    rectfill(0, LANE_Y + 48, LOGICAL_W, 16, 1);
}

function drawBase(faction, color) {
    const b = faction.base;

    rectfill(
        b.x - (faction.dir === 1 ? b.w : 0),
        b.y,
        b.w,
        b.h,
        color
    );

    // HP bar
    const bw = 160;
    const bx = b.x - bw / 2;
    const by = LANE_Y - b.h - 40;
    const bh = 20;

    const inset = 2;

    rectfill(bx, by, bw, bh, 1);
    rectfill(bx + inset, by + inset, (bw - inset * 2) * (b.hp / b.maxHP), bh - inset * 2, color);
}

function drawProjectiles() {
    for (const p of projectiles) {
        rectfill(p.x, p.y, 12, 8, 2);
    }
}

function drawFactionUnits(faction, color) {
    for (const u of faction.units) {
        rectfill(
            u.x,
            u.y - u.h,
            u.w,
            u.h,
            color
        );

        const barW = u.w;
        const barH = 12;
        const barX = u.x;
        const barY = u.y - u.h - 20;
        const inset = 2;

        rectfill(barX, barY, barW, barH, 2);
        const hpRatio = Math.max(0, u.hp) / u.maxHP;
        rectfill(barX + inset, barY + inset, (barW - inset * 2) * hpRatio, barH - inset * 2, color);
    }
}


function drawFactionTurrets(faction, color) {
    for (const t of faction.turrets) {
        rectfill(t.x - 24, t.y - 24, 48, 48, color);

        const len = 32;
        const ax = Math.cos(t.angle) * len;
        const ay = Math.sin(t.angle) * len;
        line(t.x, t.y, t.x + ax, t.y + ay, 3);
    }
}