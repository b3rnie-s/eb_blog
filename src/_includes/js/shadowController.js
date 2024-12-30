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
        
        this.maxYOffset = 5; // rem units
        this.baseScale = 0.7;
        this.maxScaleBoost = 0.3;
        
        this.initDrag();
        
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

    calculateShadow(elementRect) {
        const logoRect = this.logo.getBoundingClientRect();
        const logoCenter = {
            x: logoRect.left + (logoRect.width / 2),
            y: logoRect.top + (logoRect.height / 2)
        };
        
        const elementCenter = {
            x: elementRect.left + (elementRect.width / 2),
            y: elementRect.top + (elementRect.height / 2)
        };

        const dx = elementCenter.x - logoCenter.x;
        const dy = elementCenter.y - logoCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust shadow length based on logo's height
        const maxShadowX = 14;
        const maxShadowY = 7;
        const distanceDivisor = 300;
        
        // Calculate height factor (1 at lowest point, 0.3 at highest)
        const currentY = parseFloat(this.logo.style.top);
        const heightFactor = 0.3 + (0.7 * (currentY - (this.baseY - this.maxYOffset)) / this.maxYOffset);
        
        let shadowLength = Math.min(maxShadowX, (distance / distanceDivisor) * maxShadowX * heightFactor);

        let shadowX = (dx / distance) * shadowLength;
        let shadowY = (dy / distance) * shadowLength;

        // Amplify horizontal movement
        shadowX *= 2;
        shadowX = Math.min(Math.max(shadowX, -maxShadowX), maxShadowX);

        // Clamp vertical shadow
        shadowY = Math.min(Math.max(shadowY, -maxShadowY), maxShadowY);

        return { shadowX, shadowY };
    }

    updatePositionAndShadows() {
        this.sections.forEach(section => {
            section.style.willChange = 'transform, box-shadow';
            const { shadowX, shadowY } = this.calculateShadow(section.getBoundingClientRect());
            
            section.style.boxShadow = `${shadowX}px ${shadowY}px 0px 0px rgba(3, 3, 4, 0.8)`;
            section.style.transform = `translate(${-shadowX/2}px, ${-shadowY/2}px)`;
        });
        
        const snakeShadow = this.calculateShadow(this.snake.getBoundingClientRect());
        this.snake.style.willChange = 'filter';
        this.snake.style.filter = `drop-shadow(${snakeShadow.shadowX}px ${snakeShadow.shadowY}px 0px rgba(3, 3, 4, 0.8))`;
        
        setTimeout(() => {
            this.sections.forEach(section => section.style.willChange = 'auto');
            this.snake.style.willChange = 'auto';
        }, 200);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new ShadowController());
} else {
    new ShadowController();
} 