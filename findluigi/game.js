// States
const S_Loading = 0;
const S_Menu = 1;
const S_Settings = 2;
const S_NextStage = 3;
const S_Searching = 4;
const S_Victory = 5;
const S_GameOver = 6;
const S_Continue = 7;

// Other constants
const SCREEN_HEIGHT = 192; // NB: Two screens!
const SCREEN_WIDTH = 255;
const HEAD_CENTER = 16;

const MAX_CLICK_DISTANCE_SQ = 20 * 20;
const FLASHLIGHT_SIZE_SMALL = 64.5
const FLASHLIGHT_SIZE_LARGE = 160

const HEAD_ORDER = ['mario', 'luigi', 'wario', 'yoshi'];
// Color picked from the original minigame....
// We only use 000 and FBE341, so the rest could just be null lol
const COLORS = [
    '#000',
    '#303030',
    '#929292',
    '#FBFBE3',
    '#F33828',
    '#FBE341',

    '#6161C3',
    '#41AAEB',
    '#286918',
    '#9AE39A',
    '#793838',
    '#E3B220',
]

// Dumb stuff
function isOnPhone() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getUserNumber() {
    const userInput = prompt("Select a level (1-9999):");
    if (userInput === null) return null;
    const number = parseInt(userInput.trim());
    if (isNaN(number) || number < 1 || number > 9999) {
        alert("Invalid level number.");
        return null;
    }
    return number;
}

let gameSettings = {
    pixelart: !isOnPhone(),
    canvasColors: false,
    highscores: [],
}
{
    const storedSettings = localStorage.getItem("settings");
    if (storedSettings) {
        gameSettings = Object.assign(gameSettings, JSON.parse(storedSettings));
    }
}

instance = litecanvas({
    loop: {
        init, update, draw,
        tap,
    },
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 2,
    pixelart: gameSettings.pixelart,
    pauseOnBlur: false,
})
instance.getcolor = index => COLORS[~~index % COLORS.length];


use(pluginAssetLoader)

function init() {
    bgm = null;
    stateTimer = 0;
    stateCounter = 0;
    clearGame(false);

    setState(S_Loading)

    sound_effects = {}
    HEAD_ORDER.forEach(head => sound_effects[head] = { 'fail': [], 'win': [] });

    images_converted = {}
    images_original = {}
    images = gameSettings.canvasColors ? images_converted : images_original;

    loadImage("assets/sprites/posters.png", (image, { convertColors, splitFrames }) => {
        images_original.posters = splitFrames(image, 256, 192, 0, 0)
        images_converted.posters = splitFrames(convertColors(image), 256, 192, 0, 0)
    })
    loadImage("assets/sprites/heads.png", (image, { convertColors, splitFrames }) => {
        images_original.heads = splitFrames(image, 32, 32, 0, 0)
        images_converted.heads = splitFrames(convertColors(image), 32, 32, 0, 0)
    })
    loadImage("assets/sprites/numbers.png", (image, { convertColors, splitFrames }) => {
        images_original.numbers = splitFrames(image, 17, 17, 0, 0)
        images_converted.numbers = splitFrames(convertColors(image), 17, 17, 0, 0)
    })
    loadImage("assets/sprites/stars.png", (image, { convertColors, splitFrames }) => {
        images_original.stars = splitFrames(image, 28, 28, 0, 0)
        images_converted.stars = splitFrames(convertColors(image), 28, 28, 0, 0)
    })
    loadImage("assets/sprites/level.png", (image, { convertColors, splitFrames }) => {
        images_original.level = image
        images_converted.level = convertColors(image)
    })
    loadImage("assets/sprites/menu.png", (image, { convertColors, splitFrames }) => {
        images_original.menu_buttons = splitFrames(image, 128, 38, 0, 0)
        images_converted.menu_buttons = splitFrames(convertColors(image), 128, 38, 0, 0)
    })
    loadImage("assets/sprites/settings.png", (image, { convertColors, splitFrames }) => {
        images_original.settings_buttons = splitFrames(image, 128, 38, 0, 0)
        images_converted.settings_buttons = splitFrames(convertColors(image), 128, 38, 0, 0)
    })
    loadImage("assets/sprites/timer.png", (image, { convertColors, splitFrames }) => {
        images_original.timer = splitFrames(image, 32, 32, 0, 0)
        images_converted.timer = splitFrames(convertColors(image), 32, 32, 0, 0)
    })
    loadImage("assets/sprites/time.png", (image, { convertColors, splitFrames }) => {
        images_original.time = image
        images_converted.time = convertColors(image)
    })
    loadImage("assets/sprites/continue.png", (image, { convertColors, splitFrames }) => {
        images_original.continue = image
        images_converted.continue = convertColors(image)
    })
    loadImage("assets/sprites/highscore.png", (image, { convertColors, splitFrames }) => {
        images_original.highscore = image
        images_converted.highscore = convertColors(image)
    })

    let failSoundsPerHead = [4, 5, 3, 4]
    let winSoundsPerHead = [4, 2, 1, 3]

    for (let head = 0; head < 4; head++) {
        let headName = HEAD_ORDER[head];
        for (let i = 0; i < failSoundsPerHead[head]; i++) {
            loadSound(
                "assets/audio/" + headName + "/fail" + i + ".wav",
                (sound) => {
                    sound_effects[headName]['fail'].push(sound);
                }
            )
        }
        for (let i = 0; i < winSoundsPerHead[head]; i++) {
            loadSound(
                "assets/audio/" + headName + "/win" + i + ".wav",
                (sound) => {
                    sound_effects[headName]['win'].push(sound);
                }
            )
        }
    }

    let mp3s = ['highscore', 'miniover']
    let wavs = ['correct', 'drumroll_short', 'drumroll_long', 'incorrect', 'time_increase']
    mp3s.forEach(name => {
        loadSound(
            "assets/audio/" + name + ".mp3",
            (sound) => {
                sound_effects[name] = sound;
            }
        )
    });
    wavs.forEach(name => {
        loadSound(
            "assets/audio/" + name + ".wav",
            (sound) => {
                sound_effects[name] = sound;
            }
        )
    });

    bgm = new Howl({
        src: ['assets/audio/casino.wav'],
        preload: true, loop: true,
        onfade: () => {
            bgm.stop();
        },
    });

    TOTAL_LOADING = LOADING

    quickstart = false;
    quickmode = false;

    button_positions = [];
    for (let i = 0; i < 3; i++) {
        let x = SCREEN_WIDTH / 4;
        let y = SCREEN_HEIGHT + SCREEN_HEIGHT * (i + 1) / 4;
        button_positions.push({ x: x, y: y });
    }
}

function clearGame(generateLevels) {
    let levelGenerators = [];
    if (generateLevels) {
        levelGenerators = preGenerateLevels();
    }

    game = {
        currentLevel: 0,
        stars: 0,
        countdownTimer: 10.99,
        smoothTimer: 10.99,
        level: {},
        levelGenerators: levelGenerators,
        practiceMode: false,
        continuesUsed: 0,
        highscore: 0,
    }
}

function update(dt) {
    stateTimer += dt;

    switch (state) {
        case S_Loading:
            if (LOADING == 0) {
                if (quickstart) {
                    clearGame(true);
                    setState(S_NextStage);
                    return;
                }
                setState(S_Menu);
            }
            break;
        case S_Menu:
        case S_Settings:
        case S_Continue:
            break;
        case S_NextStage:
            if (quickmode) timescale(5);
            let nextStageEndTime = game.level.longIntro ? 1.7 : 0.6;
            if (stateTimer >= nextStageEndTime) setState(S_Searching);
            break;
        case S_Searching: {
            let unscaledDeltaTime = dt / game.level.timescale;
            game.countdownTimer -= unscaledDeltaTime;
            let deltaTimer = game.countdownTimer - game.smoothTimer;
            game.smoothTimer += min(abs(deltaTimer), 10 * unscaledDeltaTime) * sign(deltaTimer);

            if (game.countdownTimer < 0) {
                setState(S_GameOver);
                return
            }
            game.level.heads.forEach(head => {
                if (head.onMove) head.onMove(dt);
            });
        }
            break;
        case S_Victory:
            if (stateCounter >= 1) {
                let deltaTimer = game.countdownTimer - game.smoothTimer;
                game.smoothTimer += min(abs(deltaTimer), 10 * dt) * sign(deltaTimer);
            }
            animateLevelEnd(S_NextStage);
            break;
        case S_GameOver:
            let continueCost = game.continuesUsed * 5 + 1;
            let canContinue = game.practiceMode && game.currentLevel > continueCost;
            animateLevelEnd(canContinue ? S_Continue : S_Menu);
            break;
    }
}

function animateLevelEnd(nextState) {
    if (stateTimer < 1.38333333 + stateCounter * 0.5) return;
    stateCounter++;
    if (stateCounter == 1 && nextState == S_NextStage) {
        sound_effects['time_increase'].play()
    } else if (stateCounter == 4) {
        setState(nextState);
        return;
    }
}

function draw() {
    switch (state) {
        case S_Loading:
            cls(0)
            // Draw progress bar
            const inset = 4
            rectfill(32, SCREEN_HEIGHT / 2 - 20, SCREEN_WIDTH - 64, 64, 3, 16)
            const maxBarLength = (SCREEN_WIDTH - 64 - inset * 2)

            let progress = min(LOADING + 1, TOTAL_LOADING) / TOTAL_LOADING;
            let barLength = maxBarLength * (1 - progress);
            rectfill(
                32 + inset,
                SCREEN_HEIGHT / 2 - 20 + inset,
                barLength,
                64 - inset * 2,
                0,
                16 - inset
            )
            return;
        case S_Menu:
        case S_Settings:
            cls(5);
            break;
        case S_Continue:
            image(0, 0, images.continue);
            break;
        case S_Victory:
        case S_GameOver:
            if (stateTimer < 0.833333333) cls(0);
            else cls(5);
            break;
        case S_NextStage:
        case S_Searching:
            cls(0);
            break;
    }

    push()
    const bottomRegion = path();
    bottomRegion.rect(0, SCREEN_HEIGHT, SCREEN_WIDTH, SCREEN_HEIGHT);
    clip(bottomRegion);
    drawBoard()
    pop()
    drawInfo()
}

function drawInfo() {
    switch (state) {
        case S_Menu:
            if (gameSettings.highscores.length <= 0) return;
            image(SCREEN_WIDTH / 2 - 66, 8, images.highscore);
            for (let i = 0; i < gameSettings.highscores.length; i++) {
                let text = gameSettings.highscores[i].toString();
                let x = SCREEN_WIDTH / 2 - 18 * 3;
                let y = 35 + i * 22;
                image(x, y, images.stars[1]);
                x += 18;
                image(x, y, images.stars[2]);
                x += 21 + (4 - text.length) * 15;
                for (let j = 0; j < text.length; j++) {
                    let digit = parseInt(text.charAt(j));
                    image(x, y, images.numbers[digit]);
                    x += 15;
                }
            }
            break;
        case S_NextStage: {
            push()
            const region = path();

            let time = stateTimer / 0.55;
            if (game.level.longIntro && time < 3) {
                time = 1 - abs((time % 2) - 1);
            }

            let x = lerp(-FLASHLIGHT_SIZE_SMALL, SCREEN_WIDTH / 2, clamp(time, 0, 1));
            region.arc(x, SCREEN_HEIGHT / 2, FLASHLIGHT_SIZE_SMALL, 0, TWO_PI);
            region.arc(SCREEN_WIDTH - x, SCREEN_HEIGHT / 2, FLASHLIGHT_SIZE_SMALL, 0, TWO_PI);
            clip(region);
            drawPosters();
            pop();
            drawStars();
            drawLevelText();
            break;
        }
        case S_Searching: {
            push()
            const region = path();
            region.arc(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, FLASHLIGHT_SIZE_SMALL, 0, TWO_PI);
            clip(region);
            drawPosters();
            pop();
            drawStars();
            drawTimer();
            break;
        }
        case S_Victory:
        case S_GameOver:
            if (stateTimer <= 0.85) {
                push()
                const region = path();
                let radius = lerp(FLASHLIGHT_SIZE_SMALL, FLASHLIGHT_SIZE_LARGE, stateTimer / 0.85);
                region.arc(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, radius, 0, TWO_PI);
                clip(region);
                drawPosters();
                pop();
            } else {
                drawPosters();
            }
            drawStars();
            drawTimer();
            break;
        case S_Continue:
            break;
    }
}

function drawPosters() {
    image(0, 0, images.posters[game.level.poster])
}

function drawStars() {
    let stars = game.stars;
    if (state == S_Victory) {
        stars -= 1;
    }

    let bigStars = floor(stars / 5);
    stars -= bigStars * 5;
    let smallStarDistance = 16;
    if (state == S_NextStage && stars == 0 && bigStars > 0 && stateTimer < 0.5) {
        bigStars -= 1;
        stars += 5;
        smallStarDistance = lerp(16, -1, stateTimer / 0.5);
    }

    let stack = []

    let starY = SCREEN_HEIGHT - 38;
    if (bigStars > 0) {
        let starText = (bigStars * 5).toString();

        let startX = SCREEN_WIDTH - 30 + 9 - starText.length * 4;
        let startY = SCREEN_HEIGHT - 38 + 4;
        for (let i = 0; i < starText.length; i++) {
            let digit = parseInt(starText.charAt(i));
            stack.push([startX + i * 8, startY, images.numbers[10 + digit]]);
        }

        stack.push([SCREEN_WIDTH - 30, starY, images.stars[0]]);
        starY -= smallStarDistance;
    }

    if (state == S_Victory && (stateCounter % 2) == 1) stars += 1;

    for (let i = 0; i < stars; i++) {
        stack.push([SCREEN_WIDTH - 30, starY, images.stars[1]]);
        starY -= smallStarDistance;
    }

    for (let i = stack.length - 1; i >= 0; i--) {
        let val = stack[i];
        image(val[0], val[1], val[2]);
    }
}

function drawLevelText() {
    let text = game.currentLevel.toString();
    let totalLength = text.length + 6;
    let centerX = SCREEN_WIDTH / 2;
    let y = SCREEN_HEIGHT - 14 * 2;
    let x = centerX - totalLength * 7;

    image(x, y, images.level);
    x += 14 * 6;

    for (let i = 0; i < text.length; i++) {
        let digit = parseInt(text.charAt(i));
        image(x, y, images.numbers[digit]);
        x += 14;
    }
}

function drawTimer() {
    let centerX = SCREEN_WIDTH / 2;
    let y = 23;

    image(centerX - 16, y - 12, images.time);
    let text = floor(clamp(game.smoothTimer, 0, 50)).toString();

    let startX = centerX - text.length * 16;
    for (var i = 0; i < text.length; i++) {
        let x = startX + 32 * i;
        let digit = parseInt(text.charAt(i));
        image(x, y, images.timer[digit])
    }
}

function drawBoard() {
    switch (state) {
        case S_Menu:
            for (let i = 0; i < button_positions.length; i++) {
                let pos = button_positions[i];
                image(pos.x, pos.y, images.menu_buttons[i]);
            }
            break;
        case S_Settings:
            for (let i = 0; i < button_positions.length; i++) {
                let pos = button_positions[i];
                let index = i * 2;
                switch (i) {
                    case 0:
                        if (gameSettings.pixelart) index++;
                        break;
                    case 1:
                        if (gameSettings.canvasColors) index++;
                        break;
                }
                image(pos.x, pos.y, images.settings_buttons[index]);
            }
            break;
        case S_NextStage:
            break;
        case S_Searching:
            game.level.heads.forEach(head => {
                let pos = head.getPosition ? head.getPosition(stateTimer) : head;

                let x = floor(pos.x - HEAD_CENTER);
                let y = floor(pos.y - HEAD_CENTER + SCREEN_HEIGHT);
                image(x, y, images.heads[head.sprite])
            });
            break;
        case S_Victory:
        case S_GameOver:
            let head = game.level.targetHead;

            let x = floor(head.x - HEAD_CENTER);
            let y = floor(head.y - HEAD_CENTER + SCREEN_HEIGHT);
            image(x, y, images.heads[head.sprite]);
            break;
        case S_Continue:
            break;
    }
}

function tap(x, y, tapId) {
    if (x < 0 || x >= SCREEN_WIDTH || y < SCREEN_HEIGHT || y >= SCREEN_HEIGHT * 2) return;

    switch (state) {
        case S_Menu:
            for (let i = 0; i < button_positions.length; i++) {
                let pos = button_positions[i];
                if (x < pos.x - 2 || x >= pos.x + 130 || y < pos.y - 2 || y >= pos.y + 40) continue;
                switch (i) {
                    case 0:
                        clearGame(true);
                        setState(S_NextStage);
                        return;
                    case 1:
                        clearGame(true);
                        game.practiceMode = true;
                        setState(S_NextStage);
                        return;
                    case 2:
                        setState(S_Settings);
                        return;
                }
            }
            break;
        case S_Settings:
            for (let i = 0; i < button_positions.length; i++) {
                let pos = button_positions[i];
                if (x < pos.x - 2 || x >= pos.x + 130 || y < pos.y - 2 || y >= pos.y + 40) continue;
                switch (i) {
                    case 0:
                        gameSettings.pixelart = !gameSettings.pixelart;
                        localStorage.setItem("settings", JSON.stringify(gameSettings));
                        // Restart browser to apply changes
                        location.reload();
                        return;
                    case 1:
                        images = images == images_original ? images_converted : images_original;
                        gameSettings.canvasColors = images == images_converted;
                        localStorage.setItem("settings", JSON.stringify(gameSettings));
                        return;
                    case 2:
                        setState(S_Menu);
                        return;
                }
            }
        case S_Continue:
            if (y >= 243 && y <= 286) {
                let continueCost = 5 * game.continuesUsed + 1;
                game.continuesUsed++;
                game.currentLevel -= continueCost;
                game.stars = 0;
                game.countdownTimer = 10.9;
                game.smoothTimer = 10.9;
                setState(S_NextStage);
            } else if (y >= 291 && y <= 334) {
                setState(S_Menu);
            }
            break;
        case S_Searching:
            y -= SCREEN_HEIGHT;

            let tappedHead = findTappedHead(x, y);

            if (tappedHead == -1) return;
            if (tappedHead == -2 || game.level.heads[tappedHead].isTarget) {
                playHeadSound(game.level.lookingFor, true);
                game.countdownTimer += 5;
                game.countdownTimer = clamp(game.countdownTimer, 0, 50.99);
                if (quickmode) {
                    game.stars++;
                    setState(S_NextStage);
                }
                else setState(S_Victory);
            } else if (tappedHead >= 0) {
                playHeadSound(game.level.lookingFor, false);
                sound_effects['incorrect'].play()
                game.countdownTimer -= 10;
                game.smoothTimer -= 10;
                game.level.heads.splice(tappedHead, 1);
            }
            return;
    }
}

function findTappedHead(x, y) {
    let shortestDistance = MAX_CLICK_DISTANCE_SQ;
    let closest = -1;

    {
        let head = game.level.targetHead;
        let pos = head.getPosition ? head.getPosition(stateTimer) : head;
        let dx = x - pos.x;
        let dy = y - pos.y;
        let dist = dx * dx + dy * dy
        if (dist <= shortestDistance) {
            return -2;
        }
    }

    for (let i = game.level.heads.length - 1; i >= 0; i--) {
        let head = game.level.heads[i];
        let pos = head.getPosition ? head.getPosition(stateTimer) : head;
        let dx = x - pos.x;
        let dy = y - pos.y;
        let dist = dx * dx + dy * dy;
        if (dist < shortestDistance) {
            closest = i;
            shortestDistance = dist;
        }
    }
    return closest;
}

function setState(newState) {
    let oldStateTimer = stateTimer;
    let oldStateCounter = stateCounter;

    state = newState;
    stateTimer = 0;
    stateCounter = 0;

    timescale(1);

    switch (newState) {
        case S_Loading:
        case S_Menu:
        case S_Settings:
            document.title = "Find Luigi"
            if (game.highscore > 0 && gameSettings.highscores[0] == game.highscore) {
                sound_effects['highscore'].play();
            }
            clearGame(false);
            break;
        case S_Searching:
            document.title = "Find Luigi - Level " + game.currentLevel;
            timescale(game.level.timescale);
            break;
        case S_NextStage:
            if (!bgm.playing()) {
                bgm.volume(1.0);
                bgm.play();
            }
            game.currentLevel++;
            let levelIndex = game.currentLevel - 1;
            if (levelIndex >= game.levelGenerators.length) {
                throw "LevelIndex " + levelIndex + " is out of bounds for array 0->" + game.levelGenerators.length;
            }
            game.level = game.levelGenerators[levelIndex]();
            document.title = "Find Luigi - Level " + game.currentLevel;
            let soundName = game.level.longIntro && !quickmode ? 'drumroll_long' : 'drumroll_short';
            sound_effects[soundName].play()
            break;
        case S_GameOver:
            bgm.fade(1.0, 0.0, 1000);
            game.highscore = max(game.highscore, game.stars);
            gameSettings.highscores.push(game.stars);
            gameSettings.highscores.sort((a, b) => b - a);
            gameSettings.highscores = gameSettings.highscores.slice(0, 6);
            localStorage.setItem("settings", JSON.stringify(gameSettings));
            sound_effects['miniover'].play();
        // fallthrough
        case S_Victory:
            if (newState == S_Victory) {
                sound_effects['correct'].play();
                game.stars++;
            }
            game.level.heads.forEach(head => {
                if (head.getPosition) {
                    pos = head.getPosition(oldStateTimer);
                    head.x = pos.x;
                    head.y = pos.y;
                }
            });
            break;
        case S_Continue:
            break;
    }
}

function playHeadSound(head, wasCaught) {
    let sounds = sound_effects[HEAD_ORDER[head]][wasCaught ? 'fail' : 'win'];
    let sound = sounds[randi(0, sounds.length - 1)];
    sound.play();
}



function preGenerateLevels() {
    // Args: Level, Hardmode
    const startGenerators = [
        generateBasicGroup,
        generateDirectionalGroup,
        generateWheelGroup,
    ];
    const advancedGenerators = [
        generateLineGroup,
        generateBouncyWaveGroup,
        generateEdgeGroup,
        generateCircleGroup,
    ];
    shuffle(startGenerators, 1);
    shuffle(advancedGenerators, 1);

    const speedyGenerators = [
        generateBasicSpeedyGroup,
        generateSecondSpeedyGroup,
        generateCircleSpeedyGroup,
    ]
    shuffle(speedyGenerators);

    const visualGenerators = [
        generateVisualGroup1,
        generateVisualGroup2,
    ]


    function generateBasic(advanced, hardMode) {
        let generators = advanced ? advancedGenerators : startGenerators;

        var array = new Array(generators.length * 10);
        for (var i = 0; i < generators.length; i++) {
            let cI = i;
            for (var j = 0; j < 10; j++) {
                let cJ = j;
                array[i * 10 + j] = () => {
                    let level = generators[cI](cJ, hardMode);
                    level.longIntro = cJ == 0;
                    return level;
                }
            }
        }
        return array;
    }

    function generateRotated(advanced) {
        let generators = advanced ? advancedGenerators : startGenerators;

        var array = new Array(generators.length * 10);
        for (var i = 0; i < generators.length; i++) {
            let cI = i;
            for (var j = 0; j < 10; j++) {
                let cJ = j;
                array[i * 10 + j] = () => {
                    let level = generators[cI](cJ, false);
                    level.heads.forEach(head => head.sprite = head.sprite + randi(0, 3) * 4);
                    level.timescale = 1.15;
                    level.longIntro = cJ == 0;
                    return level;
                }
            }
        }
        return array;
    }

    function generateOutlines() {
        var array = new Array(visualGenerators.length * 10);
        for (var i = 0; i < visualGenerators.length; i++) {
            let cI = i;
            for (var j = 0; j < 10; j++) {
                let cJ = j;
                array[i * 10 + j] = () => {
                    let level = visualGenerators[cI](cJ, false);
                    level.heads.forEach(head => head.sprite = head.sprite + 4 * 4);
                    level.longIntro = cJ == 0;
                    return level;
                }
            }
        }
        return array;
    }

    function generateSpeedup(timescale, hardMode) {
        var array = new Array(speedyGenerators.length * 10);
        for (var i = 0; i < speedyGenerators.length; i++) {
            let cI = i;
            for (var j = 0; j < 10; j++) {
                let cJ = j;
                array[i * 10 + j] = () => {
                    let level = speedyGenerators[cI](cJ, hardMode);
                    level.timescale = timescale;
                    level.longIntro = cJ == 0;
                    return level;
                }
            }
        }
        return array;
    }

    const fixedEasy = [
        generateBasic(false, false),
        generateBasic(true, false),
        generateRotated(false),
    ];

    const fixedMedium = [
        generateBasic(false, true),
        generateBasic(true, true),
        generateRotated(true),
        generateSpeedup(1.5, false),
        generateOutlines(false),
    ]

    const fixedHard = [
        generateSpeedup(2.5, false),
        generateOutlines(true),
    ]

    shuffle(fixedEasy, 1);
    shuffle(fixedMedium);
    shuffle(fixedHard);

    const randomEasy = fixedEasy.flat();
    const randomMedium = randomEasy.concat(fixedMedium.flat());
    const randomHard = randomMedium.concat(fixedHard);
    shuffle(randomEasy);
    shuffle(randomMedium);
    shuffle(randomHard);

    const splitEasy = splitArray(randomEasy, 10);
    const splitMedium = splitArray(randomEasy, 10);

    let part2 = fixedMedium.concat(splitEasy);
    shuffle(part2, 1);

    let part3 = fixedHard.concat(splitMedium);
    shuffle(part3, 1);

    let overgroups = fixedEasy.concat(
        fixedEasy,
        part2,
        part3,
        part3
    );

    let levelsAtGroup = [];
    let totalLevels = 0;
    for (var i = 0; i < overgroups.length; i++) {
        levelsAtGroup.push(totalLevels);
        totalLevels += overgroups[i].length;
    }
    console.log(totalLevels);

    levelGenerators = new Array(totalLevels);
    let levelIndex = 0;
    for (var i = 0; i < overgroups.length; i++) {
        for (var j = 0; j < overgroups[i].length; j++) {
            levelGenerators[levelIndex] = overgroups[i][j];
            levelIndex++;
        }
    }

    shuffle(levelGenerators, levelsAtGroup[levelsAtGroup.length - 1]);

    return levelGenerators;
}

function splitArray(array, splitSize) {
    const count = Math.ceil(array.length / splitSize);
    const result = new Array(count);

    for (let i = 0; i < count; i++) {
        result[i] = array.slice(i * splitSize, (i + 1) * splitSize);
    }

    return result;
}

// Level group generators
// -- Regular

function generateBasicGroup(level, hardMode) {
    if (hardMode) {
        switch (level) {
            case 0:
            case 1:
            case 2:
                return generateSquare(8, 7, 1);
            case 3:
                return generateFill(100, true);
            case 4:
                return generateFill(120, true);
            case 5: {
                let sq = generateSquare(8, 7);
                setVerticalMovement(sq, -48, 48);
                return sq;
            }
            case 9: {
                let sq = generateSquare(8, 1);
                sq.heads.forEach(h => h.y = -12);
                return sq;
            }
            default:
                return generateFill(140);
        }
    } else {
        switch (level) {
            case 0:
                return generate2x2();
            case 1:
                return generateSquare(4, 4);
            case 2:
                return generateSquare(8, 6);
            case 3:
                return generateFill(80, true);
            case 4:
                return generateFill(100, true);
            case 5: {
                let sq = generateSquare(8, 6);
                setVerticalMovement(sq, -48, 48);
                return sq;
            }
            case 9: {
                let sq = generateSquare(8, 1);
                sq.heads.forEach(h => h.y = -4);
                return sq;
            }
            default:
                return generateFill(120);
        }
    }
}

function generateDirectionalGroup(level, hardMode) {
    let fill =
        level == 9 ?
            generateFill(hardMode ? 120 : 100) :
            generateFill(hardMode ? 140 : 120);
    switch (level % 3) {
        case 1:
            setVerticalMovementPerType(fill, -48, 48);
            setPerTypeOffset(fill, 16, 4, 0);
            break;
        case 2:
            setPerTypeMovement(fill, 32);
            setPerTypeOffset(fill, 8, 0.2, 0);
            break;
    }
    return fill;
}

function generateWheelGroup(level, hardMode) {
    let center = [SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2];
    let centerCount = hardMode ? 20 : 12;

    let maxSpeed = 64;

    if (level == 0) {
        return generateWheels([hardMode ? 32 : 16], [72], [center], maxSpeed);
    }

    let offset = 64;
    let x0 = center[0] - offset;
    let y0 = center[1] - offset;

    let tl = [x0, y0];
    let tr = [x0 + offset * 2, y0];
    let bl = [x0, y0 + offset * 2];
    let br = [x0 + offset * 2, y0 + offset * 2];

    let outerCount = hardMode ? 8 : 4;

    let hypo = sqrt(offset * offset * 2);
    let leftMost = [center[0] - hypo, center[1]];
    let rightMost = [center[0] + hypo, center[1]];

    switch ((level - 1) % 3) {
        case 0:
            return generateWheels([centerCount, outerCount, outerCount, outerCount, outerCount], [64, 24, 24, 24, 24], [center, tl, tr, bl, br], maxSpeed, level < 5);
        case 1:
            return generateWheels([centerCount - 2, outerCount - 2, outerCount - 2, outerCount - 2, outerCount - 2, outerCount - 2, outerCount - 2], [36, 18, 18, 18, 18, 18, 18], [center, tl, tr, bl, br, leftMost, rightMost], 0);
        case 2: {
            let level = hardMode ? generateSquare(9, 7, null, 1 + 1 / 18) : generateSquare(5, 4, null, 2);
            setDirectionMovement(level, 32, -45, [40, 40, 16, 16]);
            setSquareOffset(level, 32, 0.25, 45);
            return level;
        }
    }
}

function generateLineGroup(level, hardMode) {
    if (level === 0) return generateHiddenLine(64, 17, hardMode ? 8 : 0);
    let fill = generateFill(hardMode ? 200 : 120, false, hardMode);
    switch ((level - 1) % 3) {
        case 0:
            setVerticalMovementPerType(fill, -96, 96);
            setPerTypeOffset(fill, 16, 4, 0);
            break;
        case 1:
            return generateHiddenLine(64, hardMode ? 16 : 12, 8);
        case 2:
            setVerticalMovement(fill, -96, 96);
            setPerTypeOffset(fill, 16, 4, 0);
            break;
    }
    return fill;
}

function generateBouncyWaveGroup(level, hardMode) {
    switch (level % 3) {
        case 0: {
            let fill = generateFill(200, false, true, 0, 0, hardMode ? [1, 3] : [0, 2]);
            setBouncyMovement(fill, 32);
            setCircularOffset(fill, 32, 0.2);
            return fill;
        }
        case 1: {
            let fill = generateFill(hardMode ? 252 : 200, false, false, 2, 2);
            fill.heads.forEach(h => h.onMove = (dt) => {
                h.x += 32 * dt;
                h.y += 32 * dt;
                if (h.y > SCREEN_HEIGHT + 40) h.y -= SCREEN_HEIGHT + 80;
                if (h.x > SCREEN_WIDTH + 40) h.x -= SCREEN_WIDTH + 80;
            });
            setPerTypeOffset(fill, 8, 4, 45);
            return fill;
        }
        case 2:
            return generateFill(hardMode ? 252 : 140);
    }
}

function generateEdgeGroup(level, hardMode) {
    switch (level % 4) {
        case 0: {
            let distance = hardMode ? 13 : 8;
            let sq = generateSquare(8, 2);
            sq.heads.forEach(h => h.y = h.y < SCREEN_HEIGHT / 2 ? -distance : SCREEN_HEIGHT + distance);
            return sq;
        }
        case 1: {
            let fill = generateFill(140, false, false, 0, 0, hardMode ? [1, 3] : [0, 2]);
            setBouncyMovement(fill, 64);
            return fill;
        }
        case 2: {
            let distance = hardMode ? 10 : 8;
            let sq = generateSquare(2, 6);
            sq.heads.forEach(h => h.x = h.x < SCREEN_WIDTH / 2 ? -distance : SCREEN_WIDTH + distance);
            return sq;
        }
        case 3: {
            let fill = generateFill(200, false, true, 0, 0, hardMode ? [1, 3] : [0, 2]);
            setBouncyMovement(fill, 64);
            return fill;
        }
    }
}

function generateCircleGroup(level, hardMode) {
    if (level == 4) {
        if (hardMode) {
            return generateFill(140);
        }
        return generateSquare(8, 7);
    } else if (level == 9) {
        return generateFill(hardMode ? 252 : 120, false, false, 0, 0, [1]);
    }

    if (hardMode) {
        if (level % 2 == 0) {
            return generateCircles([4, 6, 8, 10, 16], [20, 40, 60, 80, 100], 150, level < 5);
        }
        return generateCircles2([8, 12, 16], [30, 60, 90], 150, level < 5);
    }
    if (level % 2 == 0) {
        return generateCircles([6, 10, 16], [30, 60, 90], 150, level < 5);
    }
    return generateCircles2([4, 8, 12], [30, 60, 90], 150, level < 5);
}


// -- Speedy
function generateBasicSpeedyGroup(level) {
    let fill = generateFill(level < 5 ? 100 : 120);
    switch (level % 5) {
        case 0:
            let sq = generateSquare(8, 6);
            setVerticalMovement(sq, -48, 48);
            return sq
        case 1:
            setVerticalMovementPerType(fill, -48, 48);
            setPerTypeOffset(fill, 16, 4, 0);
            return fill;
        case 2:
            let fill2 = generateFill(100);
            setPerTypeMovement(fill2, 32);
            setPerTypeOffset(fill2, 8, 0.2, 0);
            return fill2;
        case 3:
            setVerticalMovementPerType(fill, -96, 96);
            setPerTypeOffset(fill, 16, 4, 0);
            return fill;
        case 4:
            setVerticalMovement(fill, -96, 96);
            setPerTypeOffset(fill, 16, 4, 0);
            return fill;
    }
}


function generateSecondSpeedyGroup(level) {
    switch (level % 3) {
        case 0: {
            let fill = generateFill(140, false, false, 0, 0, [0, 2]);
            setBouncyMovement(fill, 64);
            return fill;
        }
        case 1: {
            let fill = generateFill(200, false, false, 2, 2);
            fill.heads.forEach(h => h.onMove = (dt) => {
                h.x += 32 * dt;
                h.y += 32 * dt;
                if (h.y > SCREEN_HEIGHT + 40) h.y -= SCREEN_HEIGHT + 80;
                if (h.x > SCREEN_WIDTH + 40) h.x -= SCREEN_WIDTH + 80;
            });
            setPerTypeOffset(fill, 8, 4, 45);
            return fill;
        }
        case 2: {
            let fill = generateFill(200, false, true, 0, 0, [0, 2]);
            setBouncyMovement(fill, 32);
            setCircularOffset(fill, 32, 0.2);
            return fill;
        }
    }
}

function generateCircleSpeedyGroup(level) {
    let center = [SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2];
    let centerCount = 12;

    let maxSpeed = 64;

    if (level == 0) {
        return generateWheels([16], [72], [center], maxSpeed);
    } else if (level == 9) {
        return generateCircles2([8, 12, 16], [30, 60, 90], 150, false);
    }

    let offset = 64;
    let x0 = center[0] - offset;
    let y0 = center[1] - offset;

    let tl = [x0, y0];
    let tr = [x0 + offset * 2, y0];
    let bl = [x0, y0 + offset * 2];
    let br = [x0 + offset * 2, y0 + offset * 2];

    let outerCount = 4;

    switch (level % 4) {
        case 0:
            return generateWheels([centerCount, outerCount, outerCount, outerCount, outerCount], [64, 24, 24, 24, 24], [center, tl, tr, bl, br], maxSpeed, level < 5);
        case 1:
            return generateCircles2([4, 8, 12], [30, 60, 90], 150, level < 5);
        case 2: {
            let level = generateSquare(5, 4, null, 2);
            setDirectionMovement(level, 32, -45, [40, 40, 16, 16]);
            setSquareOffset(level, 32, 0.25, 45);
            return level;
        }
        case 3: {
            return generateCircles([6, 10, 16], [30, 60, 90], 150, level < 5);
        }
    }
}

// -- Visual
function generateVisualGroup1(level, hardMode) {
    let distance = hardMode ? 8 : 4;
    let majorSquare = hardMode ?
        generateSquare(9, 7, 3 - floor(level / 2), 0.75) :
        generateSquare(8, 6);

    switch (level) {
        case 0:
            return hardMode ?
                generateSquare(4, 4, null, spacingMultiplier = 1.5) :
                generate2x2();
        case 1:
            return hardMode ?
                majorSquare :
                generateSquare(4, 4);
        case 2:
        case 4:
        case 6:
            return majorSquare;
        case 3:
        case 5:
        case 7: {
            setVerticalMovement(majorSquare, -48, 48);
            return majorSquare;
        }
        case 8: {
            let sq = generateSquare(8, 1);
            sq.heads.forEach(h => h.y = -distance);
            return sq;
        }
        case 9: {
            let sq = generateSquare(8, 2);
            sq.heads.forEach(h => h.y = h.y < SCREEN_HEIGHT / 2 ? -distance : SCREEN_HEIGHT + distance);
            return sq;
        }
    }
}


function generateVisualGroup2(level, hardMode) {
    switch (level % 5) {
        case 0:
            let center = [SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2];
            let maxSpeed = 64;
            return generateWheels([hardMode ? 20 : 16], [72], [center], maxSpeed);
        case 1:
            let lvl = hardMode ? generateSquare(9, 7, null, 1 + 1 / 18) : generateSquare(5, 4, null, 2);
            setDirectionMovement(lvl, 32, -45, [40, 40, 16, 16]);
            setSquareOffset(lvl, 32, 0.25, 45);
            return lvl;
        case 2:
            let fill = generateFill(hardMode ? 80 : 40);
            setVerticalMovementPerType(fill, -48, 48);
            setPerTypeOffset(fill, 16, 4, 0);
            return fill;
        case 3: {
            let counts = hardMode ? [6, 10, 16] : [3, 5, 8];
            return generateCircles(counts, [30, 60, 90], 150, 20, level < 5);
        }
        case 4: {
            let counts = hardMode ? [4, 8, 12] : [2, 4, 4];
            return generateCircles2(counts, [30, 60, 90], 150, 20, level < 5, true);
        }
    }
}

// Level generators
function levelTemplate() {
    return {
        heads: [],
        longIntro: false,
        timescale: 1,
    };
}

function generate2x2() {
    let level = levelTemplate();
    level.lookingFor = randi(0, 3);
    level.poster = level.lookingFor;

    let order = [0, 1, 2, 3];
    shuffle(order);

    for (let i = 0; i < 4; i++) {
        let head = {
            x: SCREEN_WIDTH / 2 - 32 * (i % 2) + 16,
            y: SCREEN_HEIGHT / 2 - 32 * floor(i / 2) + 16,
            sprite: order[i],
            isTarget: order[i] == level.lookingFor,
        };
        level.heads.push(head);
        if (head.isTarget) {
            level.targetHead = head;
        }
    }

    return level;
}

function generateSquare(width, height, forceLookingFor = null, spacingMultiplier = 1) {
    let level = levelTemplate();
    if (forceLookingFor != null) {
        level.lookingFor = forceLookingFor;
    } else {
        level.lookingFor = randi(0, 3);
    }
    level.poster = level.lookingFor;

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let head = {
                x: SCREEN_WIDTH / 2 + (- width * 16 + x * 32 + 16) * spacingMultiplier,
                y: SCREEN_HEIGHT / 2 + (- height * 16 + y * 32 + 16) * spacingMultiplier,
                sprite: (randi(1, 3) + level.lookingFor) % 4,
                isTarget: false,
            };
            level.heads.push(head);
        }
    }

    let targetIndex = randi(0, level.heads.length - 1);
    level.targetHead = level.heads[targetIndex];
    level.targetHead.isTarget = true;
    level.targetHead.sprite = level.lookingFor;

    return level;
}

function generateFill(count, forceTop = false, diagonals = false, overFillX = 0, overFillY = 0, allowedLookingFor = [0, 1, 2, 3]) {
    let level = levelTemplate();
    level.lookingFor = allowedLookingFor[randi(0, allowedLookingFor.length - 1)];
    level.poster = level.lookingFor;

    let yStart = -overFillY;
    let yEnd = 10 + overFillY;
    let xStart = -overFillX;
    let xEnd = 14 + overFillX;

    const xPadding = 8;
    const yPadding = 8;
    let legalPositions = [];
    for (let xi = xStart; xi < xEnd; xi++) {
        let x = xi * (SCREEN_WIDTH - xPadding * 2) / 13 + xPadding;
        for (let yi = yStart; yi < yEnd; yi++) {
            let y = yi * (SCREEN_HEIGHT - yPadding * 2) / 9 + yPadding;
            legalPositions.push({ x, y });
            if (diagonals) {
                legalPositions.push({ x: x + 16, y: y + 16 });
            }
        }
    }

    shuffle(legalPositions);
    if (count > legalPositions.length) {
        console.log("Requested too many heads, " + count + " > " + legalPositions.length);
        count = legalPositions.length;
    }

    for (let i = 0; i < count; i++) {
        let pos = legalPositions.pop();
        let head = {
            x: pos.x + randi(-2, 2),
            y: pos.y + randi(-1, 1),
            sprite: (randi(1, 3) + level.lookingFor) % 4,
            isTarget: false,
        };
        level.heads.push(head);
    }

    let targetIndex = forceTop ? level.heads.length - 1 : randi(0, floor(level.heads.length / 4));
    level.targetHead = level.heads[targetIndex];
    level.targetHead.isTarget = true;
    level.targetHead.sprite = level.lookingFor;

    return level;
}

function generateHiddenLine(speed, tightness, variance) {
    let level = levelTemplate();
    level.lookingFor = randi(0, 3);
    level.poster = level.lookingFor;

    // Luigi needs a little more spacing
    let outerCount = level.lookingFor == 1 ? 20 : 24;

    const xPadding = -32;
    const yPadding = 48 + tightness;
    let outer = [];
    let inner = [];
    for (let yi = 0; yi < 5; yi++) {
        let y = yi * (SCREEN_HEIGHT - yPadding * 2) / 4 + yPadding;
        let inRow = yi % 2 == 0 ? outerCount : 8;
        for (let xi = 0; xi < inRow; xi++) {
            let x = xi * (SCREEN_WIDTH - xPadding * 2) / inRow + xPadding;
            if (yi % 2 == 0) outer.push({ x, y });
            else inner.push({ x, y });
        }
    }

    shuffle(inner);
    shuffle(outer);
    let legalPositions = inner.concat(outer);
    for (let i = 0; i < legalPositions.length; i++) {
        let direction = i < inner.length ? 1 : -1;
        let pos = legalPositions[i];
        let y = pos.y;
        if (i < inner.length && variance > 0) {
            y += randi(-variance, variance);
        }

        let head = {
            x: pos.x + randi(-2, 2),
            y: y,
            sprite: (randi(1, 3) + level.lookingFor) % 4,
            isTarget: false,
            onMove: (dt) => {
                head.x += speed * dt * direction;
                if (head.x < -32) head.x += SCREEN_WIDTH + 64;
                if (head.x >= SCREEN_WIDTH + 32) head.x -= SCREEN_WIDTH + 64;
            },
        };
        level.heads.push(head);
    }

    let targetIndex = randi(0, inner.length - 1);
    level.targetHead = level.heads[targetIndex];
    level.targetHead.isTarget = true;
    level.targetHead.sprite = level.lookingFor;

    return level;
}

function generateWheels(countPerCircles, radiuses, centers, maxSpeed, reverse = false) {
    let level = levelTemplate();
    level.lookingFor = randi(0, 3);
    level.poster = level.lookingFor;

    for (let circleIndex = 0; circleIndex < radiuses.length; circleIndex++) {
        let radius = radiuses[circleIndex];
        let countPerCircle = countPerCircles[circleIndex];
        let radiusSpeed = maxSpeed / (radius * 2);
        let pos = centers[circleIndex];

        let speed = rand(radiusSpeed / 2, radiusSpeed);
        if (reverse) speed = -speed
        for (var j = 0; j < countPerCircle; j++) {
            let offset = (j / countPerCircle) * TWO_PI;
            let head = {
                x: pos[0],
                y: pos[1],
                sprite: (randi(1, 3) + level.lookingFor) % 4,
                isTarget: false,
                getPosition: (stateTimer) => {
                    let t = offset + stateTimer * speed;
                    let dx = cos(t) * radius;
                    let dy = sin(t) * radius;
                    return { x: head.x + dx, y: head.y + dy };
                },
            };
            level.heads.push(head);
        }
    }
    shuffle(level.heads);

    level.targetHead = level.heads[0];
    level.targetHead.isTarget = true;
    level.targetHead.sprite = level.lookingFor;

    return level;
}

function generateCircles(countPerCircles, radiuses, maxSpeed, reverse) {
    let level = levelTemplate();
    level.lookingFor = randi(0, 3);
    level.poster = level.lookingFor;

    let x = SCREEN_WIDTH / 2;
    let y = SCREEN_HEIGHT / 2;

    {
        let radiusIndex = randi(0, radiuses.length - 1);
        let radius = radiuses[radiusIndex];
        let countPerCircle = countPerCircles[radiusIndex];

        let speed = maxSpeed / (radius * 2);
        speed = rand(-speed, 0);
        if (reverse) speed = -speed

        let offset = (randi(1, countPerCircle) / countPerCircle) * TWO_PI;
        let head = {
            x: x,
            y: y,
            sprite: level.lookingFor,
            isTarget: true,
            getPosition: (stateTimer) => {
                let t = offset + stateTimer * speed;
                let dx = cos(t) * radius;
                let dy = sin(t) * radius;
                return { x: head.x + dx, y: head.y + dy };
            },
        };
        level.targetHead = head;
        level.heads.push(head);
    }

    for (let radiusIndex = 0; radiusIndex < radiuses.length; radiusIndex++) {
        let radius = radiuses[radiusIndex];
        let countPerCircle = countPerCircles[radiusIndex];
        let radiusSpeed = maxSpeed / (radius * 2);
        for (let i = 0; i < 4; i++) {
            if (i == level.lookingFor) continue;
            let speed = rand(radiusSpeed / 2, radiusSpeed);
            if (reverse) speed = -speed
            for (var j = 0; j < countPerCircle; j++) {
                let offset = ((i / 4 + j) / countPerCircle) * TWO_PI;
                let head = {
                    x: x,
                    y: y,
                    sprite: i,
                    isTarget: false,
                    getPosition: (stateTimer) => {
                        let t = offset + stateTimer * speed;
                        let dx = cos(t) * radius;
                        let dy = sin(t) * radius;
                        return { x: head.x + dx, y: head.y + dy };
                    },
                };
                level.heads.push(head);
            }
        }
    }

    shuffle(level.heads, 1);

    return level;
}

function generateCircles2(countPerCircles, radiuses, maxSpeed, reverse, onTop = false) {
    let level = levelTemplate();
    level.lookingFor = randi(0, 3);
    level.poster = level.lookingFor;

    let x = SCREEN_WIDTH / 2;
    let y = SCREEN_HEIGHT / 2;

    let waveSpeeds = [0, 0.5, 1, 2]
    shuffle(waveSpeeds);

    if (!onTop) {
        let radiusIndex = randi(0, radiuses.length - 1);
        let radius = radiuses[radiusIndex];
        let countPerCircle = countPerCircles[radiusIndex];

        let speed = maxSpeed / (radius * 2);
        speed = rand(speed / 2, speed);
        if (reverse) speed = -speed

        let offset = (randi(1, countPerCircle) / countPerCircle) * TWO_PI;
        let head = {
            x: x,
            y: y,
            sprite: level.lookingFor,
            isTarget: true,
            getPosition: (stateTimer) => {
                let t = offset + stateTimer * speed;
                let actualRadius = sin(stateTimer * waveSpeeds[level.lookingFor]) + radius
                let dx = cos(t) * actualRadius;
                let dy = sin(t) * actualRadius;
                return { x: head.x + dx, y: head.y + dy };
            },
        };
        level.targetHead = head;
        level.heads.push(head);
    }

    for (let radiusIndex = 0; radiusIndex < radiuses.length; radiusIndex++) {
        let radius = radiuses[radiusIndex];
        let countPerCircle = countPerCircles[radiusIndex];
        let radiusSpeed = maxSpeed / (radius * 2);
        for (let i = 0; i < 4; i++) {
            if (i == level.lookingFor) continue;
            let speed = rand(radiusSpeed / 2, radiusSpeed);
            if (reverse) speed = -speed
            for (var j = 0; j < countPerCircle; j++) {
                let offset = ((i / 4 + j) / countPerCircle) * TWO_PI;
                let head = {
                    x: x,
                    y: y,
                    sprite: i,
                    isTarget: false,
                    getPosition: (stateTimer) => {
                        let t = offset + stateTimer * speed;
                        let actualRadius = sin(stateTimer * waveSpeeds[i]) * 32 + radius
                        let dx = cos(t) * actualRadius;
                        let dy = sin(t) * actualRadius;
                        return { x: head.x + dx, y: head.y + dy };
                    },
                };
                level.heads.push(head);
            }
        }
    }

    shuffle(level.heads, 1);

    if (onTop) {
        let radiusIndex = randi(0, radiuses.length - 1);
        let radius = radiuses[radiusIndex];
        let countPerCircle = countPerCircles[radiusIndex];

        let speed = maxSpeed / (radius * 2);
        speed = rand(speed / 2, speed);
        if (reverse) speed = -speed

        let offset = (randi(1, countPerCircle) / countPerCircle) * TWO_PI;
        let head = {
            x: x,
            y: y,
            sprite: level.lookingFor,
            isTarget: true,
            getPosition: (stateTimer) => {
                let t = offset + stateTimer * speed;
                let actualRadius = sin(stateTimer * waveSpeeds[level.lookingFor]) + radius
                let dx = cos(t) * actualRadius;
                let dy = sin(t) * actualRadius;
                return { x: head.x + dx, y: head.y + dy };
            },
        };
        level.targetHead = head;
        level.heads.push(head);
    }


    return level;
}

// Level overwrites

function setVerticalMovement(level, upSpeed, downSpeed, padding = 16) {
    let wrapHeight = SCREEN_HEIGHT + padding;
    let wrapLowth = -padding;

    let columns = [];
    for (let i = 0; i < SCREEN_WIDTH / 16; i++) {
        columns.push(randi(0, 1) == 0 ? upSpeed : downSpeed);
    }

    level.heads.forEach(head => {
        head.onMove = (dt) => {
            let speed = columns[floor(head.x / 16) % columns.length];
            head.y += speed * dt;
            if (head.y < wrapLowth) head.y += wrapHeight - wrapLowth;
            if (head.y >= wrapHeight) head.y -= wrapHeight - wrapLowth;
        }
    });
}

function setVerticalMovementPerType(level, upSpeed, downSpeed) {
    let wrapHeight = SCREEN_HEIGHT + 16;
    let wrapLowth = -16;

    let headSpeeds = [];
    for (let i = 0; i < 4; i++) {
        headSpeeds.push(randi(0, 1) == 0 ? upSpeed : downSpeed);
    }

    level.heads.forEach(head => {
        head.onMove = (dt) => {
            let speed = headSpeeds[head.sprite % 4];
            head.y += speed * dt;
            if (head.y < wrapLowth) head.y += wrapHeight - wrapLowth;
            if (head.y >= wrapHeight) head.y -= wrapHeight - wrapLowth;
        }
    });
}

function setPerTypeMovement(level, speed, padding = 16) {
    let headSpeeds = [];
    for (let i = 0; i < 4; i++) {
        let angle = deg2rad(rand(0, 360))
        headSpeeds.push({
            x: cos(angle) * speed,
            y: sin(angle) * speed,
        });
    }

    let wrapHeight = SCREEN_HEIGHT + padding;
    let wrapWidth = SCREEN_WIDTH + padding;
    let wrapLowth = -padding;

    level.heads.forEach(head => {
        head.onMove = (dt) => {
            let headType = head.sprite % 4;
            head.y += headSpeeds[headType].y * dt;
            head.x += headSpeeds[headType].x * dt;
            if (head.y < wrapLowth) head.y += wrapHeight - wrapLowth;
            if (head.y >= wrapHeight) head.y -= wrapHeight - wrapLowth;
            if (head.x < wrapLowth) head.x += wrapWidth - wrapLowth;
            if (head.x >= wrapWidth) head.x -= wrapWidth - wrapLowth;
        }
    });
}

function setDirectionMovement(level, speed, angleDeg, padding = [16, 16, 16, 16]) {
    let angle = deg2rad(angleDeg)
    dx = cos(angle) * speed;
    dy = sin(angle) * speed;

    let wrapLowthX = -padding[0];
    let wrapLowthY = -padding[1];
    let wrapWidth = SCREEN_WIDTH + padding[2];
    let wrapHeight = SCREEN_HEIGHT + padding[3];

    level.heads.forEach(head => {
        head.onMove = (dt) => {
            head.y += dy * dt;
            head.x += dx * dt;
            if (head.y < wrapLowthY) head.y += wrapHeight - wrapLowthY;
            if (head.y >= wrapHeight) head.y -= wrapHeight - wrapLowthY;
            if (head.x < wrapLowthX) head.x += wrapWidth - wrapLowthX;
            if (head.x >= wrapWidth) head.x -= wrapWidth - wrapLowthX;
        }
    });
}

function setBouncyMovement(level, speed, padding = 8) {
    level.heads.forEach(head => {
        let angle = deg2rad(rand(0, 360));
        let speedX = cos(angle) * speed;
        let speedY = sin(angle) * speed;

        head.onMove = (dt) => {
            head.y += speedY * dt;
            head.x += speedX * dt;

            if (head.y < padding) {
                head.y = 2 * padding - head.y;
                speedY = -speedY;
            }
            if (head.y >= SCREEN_HEIGHT - padding) {
                head.y = 2 * (SCREEN_HEIGHT - padding) - head.y;
                speedY = -speedY;
            }
            if (head.x < padding) {
                head.x = 2 * padding - head.x;
                speedX = -speedX;
            }
            if (head.x >= SCREEN_WIDTH - padding) {
                head.x = 2 * (SCREEN_WIDTH - padding) - head.x;
                speedX = -speedX;
            }
        }
    });
}

function setPerTypeOffset(level, maxOffset, frequency, forceAngle = null) {
    let headDirection = [];
    for (let i = 0; i < 4; i++) {
        let angle = forceAngle != null ? deg2rad(forceAngle) : deg2rad(rand(0, 360));
        headDirection.push({
            timeOffset: rand(0, deg2rad(360)),
            x: cos(angle) * maxOffset,
            y: sin(angle) * maxOffset,
        });
    }

    level.heads.forEach(head => {
        head.getPosition = (stateTimer) => {
            let offset = headDirection[head.sprite % 4];
            let dist = sin(stateTimer * frequency + offset.timeOffset);
            return {
                x: head.x + offset.x * dist,
                y: head.y + offset.y * dist,
            };
        }
    });
}

function setCircularOffset(level, radius, frequency) {
    let anglePerTime = deg2rad(360) * frequency;
    level.heads.forEach(head => {
        let angle = deg2rad(rand(0, 360));
        head.getPosition = (stateTimer) => {
            return {
                x: head.x + cos(angle + anglePerTime * stateTimer) * radius,
                y: head.y + sin(angle + anglePerTime * stateTimer) * radius,
            };
        }
    });
}

function setSquareOffset(level, distance, speed, angleDeg) {
    let angle = deg2rad(angleDeg);
    let dx = cos(angle) * distance;
    let dy = sin(angle) * distance;

    level.heads.forEach(head => {
        head.getPosition = (stateTimer) => {
            let s = sin(stateTimer * TWO_PI * speed);
            s *= s;
            return {
                x: head.x + s * dx,
                y: head.y + s * dy,
            };
        }
    });
}

function shuffle(array, fromIndex = 0) {
    for (let i = array.length - 1; i > fromIndex; i--) {
        const j = randi(fromIndex, i);
        [array[i], array[j]] = [array[j], array[i]];
    }
}
