class CircleApproximation {
    constructor() {
        this.CW = 960;
        this.CH = 1080;

        this.setupCanvases();
        this.setupConfiguration();
        this.setupEventListeners();
        this.initializeState();
        this.loadDefaultImage();
        this.setupLayout();
    }

    setupCanvases() {
        this.drawCanvas = document.getElementById('drawCanvas');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.imgCanvas = document.getElementById('imgCanvas');

        this.drawCtx = this.drawCanvas.getContext('2d');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.imgCtx = this.imgCanvas.getContext('2d');

        this.drawCtx.fillStyle = 'black';
        this.drawCtx.fillRect(0, 0, this.CW, this.CH);
        this.overlayCtx.clearRect(0, 0, this.CW, this.CH);
        this.imgCtx.fillStyle = 'black';
        this.imgCtx.fillRect(0, 0, this.CW, this.CH);

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.CW;
        this.offscreenCanvas.height = this.CH;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
    }

    setupConfiguration() {
        this.DEFAULT_CANDIDATES = 10;
        this.DEFAULT_MUTATIONS = 200;
        this.RMIN = 4;
        this.RMAX = 240;

        this.candidatesCount = this.DEFAULT_CANDIDATES;
        this.mutationsPerCandidate = this.DEFAULT_MUTATIONS;
    }

    setupEventListeners() {
        document.getElementById('startBtn').onclick = () => this.startOptimization();
        document.getElementById('pauseBtn').onclick = () => this.stopOptimization();

        this.imageInput = document.getElementById('imageInput');
        this.imageInput.addEventListener('change', (event) => this.handleImageUpload(event));

        const candidateInput = document.getElementById('candidateInput');
        const mutationInput = document.getElementById('mutationInput');
        [candidateInput, mutationInput].forEach(input => {
            input.addEventListener('change', () => this.updateConfiguration());
        });

        window.addEventListener('resize', () => this.updateLayout());
    }

    initializeState() {
        this.running = false;
        this.circlesPlaced = 0;
        this.totalFitness = 0;
        this.startTime = null;
        this.intervalId = null;
        this.imageReady = false;
        this.targetData = null;
        this.targetBox = { x: 0, y: 0, w: this.CW, h: this.CH };
        this.maxPossibleFitness = this.calculateMaxPossibleFitness();
    }

    calculateMaxPossibleFitness() {
        let totalPixels = 0;
        for (let y = Math.floor(this.targetBox.y); y < Math.ceil(this.targetBox.y + this.targetBox.h); y++) {
            for (let x = Math.floor(this.targetBox.x); x < Math.ceil(this.targetBox.x + this.targetBox.w); x++) {
                totalPixels++;
            }
        }
        return totalPixels * 3 * 255;
    }

    loadDefaultImage() {
        this.targetImage = new Image();
        this.targetImage.src = './assets/default.png';
        this.targetImage.onload = () => {
            this.drawImageToCanvas(this.targetImage);
            this.imageReady = true;
        };
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        img.onload = () => {
            this.drawImageToCanvas(img);
            this.imageReady = true;
        };
        img.src = URL.createObjectURL(file);
    }

    drawImageToCanvas(img) {
        const ratio = Math.min(this.CW / img.width, this.CH / img.height);
        const newW = img.width * ratio;
        const newH = img.height * ratio;
        const offsetX = (this.CW - newW) / 2;
        const offsetY = (this.CH - newH) / 2;

        this.imgCtx.clearRect(0, 0, this.CW, this.CH);
        this.imgCtx.imageSmoothingEnabled = true;
        this.imgCtx.imageSmoothingQuality = 'high';
        this.imgCtx.drawImage(img, offsetX, offsetY, newW, newH);

        this.targetBox = { x: offsetX, y: offsetY, w: newW, h: newH };
        this.updateTargetData();
        this.maxPossibleFitness = this.calculateMaxPossibleFitness();
    }

    updateTargetData() {
        this.targetData = this.imgCtx.getImageData(0, 0, this.CW, this.CH).data;
    }

    updateConfiguration() {
        this.candidatesCount = parseInt(document.getElementById('candidateInput').value) || this.DEFAULT_CANDIDATES;
        this.mutationsPerCandidate = parseInt(document.getElementById('mutationInput').value) || this.DEFAULT_MUTATIONS;
    }

    startOptimization() {
        if (!this.imageReady) {
            alert("Wait until image is loaded!");
            return;
        }

        this.running = true;
        this.circlesPlaced = 0;
        this.totalFitness = 0;
        this.startTimer();
        this.runOptimizationLoop();
    }

    stopOptimization() {
        this.running = false;
        this.stopTimer();
    }

    async runOptimizationLoop() {
        while (this.running) {
            await this.placeOneCircle();
        }
    }

    async placeOneCircle() {
        const rmin = this.RMIN;
        const rmax = this.RMAX;

        let candidates = Array.from({ length: this.candidatesCount }, () => {
            const r = Math.random() * (rmax - rmin) + rmin;
            const x = Math.random() * (this.targetBox.w - 2 * r) + this.targetBox.x + r;
            const y = Math.random() * (this.targetBox.h - 2 * r) + this.targetBox.y + r;
            return {
                x, y, r,
                rc: Math.random() * 255,
                gc: Math.random() * 255,
                bc: Math.random() * 255,
                bestScore: -Infinity
            };
        });

        let bestOverall = null;
        let bestOverallScore = -Infinity;
        const displayEvery = 3;

        for (let iter = 0; iter < this.mutationsPerCandidate; iter++) {
            for (const c of candidates) {
                const step = 8;
                const nx = Math.min(this.targetBox.x + this.targetBox.w,
                    Math.max(this.targetBox.x, c.x + (Math.random() - 0.5) * step));
                const ny = Math.min(this.targetBox.y + this.targetBox.h,
                    Math.max(this.targetBox.y, c.y + (Math.random() - 0.5) * step));

                const nr = Math.max(rmin, Math.min(rmax, c.r + (Math.random() - 0.5) * 6));
                const nrc = Math.min(255, Math.max(0, c.rc + (Math.random() - 0.5) * 25));
                const ngc = Math.min(255, Math.max(0, c.gc + (Math.random() - 0.5) * 25));
                const nbc = Math.min(255, Math.max(0, c.bc + (Math.random() - 0.5) * 25));

                const newScore = this.testCircle(nx, ny, nr, nrc, ngc, nbc);
                if (newScore > c.bestScore) {
                    Object.assign(c, { x: nx, y: ny, r: nr, rc: nrc, gc: ngc, bc: nbc, bestScore: newScore });
                }
                if (newScore > bestOverallScore) {
                    bestOverallScore = newScore;
                    bestOverall = { ...c };
                }
            }

            if (iter % displayEvery === 0) {
                this.drawCandidateOverlay(candidates, bestOverall);
                await new Promise(res => setTimeout(res, 0));
            }
        }

        if (!bestOverall) {
            bestOverall = candidates[0];
        }

        this.commitCircle(bestOverall);
        this.overlayCtx.clearRect(0, 0, this.CW, this.CH);

        this.circlesPlaced++;
        this.totalFitness += bestOverall.bestScore;
        this.updateStats();
        return bestOverall;
    }

    testCircle(x, y, r, rc, gc, bc) {
        const minX = Math.max(Math.floor(x - r - 1), Math.floor(this.targetBox.x));
        const maxX = Math.min(Math.ceil(x + r + 1), Math.ceil(this.targetBox.x + this.targetBox.w));
        const minY = Math.max(Math.floor(y - r - 1), Math.floor(this.targetBox.y));
        const maxY = Math.min(Math.ceil(y + r + 1), Math.ceil(this.targetBox.y + this.targetBox.h));

        const width = maxX - minX;
        const height = maxY - minY;

        if (width <= 0 || height <= 0) return -Infinity;

        const originalImage = this.drawCtx.getImageData(minX, minY, width, height);
        const origData = originalImage.data;

        this.offscreenCtx.clearRect(0, 0, width, height);
        this.offscreenCtx.putImageData(originalImage, 0, 0);

        this.offscreenCtx.fillStyle = `rgb(${rc},${gc},${bc})`;
        this.offscreenCtx.beginPath();
        this.offscreenCtx.arc(x - minX, y - minY, r, 0, Math.PI * 2);
        this.offscreenCtx.fill();

        const newData = this.offscreenCtx.getImageData(0, 0, width, height).data;

        let delta = 0;
        for (let yy = 0; yy < height; yy++) {
            for (let xx = 0; xx < width; xx++) {
                const i = (yy * width + xx) * 4;
                const ti = ((yy + minY) * this.CW + (xx + minX)) * 4;

                const oldDiff = Math.abs(origData[i] - this.targetData[ti]) +
                    Math.abs(origData[i + 1] - this.targetData[ti + 1]) +
                    Math.abs(origData[i + 2] - this.targetData[ti + 2]);

                const newDiff = Math.abs(newData[i] - this.targetData[ti]) +
                    Math.abs(newData[i + 1] - this.targetData[ti + 1]) +
                    Math.abs(newData[i + 2] - this.targetData[ti + 2]);

                delta += oldDiff - newDiff;
            }
        }

        return delta;
    }

    drawCandidateOverlay(candidates, currentBest) {
        this.overlayCtx.clearRect(0, 0, this.CW, this.CH);

        const scores = candidates.map(c => c.bestScore);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);

        for (const c of candidates) {
            const norm = (c.bestScore - minScore) / (maxScore - minScore + 1e-6);

            this.overlayCtx.fillStyle = `rgba(${c.rc}, ${c.gc}, ${c.bc}, ${0.2 + 0.3 * norm})`;
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            this.overlayCtx.fill();

            this.overlayCtx.globalAlpha = 0.1 + 0.4 * norm;
            this.overlayCtx.strokeStyle = `hsl(${120 * norm}, 100%, 50%)`;
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            this.overlayCtx.stroke();
            this.overlayCtx.globalAlpha = 1;
        }

        if (currentBest) {
            this.overlayCtx.globalAlpha = 1;
            this.overlayCtx.strokeStyle = 'yellow';
            this.overlayCtx.lineWidth = 2;
            this.overlayCtx.beginPath();
            this.overlayCtx.arc(currentBest.x, currentBest.y, currentBest.r, 0, Math.PI * 2);
            this.overlayCtx.stroke();
            this.overlayCtx.lineWidth = 1;
        }
    }

    commitCircle(c) {
        if (!c) return;

        this.drawCtx.fillStyle = `rgb(${c.rc}, ${c.gc}, ${c.bc})`;
        this.drawCtx.beginPath();
        this.drawCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        this.drawCtx.fill();
    }

    updateStats() {
        document.getElementById('circleCount').textContent = this.circlesPlaced;

        const similarityPercentage = (this.totalFitness / this.maxPossibleFitness) * 100;
        document.getElementById('totalFitness').textContent = similarityPercentage.toFixed(2) + '%';

        if (this.startTime) {
            document.getElementById('secondsRan').textContent = ((Date.now() - this.startTime) / 1000).toFixed(1);
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.intervalId = setInterval(() => this.updateStats(), 100);
    }

    stopTimer() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    setupLayout() {
        this.updateLayout();
    }

    updateLayout() {
        const container = document.getElementById('container');
        const canvasCount = document.querySelectorAll('.canvas-container').length;
        const gap = 20;

        const availableHeight = window.innerHeight - 200;
        const availableWidth = window.innerWidth;

        let heightRatio = 1080 / 1940;

        if (availableWidth >= availableHeight) {
            container.style.flexDirection = 'row';
        } else {
            container.style.flexDirection = 'column';
            heightRatio = 2180 / 960;
        }

        let newHeight = (availableWidth) * heightRatio;
        let newWidth = availableWidth;

        if (newHeight > availableHeight) {
            newHeight = availableHeight;
            newWidth = availableHeight / heightRatio;
        }

        container.style.width = newWidth + 'px';
        container.style.height = newHeight + 'px';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CircleApproximation();
});