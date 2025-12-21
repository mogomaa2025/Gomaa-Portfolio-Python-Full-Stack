const PortfolioConfig = {
    // Intro Animation Timings (in ms)
    INTRO: {
        REVEAL_DELAY: 300,
        COMPLETE_DELAY: 600,
        REMOVE_DELAY: 800,
        NAV_HIGHLIGHT_DURATION: 3000
    },

    // Easter Egg Configuration
    EASTER_EGG: {
        ENABLED: true,
        SHAKE_DURATION: 300,        // Duration of shake animation
        BUG_SPAWN_DELAY: 300,       // Delay before bugs appear after shake
        BUG_MIN_COUNT: 12,          // Minimum number of bugs
        BUG_MAX_ADDITIONAL: 7,      // Random additional bugs
        SUCCESS_MSG_DURATION: 1500, // How long "All Bugs Fixed" stays
        HINT_DURATION: 4000,        // How long "Click Here" hint stays (if not clicked)
        TOUR: {
            ENABLED: true,
            SECTION_DELAY: 1000,    // Time spent on each section during tour
            // Sections included in the tour
            SECTIONS: ['about', 'projects', 'skills', 'certifications', 'contact', 'home']
        }
    },

    // Typing Animation
    TYPING: {
        TEXTS: ['QA Automation Engineer', 'SDET', 'Python Developer', 'Test Architect'],
        TYPE_SPEED: 100,
        BACK_SPEED: 50,
        BACK_DELAY: 2000
    },

    // UI Configuration
    UI: {
        SCROLL_THRESHOLD: 100,      // Pixel threshold for scroll interactions
        TOAST_DURATION: 3000,       // Duration for toast notifications
        THEME: {
            DEFAULT: 'dark',
            TERMINAL_MODE_CLASS: 'terminal-mode'
        }
    }
};

// Make config globally available if needed
window.PortfolioConfig = PortfolioConfig;
