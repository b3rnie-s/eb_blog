// Utility class for position calculations
class PositionCalculator {
    // Class-level constants
    static BOUNDS = {
        LEFT_MARGIN: 16,
        RIGHT_PADDING: 116,
        BASE_SCALE: 0.7,
        SCALE_BOOST: 0.3
    };

    constructor(rootFontSize, baseY, maxYOffset, windowWidth) {
        this.rootFontSize = rootFontSize;
        this.baseY = baseY;
        this.maxYOffset = maxYOffset;
        
        // Use constants instead of magic numbers
        this.baseScale = PositionCalculator.BOUNDS.BASE_SCALE;
        this.maxScaleBoost = PositionCalculator.BOUNDS.SCALE_BOOST;
        
        this.updateDimensions(windowWidth);
    }

    updateDimensions(windowWidth) {
        const { LEFT_MARGIN, RIGHT_PADDING } = PositionCalculator.BOUNDS;
        this.minX = LEFT_MARGIN;
        this.maxX = windowWidth - RIGHT_PADDING;
        this.parabolaWidth = this.maxX - this.minX;
        this.centerX = this.minX + (this.parabolaWidth / 2);
        this.responsiveMaxOffset = Math.min(this.maxYOffset, windowWidth / 250);
    }

    calculateParabolaPosition(x) {
        const a = this.responsiveMaxOffset / Math.pow(this.parabolaWidth / 2, 2);
        const yOffset = -a * Math.pow(x - this.centerX, 2) + this.responsiveMaxOffset;
        return {
            y: this.baseY - yOffset,
            scale: this.calculateScale(x)
        };
    }

    calculateScale(x) {
        const distanceFromCenter = Math.abs(x - this.centerX) / (this.parabolaWidth / 2);
        const scaleBoost = this.maxScaleBoost * (1 - distanceFromCenter);
        return this.baseScale + scaleBoost;
    }

    getBoundedX(x) {
        const minX = 16;
        const maxX = window.innerWidth - 116;
        return Math.max(minX, Math.min(maxX, x));
    }

    calculateTimePosition() {
        const now = new Date();
        const timePercentage = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);
        const minX = 16;
        const maxX = window.innerWidth - 116;
        return minX + (maxX - minX) * timePercentage;
    }
}

// Utility class for shadow calculations
class ShadowCalculator {
    calculateShadow(logo, element, elementRect, baseY, maxYOffset) {
        const logoRect = logo.getBoundingClientRect();
        const logoCenter = {
            x: logoRect.left + (logoRect.width / 2),
            y: logoRect.top + (logoRect.height / 2)
        };

        const elementCenter = this.getElementCenter(element, elementRect);
        const dx = elementCenter.x - logoCenter.x;
        const dy = elementCenter.y - logoCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const viewportFactor = Math.min(1, window.innerWidth / 1024);
        const isSnake = element.classList.contains('snake-separator');
        
        const maxShadowX = isSnake ? 60 * viewportFactor : 60;
        const maxShadowY = isSnake ? 25 * viewportFactor : 25;
        
        const currentY = parseFloat(logo.style.top);
        const heightFactor = 0.3 + (0.9 * (currentY - (baseY - maxYOffset)) / maxYOffset);
        
        const shadowIntensity = Math.min(1, 400 / (distance + 50));
        return {
            shadowX: (dx / distance) * maxShadowX * shadowIntensity * heightFactor,
            shadowY: (dy / distance) * maxShadowY * shadowIntensity * heightFactor
        };
    }

    getElementCenter(element, elementRect) {
        if (element.classList.contains('thoughts-section')) {
            const visibleThought = element.querySelector('.thought:not([hidden])');
            const visibleRect = visibleThought?.getBoundingClientRect();
            return {
                x: visibleRect?.left + (visibleRect?.width / 2) || 0,
                y: visibleRect?.top + (visibleRect?.height / 2) || 0
            };
        }
        
        return {
            x: elementRect.left + (elementRect.width / 2),
            y: elementRect.top + (elementRect.height / 2)
        };
    }
}

class ShadowController {
    constructor() {
        this.initializeElements();
        this.initializeState();
        this.calculator = new PositionCalculator(
            this.rootFontSize,
            this.baseY,
            this.maxYOffset,
            window.innerWidth
        );
        this.shadowCalculator = new ShadowCalculator();
        
        this.setInitialPosition();
        this.initDrag();
        this.initializeCanvas();
        this.setupResizeHandler();
    }

    initializeElements() {
        this.logo = document.querySelector('.logo');
        this.sections = document.querySelectorAll('.thoughts-section, .breadcrumbs-section');
        this.snake = document.querySelector('.snake-separator');
        this.canvas = document.getElementById('pathCanvas');
        this.rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

    initializeState() {
        this.isDragging = false;
        this.maxYOffset = 5;
        const topInPx = parseFloat(getComputedStyle(this.logo).top);
        this.baseY = topInPx / this.rootFontSize;
        this.initialLeft = parseFloat(getComputedStyle(this.logo).left);
    }

    setInitialPosition() {
        const timeBasedX = this.calculator.calculateTimePosition();
        this.currentX = timeBasedX;
        
        const position = this.calculator.calculateParabolaPosition(timeBasedX);
        
        this.logo.style.left = `${timeBasedX}px`;
        this.logo.style.top = `${position.y}rem`;
        this.logo.style.transform = `scale(${position.scale})`;
        
        this.updatePositionAndShadows();
    }

    initDrag() {
        const startDrag = (e) => {
            this.isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            const logoRect = this.logo.getBoundingClientRect();
            this.logoStartX = logoRect.left;
            this.cursorStartX = touch.clientX;
            e.preventDefault();
        };

        const moveDrag = (e) => {
            if (!this.isDragging) return;
            
            const touch = e.touches ? e.touches[0] : e;
            const cursorDelta = touch.clientX - this.cursorStartX;
            const newX = this.calculator.getBoundedX(this.logoStartX + cursorDelta);
            
            const position = this.calculator.calculateParabolaPosition(newX);
            
            this.logo.style.left = `${newX}px`;
            this.logo.style.top = `${position.y}rem`;
            this.logo.style.transform = `scale(${position.scale})`;
            this.currentX = newX;
            
            this.updatePositionAndShadows();
        };

        const stopDrag = () => {
            this.isDragging = false;
        };

        this.attachEventListeners(startDrag, moveDrag, stopDrag);
    }

    attachEventListeners(startDrag, moveDrag, stopDrag) {
        this.logo.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('mouseup', stopDrag);

        this.logo.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', moveDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

    updatePositionAndShadows() {
        this.sections.forEach(section => {
            const shadow = this.shadowCalculator.calculateShadow(
                this.logo, 
                section, 
                section.getBoundingClientRect(),
                this.baseY,
                this.maxYOffset
            );
            section.style.boxShadow = `${shadow.shadowX}px ${shadow.shadowY}px 0px 0px rgba(3, 3, 4, 0.8)`;
            section.style.transform = `translate(${-shadow.shadowX/2}px, ${-shadow.shadowY/2}px)`;
        });
        
        const snakeShadow = this.shadowCalculator.calculateShadow(
            this.logo,
            this.snake,
            this.snake.getBoundingClientRect(),
            this.baseY,
            this.maxYOffset
        );
        this.snake.style.filter = `drop-shadow(${snakeShadow.shadowX}px ${snakeShadow.shadowY}px 0px rgba(3, 3, 4, 0.6))`;
    }

    initializeCanvas() {
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resizeCanvas();
            this.drawPath();
        }
    }

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.ctx.setLineDash([15, 40]);
        this.ctx.strokeStyle = 'rgba(3, 3, 4, 0.6)';
        this.ctx.lineWidth = 2.5;
    }

    drawPath() {
        const logoImage = this.logo.querySelector('.logo-image');
        const logoRect = logoImage.getBoundingClientRect();
        const logoXOffset = logoRect.width / 2;
        const logoYOffset = logoRect.height / 2;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        
        for (let x = 0; x <= window.innerWidth; x += 2) {
            const position = this.calculator.calculateParabolaPosition(x);
            const y = position.y * this.rootFontSize;
            
            if (x === 0) {
                this.ctx.moveTo(x + logoXOffset, y + logoYOffset);
            } else {
                this.ctx.lineTo(x + logoXOffset, y + logoYOffset);
            }
        }
        
        this.ctx.stroke();
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const topInPx = parseFloat(getComputedStyle(this.logo).top);
            this.baseY = topInPx / this.rootFontSize;
            this.initialLeft = parseFloat(getComputedStyle(this.logo).left);
            
            this.calculator.updateDimensions(window.innerWidth);
            
            this.updatePositionAndShadows();
            if (this.canvas) {
                this.resizeCanvas();
                this.drawPath();
            }
        });
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ShadowController());
} else {
    new ShadowController();
} 