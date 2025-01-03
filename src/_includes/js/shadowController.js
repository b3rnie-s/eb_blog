class ShadowController {
    constructor() {
        this.logo = document.querySelector('.logo');
        this.sections = document.querySelectorAll('.thoughts-section, .breadcrumbs-section');
        this.snake = document.querySelector('.snake-separator');
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;
        
        // Get root font size once and cache it
        this.rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        
        // Store initial positions
        const topInPx = parseFloat(getComputedStyle(this.logo).top);
        this.baseY = topInPx / this.rootFontSize;  // This should be 4rem from CSS
        const initialLeftInPx = parseFloat(getComputedStyle(this.logo).left);
        this.initialLeft = initialLeftInPx;
        
        // Calculate the width of the parabola and its center point
        const windowWidth = window.innerWidth;
        const rightEdge = windowWidth - 116; // Right boundary
        this.parabolaWidth = rightEdge - this.initialLeft;
        this.centerX = this.initialLeft + (this.parabolaWidth / 2);
        
        // Set initial scale
        this.logo.style.transform = `scale(${this.baseScale})`;
        // Set initial position explicitly
        this.logo.style.left = `${this.initialLeft}px`;
        this.logo.style.top = `${this.baseY}rem`;
        this.currentX = this.initialLeft;
        
        this.maxYOffset = 5; // rem units
        this.baseScale = 0.7;
        this.maxScaleBoost = 0.3;
        
        this.initDrag();
        
        // Calculate initial shadows
        this.updatePositionAndShadows();
        
        // Update on resize
        window.addEventListener('resize', () => {
            this.rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
            const topInPx = parseFloat(getComputedStyle(this.logo).top);
            this.baseY = topInPx / this.rootFontSize;
            const initialLeftInPx = parseFloat(getComputedStyle(this.logo).left);
            this.initialLeft = initialLeftInPx;
            
            // Update parabola dimensions
            const windowWidth = window.innerWidth;
            const rightEdge = windowWidth - 116;
            this.parabolaWidth = rightEdge - this.initialLeft;
            this.centerX = this.initialLeft + (this.parabolaWidth / 2);
            
            // Recalculate shadows after resize
            this.updatePositionAndShadows();
        });
    }

    // Helper methods for conversions
    pxToRem(px) {
        return px / this.rootFontSize;
    }

    remToPx(rem) {
        return rem * this.rootFontSize;
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
            const newX = this.logoStartX + cursorDelta;
            
            // Responsive bounds
            const minX = 16;
            const maxX = window.innerWidth - 116;
            const boundedX = Math.max(minX, Math.min(maxX, newX));
            
            // Calculate Y movement with responsive parabola
            const responsiveMaxOffset = Math.min(this.maxYOffset, window.innerWidth / 250);
            
            // Create parabola with vertex at center
            const a = responsiveMaxOffset / Math.pow(this.parabolaWidth / 2, 2);
            const yOffset = -a * Math.pow(boundedX - this.centerX, 2) + responsiveMaxOffset;
            const newY = this.baseY - yOffset;
            
            // Scale based on distance from center
            const distanceFromCenter = Math.abs(boundedX - this.centerX) / (this.parabolaWidth / 2);
            const scaleBoost = this.maxScaleBoost * (1 - distanceFromCenter);
            const newScale = this.baseScale + scaleBoost;
            
            this.logo.style.left = `${boundedX}px`;
            this.logo.style.top = `${newY}rem`;
            this.logo.style.transform = `scale(${newScale})`;
            this.currentX = boundedX;
            
            this.updatePositionAndShadows();
        };

        const stopDrag = () => {
            this.isDragging = false;
        };

        // Mouse events
        this.logo.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('mouseup', stopDrag);

        // Touch events
        this.logo.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', moveDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
    }

    calculateShadow(element, elementRect) {
        const logoRect = this.logo.getBoundingClientRect();
        const logoCenter = {
            x: logoRect.left + (logoRect.width / 2),
            y: logoRect.top + (logoRect.height / 2)
        };

        // Check if this is the Bits carousel
        const isBitsCarousel = element.classList.contains('thoughts-section');
        
        let elementCenter;
        if (isBitsCarousel) {
            // Get the visible thought
            const visibleThought = element.querySelector('.thought:not([hidden])');
            const visibleRect = visibleThought?.getBoundingClientRect();
            elementCenter = {
                x: visibleRect?.left + (visibleRect?.width / 2) || 0,
                y: visibleRect?.top + (visibleRect?.height / 2) || 0
            };
        } else {
            elementCenter = {
                x: elementRect.left + (elementRect.width / 2),
                y: elementRect.top + (elementRect.height / 2)
            };
        }

        const dx = elementCenter.x - logoCenter.x;
        const dy = elementCenter.y - logoCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const viewportFactor = Math.min(1, window.innerWidth / 1024);
        const isSnake = element.classList.contains('snake-separator');
        
        // Keep original shadow distances but scale by viewport
        const maxShadowX = isSnake ? 60 * viewportFactor : 60;
        const maxShadowY = isSnake ? 25 * viewportFactor : 25;
        
        // Calculate height factor (1 at lowest point, 0.3 at highest)
        const currentY = parseFloat(this.logo.style.top);
        const heightFactor = 0.3 + (0.9 * (currentY - (this.baseY - this.maxYOffset)) / this.maxYOffset);
        
        // Calculate shadows with direction and intensity
        const shadowIntensity = Math.min(1, 400 / (distance + 50));
        let shadowX = (dx / distance) * maxShadowX * shadowIntensity * heightFactor;
        let shadowY = (dy / distance) * maxShadowY * shadowIntensity * heightFactor;

        return { shadowX, shadowY };
    }

    updatePositionAndShadows() {
        this.sections.forEach(section => {
            const { shadowX, shadowY } = this.calculateShadow(section, section.getBoundingClientRect());
            section.style.boxShadow = `${shadowX}px ${shadowY}px 0px 0px rgba(3, 3, 4, 0.8)`;
            section.style.transform = `translate(${-shadowX/2}px, ${-shadowY/2}px)`;
        });
        
        const snakeShadow = this.calculateShadow(this.snake, this.snake.getBoundingClientRect());
        this.snake.style.filter = `drop-shadow(${snakeShadow.shadowX}px ${snakeShadow.shadowY}px 0px rgba(3, 3, 4, 0.6))`;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ShadowController());
} else {
    new ShadowController();
} 