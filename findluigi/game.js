// States
const S_Loading = 0;
const S_Idle = 1;
const S_NextStage = 2;
const S_Searching = 3;
const S_Victory = 4;

// Other constants
const SCREEN_HEIGHT = 192; // NB: Two screens!
const SCREEN_WIDTH = 255;
const HEAD_CENTER = 16;

const MAX_CLICK_DISTANCE_SQ = 20 * 20;

litecanvas({
    loop: {
        init, update, draw,
        tap,
    },
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 2,
    pixelart: true,
})


use(pluginAssetLoader)

function init() {
    stateTimer = 0;
    stateCounter = 0;
    setState(S_Loading)

    images_converted = {}
    images_original = {}
    images = images_original

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
    TOTAL_LOADING = LOADING

    level = {}
    quickmode = false;
}

function update(dt) {
    stateTimer += dt;

    switch (state) {
        case S_Loading:
            break;
        case S_Idle:
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
            animateVictory();
            break;
    }
}

function animateVictory() {
    if (stateTimer < 1.38333333 + stateCounter * 0.5) return;
    stateCounter++;
    if (stateCounter == 4) {
        setState(S_NextStage);
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

            if (LOADING == 0) {
                setState(S_NextStage);
            }
            return;
        case S_Idle:
            cls(5);
            break;
        case S_Victory:
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
        case S_Idle:
            break;
        case S_NextStage:
            break;
        case S_Searching:
        case S_Victory:
            image(0, 0, images.posters[level.poster])
            break;
    }
}

function drawBoard() {
    switch (state) {
        case S_Idle:
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
            let head = level.target_head;

            let x = floor(head.x - HEAD_CENTER);
            let y = floor(head.y - HEAD_CENTER + SCREEN_HEIGHT);
            image(x, y, images.heads[head.sprite]);
            break;
    }
}

function tap(x, y, tapId) {
    if (x < 0 || x >= SCREEN_WIDTH || y < SCREEN_HEIGHT || y >= SCREEN_HEIGHT * 2) return;
    y -= SCREEN_HEIGHT;

    switch (state) {
        case S_Searching:
            let tappedHead = findTappedHead(x, y);
            if (tappedHead == -2 || level.heads[tappedHead].isTarget) {
                if (quickmode) setState(S_NextStage);
                else setState(S_Victory);
            } else if (tappedHead > 0) {
                level.heads.splice(tappedHead, 1);
            }
            return;
    }
}

function findTappedHead(x, y) {
    let shortestDistance = MAX_CLICK_DISTANCE_SQ;
    let closest = -1;

    {
        let head = level.target_head;
        let dx = x - head.x;
        let dy = y - head.y;
        let dist = dx * dx + dy * dy
        if (dist < shortestDistance) {
            return -2;
        }
    }

    for (var i = level.heads.length - 1; i >= 0; i--) {
        let head = level.heads[i];
        let dx = x - head.x;
        let dy = y - head.y;
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


    switch (newState) {
        case S_Searching:
            break;
        case S_Loading:
        case S_Loading:
            current_level = 0;
            break;
        case S_NextStage:
            current_level++;
            level = generateLevel(current_level);
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
    }
}

function generateLevel(current_level) {
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
    }

    // Level range overrides
    if (current_level < 10) {
        return generateFill(100);
    } else /* if (current_level < 20) */ {
        let level = generateFill(100);
        switch (current_level % 3) {
            case 1:
                setVerticalMovement(level, -48, 48);
                setPerTypeOffset(level, 16, 4, 0);
                return level;
            case 2:
                setPerTypeMovement(level, 32);
                setPerTypeOffset(level, 8, 0.2, 0);
                return level;
        }
        return level;
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

function generateFill(count, forceTop = false) {
    let level = {};
    level.lookingFor = randi(0, 3);
    level.heads = [];
    level.poster = level.lookingFor;

    const xPadding = 8;
    const yPadding = 8;
    let legalPositions = [];
    for (let xi = 0; xi < 14; xi++) {
        let x = xi * (SCREEN_WIDTH - xPadding * 2) / 13 + xPadding;
        for (let yi = 0; yi < 10; yi++) {
            let y = yi * (SCREEN_HEIGHT - yPadding * 2) / 9 + yPadding;
            legalPositions.push({ x, y });
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

    let targetIndex = forceTop ? level.heads.length - 1 : randi(0, floor(level.heads.length * 2 / 4));
    level.target_head = level.heads[targetIndex];
    level.target_head.isTarget = true;
    level.target_head.sprite = level.lookingFor;

    return level;
}

function setVerticalMovement(level, upSpeed, downSpeed) {
    let wrapHeight = SCREEN_HEIGHT + 16;
    let wrapLowth = -16;

    let columns = [];
    for (let i = 0; i < SCREEN_WIDTH / 32; i++) {
        columns.push(randi(0, 1) == 0 ? upSpeed : downSpeed);
    }

    level.heads.forEach(head => {
        head.onMove = (dt) => {
            let speed = columns[floor(head.x / 32)]
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

function setPerTypeMovement(level, speed) {
    let headSpeeds = [];
    for (let i = 0; i < 4; i++) {
        let angle = deg2rad(rand(0, 360));
        headSpeeds.push({
            x: cos(angle) * speed,
            y: sin(angle) * speed,
        });
    }

    let wrapHeight = SCREEN_HEIGHT + 16;
    let wrapWidth = SCREEN_WIDTH + 16;
    let wrapLowth = -16;

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


function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randi(0, i);
        [array[i], array[j]] = [array[j], array[i]];
    }
}