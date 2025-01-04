// States
const S_Loading = 0;
const S_Menu = 1;
const S_Settings = 2;
const S_NextStage = 3;
const S_Searching = 4;
const S_Victory = 5;
const S_GameOver = 6;

// Other constants
const SCREEN_HEIGHT = 192; // NB: Two screens!
const SCREEN_WIDTH = 255;
const HEAD_CENTER = 16;

const MAX_CLICK_DISTANCE_SQ = 20 * 20;

// Dumb stuff
function isOnPhone() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getUserNumber() {
    const userInput = prompt("Select a level (1-9999):");
    if (userInput === null) return null;
    const number = parseInt(userInput.trim());
    if (isNaN(number) || level < 1 || level > 9999) {
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

litecanvas({
    loop: {
        init, update, draw,
        tap,
    },
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 2,
    pixelart: gameSettings.pixelart,
})


use(pluginAssetLoader)

function init() {
    forceStage = null;
    stateTimer = 0;
    stateCounter = 0;
    current_level = 0;
    level_timescale = 1;

    setState(S_Loading)

    images_converted = {}
    images_original = {}
    images = gameSettings.canvasColors ? images_converted : images_original;

    loadImage("assets/posters.png", (image, { convertColors, splitFrames }) => {
        images_original.posters = splitFrames(image, 256, 192, 0, 0)
        images_converted.posters = images_original.posters.map(convertColors)
    })
    loadImage("assets/heads.png", (image, { convertColors, splitFrames }) => {
        images_original.heads = splitFrames(image, 32, 32, 0, 0)
        images_converted.heads = images_original.heads.map(convertColors)
    })
    loadImage("assets/numbers.png", (image, { convertColors, splitFrames }) => {
        images_original.numbers = splitFrames(image, 17, 17, 0, 0)
        images_converted.numbers = images_original.numbers.map(convertColors)
    })
    loadImage("assets/star.png", (image, { convertColors, splitFrames }) => {
        images_original.star = image
        images_converted.star = convertColors(images_original.star)
    })
    loadImage("assets/level.png", (image, { convertColors, splitFrames }) => {
        images_original.level = image
        images_converted.level = convertColors(image)
    })
    loadImage("assets/menu.png", (image, { convertColors, splitFrames }) => {
        images_original.menu_buttons = splitFrames(image, 128, 38, 0, 0)
        images_converted.menu_buttons = images_original.menu_buttons.map(convertColors)
    })
    loadImage("assets/settings.png", (image, { convertColors, splitFrames }) => {
        images_original.settings_buttons = splitFrames(image, 128, 38, 0, 0)
        images_converted.settings_buttons = images_original.settings_buttons.map(convertColors)
    })
    TOTAL_LOADING = LOADING

    level = {}
    quickmode = false;

    button_positions = [];
    for (var i = 0; i < 3; i++) {
        let x = SCREEN_WIDTH / 4;
        let y = SCREEN_HEIGHT + SCREEN_HEIGHT * (i + 1) / 4;
        button_positions.push({ x: x, y: y });
    }
}

function update(dt) {
    stateTimer += dt;

    switch (state) {
        case S_Loading:
            if (LOADING == 0) {
                setState(quickmode ? S_NextStage : S_Menu);
            }
            break;
        case S_Menu:
        case S_Settings:
            break;
        case S_NextStage:
            setState(S_Searching);
            break;
        case S_Searching:
            level.heads.forEach(head => {
                if (head.onMove) head.onMove(dt);
            });
            break;
        case S_Victory:
            animateLevelEnd(S_NextStage);
            break;
        case S_GameOver:
            animateLevelEnd(S_Menu);
            break;
    }
}

function animateLevelEnd(nextState) {
    if (stateTimer < 1.38333333 + stateCounter * 0.5) return;
    stateCounter++;
    if (stateCounter == 4) {
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
            cls(5);
            break;
        case S_Settings:
            cls(5);
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

    drawBoard()
    drawInfo()
}

function drawInfo() {
    switch (state) {
        case S_Menu:
            if (gameSettings.highscores.length <= 0) return;
            textsize(12);
            textalign("center", "top");
            text(SCREEN_WIDTH / 2, 8, "Highscores", 0);
            for (var i = 0; i < gameSettings.highscores.length; i++) {
                text(SCREEN_WIDTH / 2, 8 + (i + 1) * 12, gameSettings.highscores[i], 0);
            }
            break;
        case S_NextStage:
            break;
        case S_Searching:
        case S_Victory:
        case S_GameOver:
            image(0, 0, images.posters[level.poster])
            let stars = current_level + (state == S_Victory ? stateCounter % 2 : 0) - 1;
            if (stars > 0) {
                image(SCREEN_WIDTH - 30, SCREEN_HEIGHT - 42, images.star);
                let starText = stars.toString();

                let startX = SCREEN_WIDTH - 30 + 9 - starText.length * 4;
                let startY = SCREEN_HEIGHT - 42 + 4;
                for (let i = 0; i < starText.length; i++) {
                    let digit = parseInt(starText.charAt(i));
                    image(startX + i * 8, startY, images.numbers[10 + digit]);
                }
            }
            break;
    }
}

function drawBoard() {
    switch (state) {
        case S_Menu:
            for (var i = 0; i < button_positions.length; i++) {
                let pos = button_positions[i];
                image(pos.x, pos.y, images.menu_buttons[i]);
            }
            break;
        case S_Settings:
            for (var i = 0; i < button_positions.length; i++) {
                let pos = button_positions[i];
                var index = i * 2;
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
            level.heads.forEach(head => {
                let pos = head.getPosition ? head.getPosition(stateTimer) : head;

                let x = floor(pos.x - HEAD_CENTER);
                let y = floor(pos.y - HEAD_CENTER + SCREEN_HEIGHT);
                image(x, y, images.heads[head.sprite])
            });
            break;
        case S_Victory:
        case S_GameOver:
            let head = level.target_head;

            let x = floor(head.x - HEAD_CENTER);
            let y = floor(head.y - HEAD_CENTER + SCREEN_HEIGHT);
            image(x, y, images.heads[head.sprite]);
            break;
    }
}

function tap(x, y, tapId) {
    if (x < 0 || x >= SCREEN_WIDTH || y < SCREEN_HEIGHT || y >= SCREEN_HEIGHT * 2) return;

    switch (state) {
        case S_Menu:
            for (var i = 0; i < button_positions.length; i++) {
                let pos = button_positions[i];
                if (x < pos.x - 2 || x >= pos.x + 130 || y < pos.y - 2 || y >= pos.y + 40) continue;
                switch (i) {
                    case 0:
                        forceStage = null;
                        setState(S_NextStage);
                        return;
                    case 1:
                        setState(S_Settings);
                        return;
                    case 2:
                        forceStage = getUserNumber();
                        if (forceStage == null) return;
                        setState(S_NextStage);
                        return;
                }
            }
            break;
        case S_Settings:
            for (var i = 0; i < button_positions.length; i++) {
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
        case S_Searching:
            y -= SCREEN_HEIGHT;

            let tappedHead = findTappedHead(x, y);
            if (tappedHead == -1) return;
            if (tappedHead == -2 || level.heads[tappedHead].isTarget) {
                if (quickmode) setState(S_NextStage);
                else setState(S_Victory);
            } else if (tappedHead >= 0) {
                level.heads.splice(tappedHead, 1);
                level.lives--;
                if (level.lives <= 0) setState(S_GameOver);
            }
            return;
    }
}

function findTappedHead(x, y) {
    let shortestDistance = MAX_CLICK_DISTANCE_SQ;
    let closest = -1;

    {
        let head = level.target_head;
        let pos = head.getPosition ? head.getPosition(stateTimer) : head;
        let dx = x - pos.x;
        let dy = y - pos.y;
        let dist = dx * dx + dy * dy
        if (dist <= shortestDistance) {
            return -2;
        }
    }

    for (var i = level.heads.length - 1; i >= 0; i--) {
        let head = level.heads[i];
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
        case S_Searching:
            break;
        case S_Loading:
        case S_Menu:
        case S_Settings:
            current_level = 0;
            break;
        case S_NextStage:
            current_level++;
            if (forceStage != null) current_level = forceStage;

            level = generateLevel(current_level);
            timescale(level.timescale);
            // Temp until time is implemented
            level.lives = 3;
            break;

        case S_Victory:
            level.heads.forEach(head => {
                if (head.getPosition) {
                    pos = head.getPosition(oldStateTimer);
                    head.x = pos.x;
                    head.y = pos.y;
                }
            });
            break;
        case S_GameOver:
            if (forceStage == null) {
                gameSettings.highscores.push(current_level - 1);
                gameSettings.highscores.sort((a, b) => b - a);
                gameSettings.highscores = gameSettings.highscores.slice(0, 10);
                localStorage.setItem("settings", JSON.stringify(gameSettings));
                break;
            }
    }
}

function generateLevel(current_level) {
    if (current_level < 100) {
        let level = generateLevelInner(current_level);
        level.timescale = 1;
        return level;
    }

    let level = generateLevelInner(current_level % 100);
    level.timescale = floor(current_level / 100) * 0.25 + 1;
    return level;
}

function generateLevelInner(current_level) {
    // Single level overrides
    switch (current_level) {
        case 1:
            return generate2x2();
        case 2:
            return generateSquare(4, 4);
        case 3:
            return generateSquare(8, 6);
        case 4:
            return generateFill(80, true);
        case 5:
            return generateFill(100, true);
        case 6: {
            let level = generateSquare(8, 6);
            setVerticalMovement(level, -48, 48);
            return level;
        }
        case 10: {
            let level = generateSquare(8, 1);
            level.heads.forEach(head => head.y = -4);
            return level;
        }
        case 20:
            return generateHiddenLine(64, 8, 8);
        case 30:
            return generateHiddenLine(64, 17, 0);
        case 40: {
            let level = generateSquare(8, 1);
            level.heads.forEach(head => head.y = -10);
            return level;
        }
    }

    // Level range overrides
    if (current_level < 10) {
        return generateFill(120);
    } else if (current_level < 20) {
        let level = generateFill(100);
        switch (current_level % 3) {
            case 1:
                setVerticalMovementPerType(level, -48, 48);
                setPerTypeOffset(level, 16, 4, 0);
                return level;
            case 2:
                setPerTypeMovement(level, 32);
                setPerTypeOffset(level, 8, 0.2, 0);
                return level;
        }
        return level;
    } else if (current_level < 30) {
        let level = generateFill(120);
        switch (current_level % 3) {
            case 0:
                setVerticalMovementPerType(level, -96, 96);
                setPerTypeOffset(level, 16, 4, 0);
                return level;
            case 1:
                return generateHiddenLine(64, 12, 8);
            case 2:
                setVerticalMovement(level, -96, 96);
                setPerTypeOffset(level, 16, 4, 0);
                return level;
        }
    } else if (current_level < 40) {
        switch (current_level % 3) {
            case 0: {
                let level = generateFill(200, false, true);
                setBouncyMovement(level, 32);
                setCircularOffset(level, 32, 0.2);
                return level;
            }
            case 1: {
                let level = generateFill(200, false, false, 2, 2);
                level.heads.forEach(head => head.onMove = (dt) => {
                    head.x += 32 * dt;
                    head.y += 32 * dt;
                    if (head.y > SCREEN_HEIGHT + 40) head.y -= SCREEN_HEIGHT + 40 * 2;
                    if (head.x > SCREEN_WIDTH + 40) head.x -= SCREEN_WIDTH + 40 * 2;
                });
                setPerTypeOffset(level, 8, 4, 45);
                return level;
            }
            case 2:
                return generateFill(140);
        }
    } else if (current_level < 50) {
        switch (current_level % 4) {
            case 0: {
                let level = generateSquare(8, 2);
                level.heads.forEach(head => head.y = head.y < SCREEN_HEIGHT / 2 ? -8 : SCREEN_HEIGHT + 8);
                return level;
            }
            case 1: {
                let level = generateFill(140, false);
                setBouncyMovement(level, 64);
                return level;
            }
            case 2: {
                let level = generateSquare(2, 6);
                level.heads.forEach(head => head.x = head.x < SCREEN_WIDTH / 2 ? -8 : SCREEN_WIDTH + 8);
                return level;
            }
            case 3: {
                let level = generateFill(200, false, true);
                setBouncyMovement(level, 64);
                return level;
            }
        }
    } else if (current_level < 100) {
        return generateLevel(randi(1, 50), 1.001);
    }
}

function generate2x2() {
    let level = {};
    level.lookingFor = randi(0, 3);
    level.heads = [];
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
            level.target_head = head;
        }
    }

    return level;
}

function generateSquare(width, height) {
    let level = {};
    level.lookingFor = randi(0, 3);
    level.heads = [];
    level.poster = level.lookingFor;

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let head = {
                x: SCREEN_WIDTH / 2 - width * 16 + x * 32 + 16,
                y: SCREEN_HEIGHT / 2 - height * 16 + y * 32 + 16,
                sprite: (randi(1, 3) + level.lookingFor) % 4,
                isTarget: false,
            };
            level.heads.push(head);
        }
    }

    let targetIndex = randi(0, level.heads.length - 1);
    level.target_head = level.heads[targetIndex];
    level.target_head.isTarget = true;
    level.target_head.sprite = level.lookingFor;

    return level;
}

function generateFill(count, forceTop = false, diagonals = false, overFillX = 0, overFillY = 0) {
    let level = {};
    level.lookingFor = randi(0, 3);
    level.heads = [];
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
    if (count > legalPositions.length) count = legalPositions.length;

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
    level.target_head = level.heads[targetIndex];
    level.target_head.isTarget = true;
    level.target_head.sprite = level.lookingFor;

    return level;
}

function generateHiddenLine(speed, tightness, variance) {
    let level = {};
    level.lookingFor = randi(0, 3);
    level.heads = [];
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
        var y = pos.y;
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
    level.target_head = level.heads[targetIndex];
    level.target_head.isTarget = true;
    level.target_head.sprite = level.lookingFor;

    return level;
}

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
        let angle = deg2rad(rand(0, 360));
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

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randi(0, i);
        [array[i], array[j]] = [array[j], array[i]];
    }
}
