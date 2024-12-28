class ThoughtsCarousel {
    constructor() {
        this.container = document.querySelector('.thought-container');
        if (!this.container) return;

        this.thoughts = Array.from(this.container.querySelectorAll('.thought'));
        this.prevBtn = document.querySelector('.thought-controls .prev');
        this.nextBtn = document.querySelector('.thought-controls .next');
        this.currentIndex = 0;
        this.maxIndex = this.thoughts.length - 1;

        this.bindEvents();
        this.updateButtonStates();
    }

    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.showPrevious());
        this.nextBtn.addEventListener('click', () => this.showNext());
        
        // Add keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.showPrevious();
            if (e.key === 'ArrowRight') this.showNext();
        });
    }

    showThought(index) {
        this.thoughts.forEach(thought => thought.hidden = true);
        this.thoughts[index].hidden = false;
        this.currentIndex = index;
        this.updateButtonStates();
        this.updateDateTime();
    }

    showPrevious() {
        if (this.currentIndex > 0) {
            this.showThought(this.currentIndex - 1);
        }
    }

    showNext() {
        if (this.currentIndex < this.maxIndex) {
            this.showThought(this.currentIndex + 1);
        }
    }

    updateButtonStates() {
        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex === this.maxIndex;
    }

    updateDateTime() {
        const currentThought = this.thoughts[this.currentIndex];
        const date = currentThought.dataset.date;
        const dateDisplay = document.querySelector('.thoughts-header time');
        if (dateDisplay && date) {
            const thoughtDate = new Date(date);
            dateDisplay.textContent = thoughtDate.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            dateDisplay.setAttribute('datetime', date);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ThoughtsCarousel();
});