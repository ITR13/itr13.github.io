class InfiniteTicTacToe {
    constructor() {
        this.cells = Array(9).fill(null);
        this.humanPieces = [];
        this.aiPieces = [];
        this.scores = { human: 0, ai: 0 };
        this.gameActive = true;
        this.gridContainer = document.getElementById('grid-container');
        this.effectsContainer = document.getElementById('effects-container');
        this.currentStartingPlayerIdentity = 'human';
        this.updateSymbols();
        this.currentPlayer = this.currentStartingPlayerIdentity === 'human' ? this.humanSymbol : this.aiSymbol;
        this.initGrid();
        this.gridContainer.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.gridContainer.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.difficulty = 'easy';
        this.setupDifficultySelector();
        this.updateScores();

        if (this.currentPlayer === this.aiSymbol) this.aiMove();
    }

    updateSymbols() {
        if (this.currentStartingPlayerIdentity === 'human') {
            this.humanSymbol = 'X';
            this.aiSymbol = 'O';
        } else {
            this.humanSymbol = 'O';
            this.aiSymbol = 'X';
        }
    }

    initGrid() {
        this.gridContainer.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => this.handleClick(i));
            this.gridContainer.appendChild(cell);
        }

        this.preview = document.createElement('div');
        this.preview.className = 'preview';
        this.gridContainer.appendChild(this.preview);
        this.hidePreview();
    }

    setupDifficultySelector() {
        const tabs = document.querySelectorAll('.tab');
        const savedDifficulty = localStorage.getItem('selectedDifficulty') || 'easy';
    
        tabs.forEach(tab => {
            if (tab.dataset.difficulty === savedDifficulty) {
                tab.classList.add('active');
                this.difficulty = savedDifficulty;
            }
    
            tab.addEventListener('click', () => {
                document.querySelector('.tab.active')?.classList.remove('active');
                tab.classList.add('active');
                this.difficulty = tab.dataset.difficulty;
                localStorage.setItem('selectedDifficulty', this.difficulty);
            });
        });
    }
    

    async updatePreviewPosition(index) {
        if (!this.gameActive) {
            this.hidePreview();
            return;
        }

        const cell = this.gridContainer.children[index];
        if (!cell) return;

        const rect = cell.getBoundingClientRect();
        const parentRect = this.gridContainer.getBoundingClientRect();
        const x = rect.left - parentRect.left;
        const y = rect.top - parentRect.top;

        const symbol = this.currentPlayer.toLowerCase();
        if (!this.preview.classList.contains(symbol) || this.preview.style.opacity) {
            this.preview.style.transition = 'none';
            this.preview.style.transform = `translate(${x}px, ${y}px) scale(0)`
            await new Promise(r => setTimeout(r, 10));
            this.preview.style.transition = '';
        } else {
            this.preview.style.transition = '';
        }

        this.preview.style.transform = `translate(${x}px, ${y}px)`;
        this.preview.style.visibility = 'visible';
        this.preview.style.opacity = '';
        this.preview.className = `preview ${symbol}`;

        this.preview.style.width = `${rect.width}px`;
        this.preview.style.height = `${rect.height}px`;
    }

    async hidePreview() {
        this.preview.style.opacity = '0';
    }

    handleMouseMove(e) {
        if (!this.gameActive || this.currentPlayer !== this.humanSymbol) {
            return;
        }

        const gridRect = this.gridContainer.getBoundingClientRect();
        const x = e.clientX - gridRect.left;
        const y = e.clientY - gridRect.top;
        const cellSize = gridRect.width / 3;

        const col = Math.floor(x / cellSize);
        const row = Math.floor(y / cellSize);
        const index = row * 3 + col;

        if (!this.cells[index]) {
            this.updatePreviewPosition(index);
        } else {
            this.hidePreview();
        }
    }

    handleMouseLeave(e) {
        if (!this.gameActive || this.currentPlayer !== this.humanSymbol) {
            return;
        }
        this.hidePreview();
    }

    handleClick(index) {
        if (!this.gameActive || this.currentPlayer !== this.humanSymbol || this.cells[index]) return;

        this.placePiece(index, this.humanSymbol);
        this.hidePreview();

        if (this.checkWin(this.humanSymbol)) {
            this.handleWin('human');
        } else if (this.cells.every(cell => cell)) {
            this.handleDraw();
        } else {
            this.currentPlayer = this.aiSymbol;
            this.updateScores();
            this.aiMove();
        }
    }

    placePiece(index, symbol) {
        const pieces = symbol === this.humanSymbol ? this.humanPieces : this.aiPieces;
        pieces.push(index);

        if (pieces.length > 3) {
            const removed = pieces.shift();
            this.cells[removed] = null;
            this.updateCell(removed);
        }

        this.cells[index] = symbol;
        this.updateCell(index);
    }

    updateCell(index) {
        const cell = this.gridContainer.children[index];

        if (this.cells[index]) {
            cell.className = `cell ${this.cells[index].toLowerCase()} impact`;
        } else {
            cell.classList.remove('impact');
            cell.classList.remove('shake-scale');
            cell.classList.add('fade-out');
            setTimeout(() => {
                cell.className = 'cell';
            }, 200);
        }
    }

    shakeScale(index, active) {
        var oldestPiece = this.gridContainer.children[index];
        if (active) {
            oldestPiece.classList.remove('impact');
            oldestPiece.classList.add('shake-scale');
        } else {
            oldestPiece.classList.remove('shake-scale');
        }
    }

    checkWin(symbol) {
        const pieces = symbol === this.humanSymbol ? this.humanPieces : this.aiPieces;
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return winPatterns.some(pattern => pattern.every(i => pieces.includes(i)));
    }

    handleWin(winner) {
        this.gameActive = false;
        this.scores[winner]++;
        this.currentStartingPlayerIdentity = this.currentStartingPlayerIdentity === 'human' ? 'ai' : 'human';
        const winningSymbol = winner === 'human' ? this.humanSymbol : this.aiSymbol;
        this.hidePreview();
        this.showVictoryEffect(winner);
        this.drawWinLine(winningSymbol);

        setTimeout(() => {
            this.resetGame();
            this.updateSymbols();
            this.currentPlayer = this.currentStartingPlayerIdentity === 'human' ? this.humanSymbol : this.aiSymbol;
            this.updateScores();
            if (this.currentPlayer === this.aiSymbol) this.aiMove();
        }, 2000);
    }

    drawWinLine(symbol) {
        const pattern = this.getWinningPattern(symbol);

        if (!pattern) return;

        const [a, , c] = pattern;
        const startCell = this.gridContainer.children[a];
        const endCell = this.gridContainer.children[c];

        const startRect = startCell.getBoundingClientRect();
        const endRect = endCell.getBoundingClientRect();
        const gridRect = this.gridContainer.getBoundingClientRect();

        const svgNamespace = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNamespace, 'svg');
        svg.setAttribute('width', this.gridContainer.offsetWidth);
        svg.setAttribute('height', this.gridContainer.offsetHeight);
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';

        const line = document.createElementNS(svgNamespace, 'line');
        const startX = startRect.left - gridRect.left + startRect.width / 2;
        const startY = startRect.top - gridRect.top + startRect.height / 2;
        const endX = endRect.left - gridRect.left + endRect.width / 2;
        const endY = endRect.top - gridRect.top + endRect.height / 2;

        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', startX);
        line.setAttribute('y2', startY);

        const blueX = getComputedStyle(document.documentElement).getPropertyValue('--blue-x-win').trim();
        const redO = getComputedStyle(document.documentElement).getPropertyValue('--red-o-win').trim();
        line.setAttribute('stroke', symbol == 'X' ? blueX : redO);
        line.setAttribute('stroke-width', '8');
        line.setAttribute('stroke-linecap', 'round');

        svg.appendChild(line);
        this.gridContainer.appendChild(svg);

        let progress = 0;
        const duration = 300;
        function easeInOutCubic(t) {
            if (t < 0.5) {
                return 4 * t * t * t;
            } else {
                return 1 - Math.pow(-2 * t + 2, 3) / 2;
            }
        }

        function animateLine() {
            progress += 16;
            const easing = easeInOutCubic(progress / duration);

            const currentX = startX + (endX - startX) * easing;
            const currentY = startY + (endY - startY) * easing;

            line.setAttribute('x2', currentX);
            line.setAttribute('y2', currentY);

            if (progress < duration) {
                requestAnimationFrame(animateLine);
            }
        }

        animateLine();
    }

    getWinningPattern(symbol) {
        const pieces = symbol === this.humanSymbol ? this.humanPieces : this.aiPieces;
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        return winPatterns.find(pattern => pattern.every(i => pieces.includes(i)));
    }

    showVictoryEffect(winner) {
        if (winner === 'human') {
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    --spread: ${Math.random()};
                    left: ${50 + (Math.random() - 0.5) * 30}%;
                    background: hsl(${Math.random() * 360}, 70%, 50%);
                    animation-delay: ${Math.random() * 0.5}s;
                `;
                this.effectsContainer.appendChild(confetti);
                setTimeout(() => confetti.remove(), 2000);
            }
        } else {
            const robot = document.createElement('div');
            robot.className = 'ai-victory';
            robot.textContent = '🤖';
            this.effectsContainer.appendChild(robot);
            setTimeout(() => robot.remove(), 2000);
        }
    }

    resetGame() {
        this.cells = Array(9).fill(null);
        this.humanPieces = [];
        this.aiPieces = [];
        this.gameActive = true;
        this.initGrid();
        this.effectsContainer.innerHTML = '';
    }

    async aiMove() {
        if (!this.gameActive) return;

        if (this.aiPieces.length >= 3) {
            this.shakeScale(this.aiPieces[0], true);
        }
        await new Promise(r => setTimeout(r, 150));

        let emptyCells = this.cells
            .map((cell, index) => cell ? null : index)
            .filter(i => i !== null);

        const chosenIndex = this.chooseAiMove();

        emptyCells = emptyCells.filter(i => i !== chosenIndex);
        for (let i = emptyCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
        }
        emptyCells.unshift(chosenIndex);
        emptyCells.push(emptyCells[Math.floor(Math.random() * (emptyCells.length - 1))]);

        const delays = [350, 300, 300, 200];
        let cellsToVisit = 3;
        if (Math.random() < 0.2 || true) {
            if (Math.random() < 0.5) {
                delays[1] = 450;
            } else {
                cellsToVisit = 2;
                delays[2] = 200;
                delays[0] = 450;
            }
        }
        for (let i = Math.min(cellsToVisit, emptyCells.length - 1); i >= 0; i--) {
            this.updatePreviewPosition(emptyCells[i], this.aiSymbol);
            await new Promise(r => setTimeout(r, delays[i]));
        }

        if (this.aiPieces.length >= 3) {
            this.shakeScale(this.aiPieces[0], false);
        }

        this.preview.style.visibility = 'hidden';
        this.placePiece(chosenIndex, this.aiSymbol);

        if (this.checkWin(this.aiSymbol)) {
            this.handleWin('ai');
        } else {
            this.currentPlayer = this.humanSymbol;
            this.updateScores();
            if (this.humanPieces.length >= 3) {
                this.shakeScale(this.humanPieces[0], true);
            }
        }
    }

    chooseAiMove() {
        if (this.humanPieces.length == 0) {
            return this.selectRandom([1, 3, 5, 7]);
        }

        function getMissingFromWin(pieces) {
            const winPatterns = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];

            const winPattern = winPatterns.find(pattern => pieces.every(i => pattern.includes(i)));
            if (winPattern == null) return -1;
            return winPattern.filter(item => !pieces.includes(item))[0];
        }

        if (this.aiPieces.length >= 2) {
            const lastMoves = this.aiPieces.slice(-2);
            const missing = getMissingFromWin(lastMoves);
            if (missing != -1 && this.cells[missing] == null) {
                return missing;
            }
        }

        if (this.humanPieces.length >= 2) {
            const lastMoves = this.humanPieces.slice(-2);
            const missing = getMissingFromWin(lastMoves);
            if (missing != -1 && this.cells[missing] == null) {
                return missing;
            }
        }

        if (this.humanPieces.length >= 3) {
            const attackLine = [this.aiPieces.at(-1), this.humanPieces[0]];
            const missing = getMissingFromWin(attackLine);
            if (missing != -1 && this.cells[missing] == null) {
                return missing;
            }
        }

        if (this.aiPieces.length >= 2) {
            const defenceLine = [this.aiPieces.at(0), this.humanPieces[-1]];
            const missing = getMissingFromWin(defenceLine);
            if (missing != -1 && this.cells[missing] == null) {
                return missing;
            }
        }

        let emptyCells = this.cells
            .map((cell, index) => cell ? null : index)
            .filter(i => i !== null);

        if (this.difficulty == 'easy') {
            return this.selectRandom(emptyCells);
        } else if (this.difficulty == 'hard') {
            return this.selectRandom(this.bruteforceMoves());
        }

        function areOpposite(a, b) {
            return 8 - a == b;
        }

        const outerTiles = [0, 1, 2, 5, 8, 7, 6, 3];
        const cournerTiles = [0, 2, 8, 6];
        const sideTiles = [1, 5, 7, 3];

        function neighbors(n, arr) {
            let index = arr.indexOf(n);
            return [arr.at(index - 1), arr[(index + 1) % arr.length]];
        }

        function opposite(n, arr) {
            let index = arr.indexOf(n);
            return arr[(index + (arr.length >> 1)) % arr.length];
        }

        if (this.humanPieces.length == 1 && this.aiPieces.length == 1) {
            let h = this.humanPieces[0];
            let a = this.aiPieces[0];

            if (areOpposite(a, h) || h == 4) {
                return this.selectRandom(neighbors(a, outerTiles));
            }
            else {
                return 4;
            }
        }

        let potentialOpposites = [];
        for (var i = 0; i < this.aiPieces.length; i++) {
            let index = this.aiPieces[i];
            if (cournerTiles.includes(index)) {
                potentialOpposites.push(...neighbors(index, cournerTiles));
            } else if (sideTiles.includes(index)) {
                let oppositeIndex = opposite(index, sideTiles);
                potentialOpposites.push(oppositeIndex);
            }
        }

        potentialOpposites = potentialOpposites.filter(index => this.cells[index] == null);
        if (potentialOpposites.length > 0) {
            return this.selectRandom(potentialOpposites);
        }

        let potentialTiles = [];
        for (var i = 0; i < outerTiles.length; i += 2) {
            let line = [outerTiles[i], outerTiles[i + 1], outerTiles[(i + 2) % outerTiles.length]];
            if (line.every(index => this.cells[index] == null)) {
                potentialTiles.push(...emptyCells.filter(index => !line.includes(index)));
            }
        }

        if (potentialTiles.length > 0) {
            return this.selectRandom(potentialTiles);
        }

        return this.selectRandom(emptyCells);
    }

    bruteforceMoves() {
        function checkWinForMoves(moves) {
            const winPatterns = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            return winPatterns.some(pattern =>
                pattern.every(i => moves.includes(i))
            );
        }

        function getEmptyCells(aiMoves, humanMoves) {
            const occupied = new Set([...aiMoves, ...humanMoves]);
            return Array.from({ length: 9 }, (_, i) => i)
                .filter(i => !occupied.has(i));
        }

        function dfs(aiMoves, humanMoves, depth, isAiTurn) {
            if (depth <= 0) return false;

            if (isAiTurn) {
                const empty = getEmptyCells(aiMoves, humanMoves);
                for (const move of empty) {
                    const newAi = [...aiMoves, move];
                    if (newAi.length > 3) newAi.shift();

                    if (checkWinForMoves(newAi) ||
                        dfs(newAi, humanMoves, depth - 1, false)) {
                        return true;
                    }
                }
                return false;
            } else {
                const empty = getEmptyCells(aiMoves, humanMoves);
                for (const move of empty) {
                    const newHuman = [...humanMoves, move];
                    if (newHuman.length > 3) newHuman.shift();

                    if (checkWinForMoves(newHuman) ||
                        !dfs(aiMoves, newHuman, depth - 1, true)) {
                        return false;
                    }
                }
                return true;
            }
        }

        const emptyCells = this.cells
            .map((cell, index) => cell ? null : index)
            .filter(i => i !== null);

        const depthLimit = 8 - (this.aiPieces.length + this.humanPieces.length);
        const winningMoves = [];
        const nonLosingMoves = [];
        const allMoves = [];

        for (const move of emptyCells) {
            const simulatedAi = [...this.aiPieces, move];
            if (simulatedAi.length > 3) simulatedAi.shift();

            if (checkWinForMoves(simulatedAi)) {
                winningMoves.push(move);
                continue;
            }

            let humanCanWin = false;
            const tempHuman = [...this.humanPieces];

            for (const humanMove of emptyCells.filter(m => m !== move)) {
                const simulatedHuman = [...tempHuman, humanMove];
                if (simulatedHuman.length > 3) simulatedHuman.shift();

                if (checkWinForMoves(simulatedHuman)) {
                    humanCanWin = true;
                    break;
                }
            }

            if (!humanCanWin) {
                const canWin = dfs(simulatedAi, this.humanPieces, depthLimit - 1, false);
                if (canWin) winningMoves.push(move);
                else nonLosingMoves.push(move);
            }

            allMoves.push(move);
        }

        if (winningMoves.length > 0) return winningMoves;
        if (nonLosingMoves.length > 0) return nonLosingMoves;
        return allMoves;
    }

    selectRandom(cells) {
        return cells[Math.floor(Math.random() * cells.length)];
    }

    updateScores() {
        document.getElementById('player-score').textContent = this.scores.human;
        document.getElementById('ai-score').textContent = this.scores.ai;
        document.getElementById('turn-indicator').textContent =
            `${this.currentPlayer === this.humanSymbol ? 'PLAYER' : 'AI'}'S TURN`;
    }
}

document.addEventListener('DOMContentLoaded', () => new InfiniteTicTacToe());
