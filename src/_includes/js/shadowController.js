class ShadowController {
    constructor() {
        this.logo = document.querySelector('.logo');
        this.sections = document.querySelectorAll('.thoughts-section, .breadcrumbs-section');
        this.snake = document.querySelector('.snake-separator');
        this.isDragging = false;
        this.startY = 0;
        this.startX = 0;
        this.minY = 2;
        this.currentY = this.minY;
        this.currentX = 0;
        this.maxY = window.innerHeight;
        this.isMobile = window.matchMedia('(max-width: 1024px)').matches;
        
        this.initDrag();
        window.addEventListener('resize', () => {
            this.isMobile = window.matchMedia('(max-width: 1024px)').matches;
            this.maxY = window.innerHeight;
        });
        
        // Initial shadow calculation
        this.updatePositionAndShadows();
    }

    initDrag() {
        this.logo.style.cursor = this.isMobile ? 'ew-resize' : 'ns-resize';
        
        const logoImage = this.logo.querySelector('.logo-image');
        if (logoImage) {
            logoImage.style.pointerEvents = 'auto';
        }
        
        const startDrag = (e) => {
            this.isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            
            if (this.isMobile) {
                const currentLeft = parseFloat(getComputedStyle(this.logo).left);
                this.startX = touch.clientX - currentLeft;
            } else {
                const currentTop = parseFloat(getComputedStyle(this.logo).top);
                this.startY = touch.clientY - currentTop;
            }
            
            document.body.style.userSelect = 'none';
            e.preventDefault();
        };

        const moveDrag = (e) => {
            if (!this.isDragging) return;
            
            requestAnimationFrame(() => {
                const touch = e.touches ? e.touches[0] : e;
                
                if (this.isMobile) {
                    // Horizontal dragging for mobile
                    const minX = 16; // 1rem
                    const maxX = window.innerWidth - 116; // window width - logo width - 1rem
                    const newX = Math.max(minX, Math.min(maxX, touch.clientX - this.startX));
                    this.currentX = newX;
                    this.logo.style.left = `${newX}px`;
                } else {
                    // Vertical dragging for desktop
                    const newY = Math.max(this.minY * 16, Math.min(this.maxY, touch.clientY - this.startY));
                    this.currentY = newY / 16;
                    this.logo.style.top = `${this.currentY}rem`;
                }
                
                this.updatePositionAndShadows();
            });
        };

        const stopDrag = () => {
            this.isDragging = false;
            document.body.style.userSelect = '';
        };

        // Mouse events
        this.logo.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('mouseleave', stopDrag);

        // Touch events
        this.logo.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', moveDrag, { passive: false });
        document.addEventListener('touchend', stopDrag);
        document.addEventListener('touchcancel', stopDrag);
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
        
        const maxShadowX = 14;
        const maxShadowY = 7;
        const distanceDivisor = 300;
        let shadowLength = Math.min(maxShadowX, (distance / distanceDivisor) * maxShadowX);

        let shadowX = (dx / distance) * shadowLength;
        let shadowY = (dy / distance) * shadowLength;

        // Amplify horizontal movement on mobile
        if (this.isMobile) {
            shadowX *= 2;
            shadowX = Math.min(Math.max(shadowX, -maxShadowX), maxShadowX);
        }

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