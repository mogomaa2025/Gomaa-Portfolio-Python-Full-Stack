// Portfolio Website JavaScript
class PortfolioApp {
    constructor() {
        window.portfolioApp = this;
        this.currentSection = 'home';
        // Projects filtering state
        this._initialProjectFilter = null;
        this._initialProjectFilterApplied = false;
        this._projectsLoaded = false;
        this._categoriesLoaded = false;
        this.currentTheme = 'dark';
        this.isTerminalMode = false;
        this.typingTexts = [
            'Manual Testing',
            'Automation Testing',
            'Api Testing'
        ];
        this.currentTextIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        
        // Visit tracking state
        this.currentVisitId = null;
        this.currentVisitStartTime = null;
        this.visitUpdateInterval = null;
        this.typingTimeout = null;
        this.config = window.PortfolioConfig || {};
        this.typingSpeed = this.config.TYPING?.TYPE_SPEED || 100;
        this.deletingSpeed = this.config.TYPING?.BACK_SPEED || 50;
        this.pauseTime = this.config.TYPING?.BACK_DELAY || 2000;
        
        this.init();
    }

    init() {
        // Start intro animation immediately
        this.initIntroAnimation();
        
        this.setupEventListeners();
        this.setupGlobalYouTubeHandler(); // Global event delegation for YouTube placeholders
        // Note: Video fullscreen in portrait mode is handled via modal in index.html
        this.startTypingAnimation();
        this.showSection('home');
        this.loadCategoriesAndRenderFilters(); // NEW: dynamically render filter buttons
        this.loadProjects();
        this.loadSkills();
        this.loadConfig();
        this.loadAboutSection();
        this.loadContactSection();
        this.loadCertificationCategoriesAndFilters();
        this.loadCertifications();
        this.initImageModal();
        this.trackVisit('home');
    }

    // ===== AMAZING INTRO ANIMATION =====
    initIntroAnimation() {
        const introOverlay = document.getElementById('intro-overlay');
        const particlesContainer = document.getElementById('intro-particles');
        const app = document.querySelector('.app');
        
        if (!introOverlay || !particlesContainer || !app) return;
        
        // Create floating particles
        this.createParticles(particlesContainer, 30);
        
        // Timeline sequence from config
        setTimeout(() => {
            // Start curtain reveal
            introOverlay.classList.add('reveal');
            app.classList.add('visible');
        }, PortfolioConfig.INTRO.REVEAL_DELAY);
        
        setTimeout(() => {
            // Mark as complete (will fade out)
            introOverlay.classList.add('complete');
            introOverlay.classList.add('hidden');
            
            // Trigger hero content animations
            const heroContent = document.querySelector('.hero-content');
            if (heroContent) {
                heroContent.classList.add('animate');
            }
            
            // Add highlight glow to bottom nav
            this.triggerNavHighlight();
        }, PortfolioConfig.INTRO.COMPLETE_DELAY);
        
        // Remove overlay from DOM after animation completes
        setTimeout(() => {
            introOverlay.remove();
            
            // Show Click Here hints on profile image and logo after intro
            if (window.bugSquashAnimation) {
                window.bugSquashAnimation.showClickMeHints();
            }
        }, PortfolioConfig.INTRO.REMOVE_DELAY);
    }
    
    createParticles(container, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'intro-particle';
            
            // Random positioning
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            
            // Random size variation
            const size = 3 + Math.random() * 6;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            
            // Random animation delay for visual variety
            particle.style.animationDelay = Math.random() * 4 + 's';
            particle.style.animationDuration = (3 + Math.random() * 3) + 's';
            
            // Random opacity
            particle.style.opacity = 0.3 + Math.random() * 0.7;
            
            container.appendChild(particle);
        }
    }
    // ===== END INTRO ANIMATION =====


    // Note: Video fullscreen in portrait mode is handled via modal in index.html

    // Global event delegation for YouTube placeholders - works for any dynamically created placeholders
    // Uses YouTube IFrame API to properly enforce start/end times
    setupGlobalYouTubeHandler() {
        // Load YouTube IFrame API if not already loaded
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
        
        // Store active YouTube players for cleanup
        this._ytPlayers = this._ytPlayers || {};
        this._ytPlayerIdCounter = this._ytPlayerIdCounter || 0;
        
        document.addEventListener('click', (e) => {
            // Find if click was on or inside a YouTube placeholder
            const placeholder = e.target.closest('.yt-placeholder');
            if (!placeholder) return;
            
            // Only handle placeholders inside project cards
            if (!placeholder.closest('.project-card')) return;
            
            const videoId = placeholder.dataset.youtubeId;
            if (!videoId) return;
            
            // Get optional params (start, end times)
            const ytParams = placeholder.dataset.youtubeParams || '';
            
            // Parse start and end from params
            let startTime = 0;
            let endTime = null;
            if (ytParams) {
                const startMatch = ytParams.match(/start=(\d+)/);
                const endMatch = ytParams.match(/end=(\d+)/);
                if (startMatch) startTime = parseInt(startMatch[1], 10);
                if (endMatch) endTime = parseInt(endMatch[1], 10);
            }
            
            // Debug logging
            console.log('[YouTube Debug] Video ID:', videoId);
            console.log('[YouTube Debug] Params from data attribute:', ytParams);
            console.log('[YouTube Debug] Parsed start time:', startTime);
            console.log('[YouTube Debug] Parsed end time:', endTime);
            
            e.preventDefault();
            e.stopPropagation();
            
            // Stop all other media first
            this.stopAllYouTubePlayers();
            
            // Pause all HTML5 videos
            document.querySelectorAll('.project-card video').forEach(v => {
                try { v.pause(); } catch (err) {}
                try { v.currentTime = 0; } catch (err) {}
            });
            
            // Create a unique container for the player
            const playerId = `yt-player-${++this._ytPlayerIdCounter}`;
            const container = document.createElement('div');
            container.id = playerId;
            container.className = 'yt-player-container';
            container.dataset.endTime = endTime || '';
            container.dataset.youtubeParams = ytParams;
            
            // Replace placeholder with container
            placeholder.replaceWith(container);
            
            // Wait for YouTube API to be ready, then create player
            const createPlayer = () => {
                if (window.YT && window.YT.Player) {
                    const player = new YT.Player(playerId, {
                        videoId: videoId,
                        playerVars: {
                            autoplay: 1,
                            start: startTime,
                            enablejsapi: 1,
                            rel: 0,
                            modestbranding: 1
                        },
                        events: {
                            onReady: (event) => {
                                console.log('[YouTube Debug] Player ready, storing reference');
                                // Store player reference
                                this._ytPlayers[playerId] = {
                                    player: event.target,
                                    endTime: endTime,
                                    endTimeout: null
                                };
                                
                                // If we have an end time, use timeout-based approach
                                // This is more reliable than API-based time tracking due to cross-origin restrictions
                                if (endTime !== null) {
                                    const duration = (endTime - startTime) * 1000; // Convert to milliseconds
                                    console.log(`[YouTube Debug] Setting timeout to pause after ${duration/1000} seconds`);
                                    
                                    this._ytPlayers[playerId].endTimeout = setTimeout(() => {
                                        console.log('[YouTube Debug] End time reached via timeout, pausing...');
                                        try {
                                            event.target.pauseVideo();
                                        } catch (e) {
                                            console.log('[YouTube Debug] pauseVideo failed, trying alternative');
                                        }
                                        
                                        // Show end overlay
                                        const iframe = event.target.getIframe();
                                        if (iframe) {
                                            const wrapper = iframe.parentElement;
                                            if (wrapper && !wrapper.querySelector('.yt-end-overlay')) {
                                                const overlay = document.createElement('div');
                                                overlay.className = 'yt-end-overlay';
                                                overlay.innerHTML = `
                                                    <div class="yt-end-message">
                                                        <span>▶</span> Video clip ended (${Math.floor(endTime/60)}:${(endTime%60).toString().padStart(2,'0')})
                                                    </div>
                                                `;
                                                overlay.addEventListener('click', () => {
                                                    // Restart from beginning on click
                                                    try {
                                                        event.target.seekTo(startTime);
                                                        event.target.playVideo();
                                                    } catch (e) {}
                                                    overlay.remove();
                                                    // Set new timeout
                                                    this._ytPlayers[playerId].endTimeout = setTimeout(() => {
                                                        try { event.target.pauseVideo(); } catch(e) {}
                                                    }, duration);
                                                });
                                                wrapper.style.position = 'relative';
                                                wrapper.appendChild(overlay);
                                            }
                                        }
                                    }, duration);
                                }
                            },
                            onStateChange: (event) => {
                                // If video ends naturally or is paused by user, clean up timeout
                                if (event.data === YT.PlayerState.ENDED || event.data === YT.PlayerState.PAUSED) {
                                    if (this._ytPlayers[playerId] && this._ytPlayers[playerId].endTimeout) {
                                        clearTimeout(this._ytPlayers[playerId].endTimeout);
                                    }
                                }
                                // If video starts playing again, restart the timeout
                                if (event.data === YT.PlayerState.PLAYING && endTime !== null) {
                                    // Clear existing timeout first
                                    if (this._ytPlayers[playerId] && this._ytPlayers[playerId].endTimeout) {
                                        clearTimeout(this._ytPlayers[playerId].endTimeout);
                                    }
                                    // Calculate remaining time based on current position
                                    try {
                                        const currentTime = event.target.getCurrentTime() || startTime;
                                        const remaining = Math.max(0, (endTime - currentTime) * 1000);
                                        console.log(`[YouTube Debug] Playing from ${currentTime}s, timeout in ${remaining/1000}s`);
                                        this._ytPlayers[playerId].endTimeout = setTimeout(() => {
                                            console.log('[YouTube Debug] Timeout reached, pausing...');
                                            try { event.target.pauseVideo(); } catch(e) {}
                                        }, remaining);
                                    } catch(e) {
                                        console.log('[YouTube Debug] getCurrentTime failed, using fixed timeout');
                                    }
                                }
                            }
                        }
                    });
                } else {
                    // API not ready yet, wait and retry
                    setTimeout(createPlayer, 100);
                }
            };
            
            createPlayer();
        });
    }
    
    // Monitor video playback and pause at end time
    startEndTimeMonitor(playerId, endTime) {
        console.log('[YouTube Debug] Starting end time monitor for player:', playerId, 'End time:', endTime);
        const playerData = this._ytPlayers[playerId];
        if (!playerData || !playerData.player) return;
        
        // Clear any existing interval
        if (playerData.checkInterval) {
            clearInterval(playerData.checkInterval);
        }
        
        // Check every 500ms
        let lastLogTime = 0;
        playerData.checkInterval = setInterval(() => {
            try {
                const currentTime = playerData.player.getCurrentTime();
                
                // Log every 5 seconds to avoid spam
                if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== lastLogTime) {
                    lastLogTime = Math.floor(currentTime);
                    console.log(`[YouTube Debug] Current time: ${currentTime.toFixed(1)}s, End time: ${endTime}s`);
                }
                
                if (currentTime >= endTime) {
                    console.log('[YouTube Debug] Reached end time! Pausing video...');
                    playerData.player.pauseVideo();
                    clearInterval(playerData.checkInterval);
                    
                    // Show end overlay
                    const iframe = playerData.player.getIframe();
                    if (iframe) {
                        const wrapper = iframe.parentElement;
                        if (wrapper && !wrapper.querySelector('.yt-end-overlay')) {
                            const overlay = document.createElement('div');
                            overlay.className = 'yt-end-overlay';
                            overlay.innerHTML = `
                                <div class="yt-end-message">
                                    <span>▶</span> Video clip ended
                                </div>
                            `;
                            overlay.addEventListener('click', () => {
                                // Restart from beginning on click
                                playerData.player.seekTo(0);
                                playerData.player.playVideo();
                                overlay.remove();
                                this.startEndTimeMonitor(playerId, endTime);
                            });
                            wrapper.style.position = 'relative';
                            wrapper.appendChild(overlay);
                        }
                    }
                }
            } catch (err) {
                // Player might be destroyed, clean up
                clearInterval(playerData.checkInterval);
            }
        }, 500);
    }
    
    // Stop all YouTube players and clean up
    stopAllYouTubePlayers() {
        for (const playerId in this._ytPlayers) {
            const playerData = this._ytPlayers[playerId];
            if (playerData) {
                if (playerData.checkInterval) {
                    clearInterval(playerData.checkInterval);
                }
                try {
                    if (playerData.player && playerData.player.stopVideo) {
                        playerData.player.stopVideo();
                    }
                } catch (err) {}
            }
        }
        
        // Also handle any iframes that might have been created outside this system
        document.querySelectorAll('.project-card iframe.yt-iframe, .project-card iframe[src*="youtube.com/embed/"]').forEach(fr => {
            try {
                const src = fr.getAttribute('src') || '';
                const m = src.match(/embed\/([^?&/]+)/);
                const otherId = m ? m[1] : null;
                const paramsMatch = src.match(/[?&](start=\d+|end=\d+)/g);
                const preservedParams = paramsMatch ? paramsMatch.map(p => p.replace(/^[?&]/, '')).join('&') : '';
                if (otherId) {
                    const thumb = `https://img.youtube.com/vi/${otherId}/hqdefault.jpg`;
                    const paramsAttr = preservedParams ? ` data-youtube-params="${preservedParams}"` : '';
                    fr.outerHTML = `
                      <div class="yt-placeholder" data-youtube-id="${otherId}"${paramsAttr} role="button" aria-label="Play YouTube video">
                        <img src="${thumb}" alt="YouTube thumbnail" class="yt-thumb">
                        <div class="yt-play-btn">▶</div>
                      </div>
                    `;
                }
            } catch (err) {}
        });
    }

    loadCategoriesAndRenderFilters() {
        Promise.all([
            fetch('/api/categories').then(res => res.json()),
            fetch('/api/config').then(res => res.json()).catch(() => ({}))
        ])
            .then(([categories, config]) => {
                // Render categories in the exact order returned by /api/categories
                // (which reflects the saved order in data/categories.json).
                const container = document.getElementById('filter-buttons-container');
                if (!container) return;
                container.innerHTML = '';

                const showAll = (config && typeof config.show_all_category_filter !== 'undefined')
                    ? Boolean(config.show_all_category_filter)
                    : false;

                // Decide which filter should be applied by default on page load.
                // Requirement: default should be the first category tab (not "all").
                const firstCategory = (Array.isArray(categories) && categories.length > 0)
                    ? String(categories[0].name || '').toLowerCase()
                    : null;
                this._initialProjectFilter = firstCategory;

                // Add category buttons
                categories.forEach((cat, idx) => {
                    const btn = document.createElement('button');
                    const filterVal = String(cat.name || '').toLowerCase();
                    btn.className = `filter-btn${idx === 0 ? ' active' : ''}`;
                    btn.dataset.filter = filterVal;
                    btn.textContent = cat.name;
                    btn.addEventListener('click', (e) => {
                        this.filterProjects(filterVal);
                        this.updateActiveFilter(e.target);
                    });
                    container.appendChild(btn);
                });

                this._categoriesLoaded = true;

                // If projects already loaded, apply the default filter now.
                this.applyInitialProjectsFilterIfReady();
            });
    }

    loadConfig() {
        fetch('/api/config')
            .then(response => response.json())
            .then(config => {
                document.getElementById('logo-text').textContent = config.logo_text || 'Portfolio';
                
                let profileImageUrl = '/static/profile.jpg'; // Default image
                if (config.profile_image) {
                    profileImageUrl = `/static/${config.profile_image}`;
                } else if (config.profile_image_url) {
                    profileImageUrl = config.profile_image_url;
                }
                document.getElementById('profile-image').src = profileImageUrl;

                document.getElementById('hero-title').innerHTML = config.hero_title || '';
                this.typingTexts = config.hero_subtitle && config.hero_subtitle.length ? config.hero_subtitle : [''];
                this.startTypingAnimation();
                document.getElementById('location-text').textContent = config.location || '';

                const socialLinksContainer = document.getElementById('social-links');
                socialLinksContainer.innerHTML = '';
                if (config.social_links && config.social_links.length) {
                    config.social_links.forEach(link => {
                        const linkElement = document.createElement('a');
                        linkElement.href = link.url;
                        const titleClass = (link.title || '').toLowerCase().replace(/\s+/g, '-');
                        linkElement.className = `social-link ${titleClass}`;
                        linkElement.title = link.title;
                        linkElement.innerHTML = link.icon;
                        if (link.url.startsWith('http')) {
                            linkElement.target = '_blank';
                        }
                        socialLinksContainer.appendChild(linkElement);
                    });
                }
            })
            .catch(error => console.error('Error loading config:', error));
    }

    loadAboutSection() {
        fetch('/api/about')
            .then(response => response.json())
            .then(data => {
                document.getElementById('about-description').innerHTML = data.description || '';

                const tagsContainer = document.getElementById('about-tags');
                tagsContainer.innerHTML = '';
                if (data.tags && data.tags.length) {
                    data.tags.forEach(tagText => {
                        const tagElement = document.createElement('span');
                        tagElement.className = 'tag';
                        tagElement.textContent = tagText;
                        tagsContainer.appendChild(tagElement);
                    });
                }

                const timelineContainer = document.getElementById('about-timeline');
                timelineContainer.innerHTML = '';
                if (data.timeline && data.timeline.length) {
                    data.timeline.forEach(item => {
                        const timelineItem = document.createElement('div');
                        timelineItem.className = 'timeline-item';
                        timelineItem.innerHTML = `
                            <div class="timeline-year">${item.year}</div>
                            <div class="timeline-content">${item.content}</div>
                        `;
                        timelineContainer.appendChild(timelineItem);
                    });
                }
            })
            .catch(error => console.error('Error loading about section:', error));
    }

    loadContactSection() {
        fetch('/api/contact')
            .then(response => response.json())
            .then(data => {
                document.getElementById('contact-description').innerHTML = data.description || '';

                const itemsContainer = document.getElementById('contact-items');
                itemsContainer.innerHTML = '';
                if (data.items && data.items.length) {
                    data.items.forEach(item => {
                        const contactItem = document.createElement('div');
                        contactItem.className = 'contact-item';
                        contactItem.innerHTML = `
                            ${item.icon}
                            <a href="${item.link}" ${item.link.startsWith('http') ? 'target="_blank"' : ''}>${item.text}</a>
                        `;
                        itemsContainer.appendChild(contactItem);
                    });
                }
            })
            .catch(error => console.error('Error loading contact section:', error));
    }


    setupEventListeners() {
        // Track final stay duration when leaving or hiding the page
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.updateVisitDuration();
            }
        });
        window.addEventListener('beforeunload', () => this.updateVisitDuration());

        // Theme toggle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Terminal toggle
        const terminalToggle = document.querySelector('.terminal-toggle');
        if (terminalToggle) {
            terminalToggle.addEventListener('click', () => this.toggleTerminalMode());
        }

        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Project filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterProjects(filter);
                this.updateActiveFilter(e.target);
            });
        });

        // Add ripple effect to buttons
        this.addRippleEffect();

        // Terminal mode: add a visible effect to body or app
        // Optionally, you can add more logic here if you want to show/hide a terminal UI
    }

    startTypingAnimation() {
        const typingElement = document.getElementById('typing-text');
        if (!typingElement) return;

        // Clear any existing timeout to prevent race conditions
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }

        const typeText = () => {
            const currentText = this.typingTexts[this.currentTextIndex];
            
            if (this.isDeleting) {
                typingElement.textContent = currentText.substring(0, this.currentCharIndex - 1);
                this.currentCharIndex--;
                
                if (this.currentCharIndex === 0) {
                    this.isDeleting = false;
                    this.currentTextIndex = (this.currentTextIndex + 1) % this.typingTexts.length;
                    this.typingTimeout = setTimeout(typeText, this.typingSpeed);
                } else {
                    this.typingTimeout = setTimeout(typeText, this.deletingSpeed);
                }
            } else {
                typingElement.textContent = currentText.substring(0, this.currentCharIndex + 1);
                this.currentCharIndex++;
                
                if (this.currentCharIndex === currentText.length) {
                    this.isDeleting = true;
                    this.typingTimeout = setTimeout(typeText, this.pauseTime);
                } else {
                    this.typingTimeout = setTimeout(typeText, this.typingSpeed);
                }
            }
        };

        typeText();
    }

    toggleTheme() {
        // If terminal mode is active, turn it off first
        if (this.isTerminalMode) {
            this.isTerminalMode = false;
            document.body.classList.remove('terminal-mode');
        }
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        // Add transition effect
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    toggleTerminalMode() {
        this.isTerminalMode = !this.isTerminalMode;
        document.body.classList.toggle('terminal-mode', this.isTerminalMode);

        if (this.isTerminalMode) {
            // Always force dark mode when entering terminal mode
            this.currentTheme = 'dark';
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        // Optionally, you can restore previous theme when exiting terminal mode
        // else {
        //     document.documentElement.setAttribute('data-theme', this.currentTheme);
        // }

        if (this.isTerminalMode) {
            console.log('Terminal mode activated');
        } else {
            console.log('Terminal mode deactivated');
        }
    }

    navigateToSection(section) {
        if (section === this.currentSection) return;

        // Hide current section
        const currentSectionElement = document.getElementById(`${this.currentSection}-section`);
        if (currentSectionElement) {
            currentSectionElement.classList.remove('active');
        }

        // Show new section
        const newSectionElement = document.getElementById(`${section}-section`);
        if (newSectionElement) {
            setTimeout(() => {
                newSectionElement.classList.add('active');
                this.animateSectionChange(section);
                
                // Show Click Here hints when navigating to home section
                if (section === 'home' && window.bugSquashAnimation) {
                    // Reset hints flag so they can show again
                    window.bugSquashAnimation.hintsShown = false;
                    // Show hints after a short delay for section to render
                    setTimeout(() => {
                        window.bugSquashAnimation.showClickMeHints();
                    }, 500);
                }
            }, 150);
        }

        // Update navigation
        this.updateActiveNavItem(section);
        this.currentSection = section;
        this.trackVisit(section);
        
        // Show/hide logo highlight based on section
        this.updateLogoHighlight(section);
    }

    updateLogoHighlight(section) {
        const logoText = document.getElementById('logo-text');
        if (!logoText) return;
        
        let logoHint = document.getElementById('logo-click-hint');
        
        if (section === 'home') {
            if (logoHint) logoHint.classList.remove('visible');
            logoText.classList.remove('logo-highlighted');
        } else {
            // Show hint on other sections (if not already clicked)
            if (!this.logoHintClicked) {
                if (!logoHint) {
                    logoHint = document.createElement('div');
                    logoHint.id = 'logo-click-hint';
                    logoHint.className = 'logo-click-hint';
                    logoHint.innerHTML = 'Click Here!';
                    logoText.parentElement.style.position = 'relative';
                    logoText.parentElement.appendChild(logoHint);
                    
                    // Add click handler to dismiss
                    logoText.addEventListener('click', () => {
                        this.logoHintClicked = true;
                        logoHint.classList.remove('visible');
                        logoText.classList.remove('logo-highlighted');
                    }, { once: true });
                }
                
                logoText.classList.add('logo-highlighted');
                setTimeout(() => logoHint.classList.add('visible'), 100);
            }
        }
    }



    triggerNavHighlight() {
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) {
            bottomNav.classList.add('intro-highlight');
            setTimeout(() => {
                bottomNav.classList.remove('intro-highlight');
            }, (PortfolioConfig.INTRO?.NAV_HIGHLIGHT_DURATION || 1500));
        }
    }

    updateActiveNavItem(section) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });
    }

    animateSectionChange(section) {
        const sectionElement = document.getElementById(`${section}-section`);
        if (!sectionElement) return;

        // Add entrance animation based on section
        sectionElement.classList.remove('slide-in-left', 'slide-in-right', 'fade-in');
        
        switch (section) {
            case 'home':
                sectionElement.classList.add('fade-in');
                break;
            case 'about':
                sectionElement.classList.add('slide-in-left');
                break;
            case 'projects':
                sectionElement.classList.add('fade-in');
                break;
            case 'skills':
                sectionElement.classList.add('slide-in-right');
                break;
            case 'contact':
                sectionElement.classList.add('fade-in');
                break;
        }
    }

    applyInitialProjectsFilterIfReady() {
        if (this._initialProjectFilterApplied) return;
        if (!this._projectsLoaded) return;
        if (!this._categoriesLoaded) return;

        const projectCards = Array.from(document.querySelectorAll('.project-card'));
        const hasProjectsForFilter = (filter) => {
            const f = String(filter || '').toLowerCase();
            return projectCards.some(c => (c.dataset.category || '').toLowerCase() === f);
        };

        // Prefer the first category, but if it has no projects, fall back to the first category that does.
        let desiredFilter = this._initialProjectFilter;
        if (!desiredFilter || !hasProjectsForFilter(desiredFilter)) {
            const categoryButtons = Array.from(document.querySelectorAll('#filter-buttons-container .filter-btn'))
                .filter(b => (b.dataset.filter || '').toLowerCase() !== 'all');

            const firstWithProjects = categoryButtons
                .map(b => (b.dataset.filter || '').toLowerCase())
                .find(f => hasProjectsForFilter(f));

            desiredFilter = firstWithProjects || null;
        }

        if (desiredFilter) {
            this.filterProjects(desiredFilter);
            const btn = document.querySelector(`.filter-btn[data-filter="${CSS.escape(desiredFilter)}"]`);
            if (btn) this.updateActiveFilter(btn);
        } else {
            // No categories have projects; if an "All" button exists, show all (which will still show none).
            this.filterProjects('all');
            const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
            if (allBtn) this.updateActiveFilter(allBtn);
        }

        this._initialProjectFilterApplied = true;
    }

    filterProjects(filter) {
        const projectCards = document.querySelectorAll('.project-card');
        
        // Stop all playing media before switching categories
        this.stopAllMedia();
        
        projectCards.forEach(card => {
            const category = (card.dataset.category || '').toLowerCase();
            const shouldShow = filter === 'all' || category === filter.toLowerCase();
            
            if (shouldShow) {
                card.classList.remove('hidden');
                card.classList.add('visible');
            } else {
                card.classList.remove('visible');
                card.classList.add('hidden');
            }
        });
    }

    // Stop all videos and YouTube iframes across all project cards
    stopAllMedia(excludeElement = null) {
        // Pause and reset all HTML5 videos
        document.querySelectorAll('.project-card video').forEach(v => {
            if (v === excludeElement) return;
            try { v.pause(); } catch (e) {}
            try { v.currentTime = 0; } catch (e) {}
        });

        // Stop YouTube iframes by replacing them back with placeholders
        document.querySelectorAll('.project-card iframe.yt-iframe, .project-card iframe[src*="youtube.com/embed/"]').forEach(fr => {
            if (fr === excludeElement) return;
            try {
                const src = fr.getAttribute('src') || '';
                const m = src.match(/embed\/([^?&/]+)/);
                const videoId = m ? m[1] : null;
                if (videoId) {
                    const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    fr.outerHTML = `
                      <div class="yt-placeholder" data-youtube-id="${videoId}" role="button" aria-label="Play YouTube video">
                        <img src="${thumb}" alt="YouTube thumbnail" class="yt-thumb">
                        <div class="yt-play-btn">▶</div>
                      </div>
                    `;
                } else {
                    // fallback: blank it
                    fr.setAttribute('src', '');
                }
            } catch (e) {}
        });
        // Note: Global event delegation handles new placeholder clicks automatically
    }

    // Note: YouTube placeholder click handling is done via global event delegation in setupGlobalYouTubeHandler()


    updateActiveFilter(activeButton) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    addRippleEffect() {
        const buttons = document.querySelectorAll('button, .social-link, .nav-item');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show the specified section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        this.updateActiveNavItem(sectionName);
        this.currentSection = sectionName;
    }

    trackVisit(page) {
        // Send final update for previous visit if it exists
        this.updateVisitDuration();

        // Start new visit
        this.currentVisitId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        this.currentVisitStartTime = Date.now();

        fetch('/api/track_visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                page: page,
                visit_id: this.currentVisitId
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 'ok' && data.status !== 'exists' && data.status !== 'ignored') {
                console.error('Failed to track visit:', data.message);
            }
        })
        .catch((error) => {
            console.error('Error tracking visit:', error);
        });

        // Setup periodic updates every 10 seconds while on the same section
        if (this.visitUpdateInterval) clearInterval(this.visitUpdateInterval);
        this.visitUpdateInterval = setInterval(() => this.updateVisitDuration(), 10000);
    }

    updateVisitDuration() {
        if (!this.currentVisitId || !this.currentVisitStartTime) return;

        const duration = Math.floor((Date.now() - this.currentVisitStartTime) / 1000);
        
        // Use keepalive or a fallback for when the page is closing
        const body = JSON.stringify({
            visit_id: this.currentVisitId,
            duration: duration
        });

        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/update_visit_duration', body);
        } else {
            fetch('/api/update_visit_duration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: body,
            }).catch(e => {});
        }
    }

    loadCertificationCategoriesAndFilters() {
        Promise.all([
            fetch('/api/certification-categories').then(res => res.json()),
            fetch('/api/config').then(res => res.json()).catch(() => ({}))
        ])
        .then(([categories, config]) => {
            const container = document.getElementById('cert-filter-buttons-container');
            if (!container) return;
            container.innerHTML = '';

            const firstCategory = (Array.isArray(categories) && categories.length > 0)
                ? String(categories[0].name || '').toLowerCase()
                : null;
            
            categories.forEach((cat, index) => {
                const btn = document.createElement('button');
                const filterVal = String(cat.name || '').toLowerCase();
                btn.className = 'filter-btn' + (index === 0 ? ' active' : '');
                btn.dataset.filter = filterVal;
                btn.textContent = cat.name;
                btn.addEventListener('click', (e) => {
                    this.filterCertifications(filterVal);
                    this.updateActiveCertFilter(e.target);
                });
                container.appendChild(btn);
            });

            // Default to first category if available
            if (firstCategory) {
                this.filterCertifications(firstCategory);
            }
        });
    }

    loadCertifications() {
        fetch('/api/certifications')
            .then(res => res.json())
            .then(certs => {
                const grid = document.querySelector('.certifications-grid');
                if (!grid) return;
                grid.innerHTML = '';

                certs.forEach(cert => {
                    const card = document.createElement('div');
                    card.className = 'cert-card visible';
                    card.dataset.category = (cert.category || '').toLowerCase();
                    
                    let imageUrl = cert.image || '';
                    if (imageUrl.startsWith('img1:')) {
                        imageUrl = imageUrl.replace('img1:', '').trim();
                    }

                    card.innerHTML = `
                        ${imageUrl ? `<div class="cert-image-container"><img src="${imageUrl}" alt="${cert.name}" class="cert-image" loading="lazy" onclick="window.portfolioApp.openImageModal('${imageUrl}', '${cert.name}')"></div>` : ''}
                        <div class="cert-content">
                            <div class="cert-issuer">${cert.issuer}</div>
                            <h3 class="cert-name">${cert.name}</h3>
                            ${cert.certification_id ? `<div class="cert-id-tag">ID: ${cert.certification_id}</div>` : ''}
                            <div class="cert-meta">
                                <span class="cert-date">${cert.date}</span>
                                ${cert.url ? `<a href="${cert.url}" target="_blank" class="cert-link">View Certificate</a>` : ''}
                            </div>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            });
    }

    initImageModal() {
        // Add modal HTML if not present
        if (!document.getElementById('cert-image-modal')) {
            const modal = document.createElement('div');
            modal.id = 'cert-image-modal';
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="modal-overlay" onclick="window.portfolioApp.closeImageModal()"></div>
                <div class="modal-content">
                    <span class="modal-close" onclick="window.portfolioApp.closeImageModal()">&times;</span>
                    <img id="cert-modal-img" src="" alt="">
                    <h4 id="cert-modal-caption"></h4>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Handle Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeImageModal();
        });
    }

    openImageModal(src, caption) {
        const modal = document.getElementById('cert-image-modal');
        const img = document.getElementById('cert-modal-img');
        const cap = document.getElementById('cert-modal-caption');
        
        if (modal && img && cap) {
            img.src = src;
            cap.textContent = caption;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Disable scroll
        }
    }

    closeImageModal() {
        const modal = document.getElementById('cert-image-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = ''; // Re-enable scroll
        }
    }

    filterCertifications(filter) {
        const cards = document.querySelectorAll('.cert-card');
        cards.forEach(card => {
            const cat = (card.dataset.category || '').toLowerCase();
            if (filter === 'all' || cat === filter) {
                card.classList.remove('hidden');
                card.classList.add('visible');
            } else {
                card.classList.remove('visible');
                card.classList.add('hidden');
            }
        });
    }

    updateActiveCertFilter(activeButton) {
        const container = document.getElementById('cert-filter-buttons-container');
        container.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    loadProjects() {
        // Check for sort preference in localStorage (default: date)
        const sortBy = localStorage.getItem('projectSortBy') || 'date';
        fetch(`/api/projects?sort_by=${sortBy}`)
            .then(response => response.json())
            .then(projects => {
                const projectsGrid = document.querySelector('.projects-grid');
                if (!projectsGrid) return;

                projectsGrid.innerHTML = '';
                // Collect unique categories from projects
                const categoriesSet = new Set();
                projects.forEach(project => {
                    if (project.category) {
                        categoriesSet.add(project.category);
                    }
                });
                // NOTE:
                // Filter buttons are rendered from /api/categories in loadCategoriesAndRenderFilters(),
                // to respect the admin-defined order.
                // So we do not rebuild filter buttons here from project data.
                void categoriesSet;
                projects.forEach(project => {
                    const projectCard = document.createElement('div');
                    // Start hidden to prevent showing "all" categories before the initial filter is applied.
                    projectCard.className = 'project-card hidden';
                    projectCard.dataset.category = project.category;

                    let mockupContentHTML = '';
                    if (project.mockup_content) {
                        const content = String(project.mockup_content).trim();

                        const parseKeyedMedia = (raw) => {
                            // Supports space/newline separated tokens, and allows mixing:
                            // img1:URL img2:URL
                            // yt1:YOUTUBE_URL
                            // vd1:VIDEO_URL
                            // em1:EMBED_URL (for iframe embeds like Jumpshare, Loom, etc.)
                            // Ordering is by the number suffix (1,2,3...)
                            const tokens = raw.split(/\s+/).filter(Boolean);
                            const items = [];
                            for (const t of tokens) {
                                const idx = t.indexOf(':');
                                if (idx === -1) continue;
                                const key = t.slice(0, idx).toLowerCase();
                                const val = t.slice(idx + 1).trim();
                                if (!val) continue;

                                const m = key.match(/^(img|yt|vd|em|gd|gdv)(\d+)$/);
                                if (!m) continue;
                                items.push({ type: m[1], order: parseInt(m[2], 10), src: val });
                            }
                            items.sort((a, b) => (a.order - b.order) || (a.type.localeCompare(b.type)));
                            return items;
                        };

                        // Parse YouTube URL/iframe and extract video ID + params (start, end, etc.)
                        const parseYouTubeUrl = (input) => {
                            console.log('[YouTube Debug] parseYouTubeUrl called with:', input);
                            const result = { videoId: null, start: null, end: null, params: '' };
                            if (!input) return result;
                            
                            let url = input.trim();
                            
                            // Check if input is an iframe HTML - extract src
                            if (url.startsWith('<iframe')) {
                                const srcMatch = url.match(/src=["']([^"']+)["']/i);
                                if (srcMatch) url = srcMatch[1];
                            }
                            
                            try {
                                const u = new URL(url);
                                
                                // Extract video ID based on URL type
                                if (u.hostname.includes('youtube.com')) {
                                    if (u.pathname.includes('/embed/')) {
                                        // Embed URL: youtube.com/embed/VIDEO_ID
                                        result.videoId = u.pathname.split('/embed/')[1]?.split(/[?&/]/)[0];
                                    } else {
                                        // Regular URL: youtube.com/watch?v=VIDEO_ID
                                        result.videoId = u.searchParams.get('v');
                                    }
                                } else if (u.hostname.includes('youtu.be')) {
                                    // Short URL: youtu.be/VIDEO_ID
                                    result.videoId = u.pathname.slice(1);
                                }
                                
                                // Extract start and end params (support both 'start' and 't' for start time)
                                const startParam = u.searchParams.get('start') || u.searchParams.get('t');
                                const endParam = u.searchParams.get('end');
                                
                                if (startParam) result.start = startParam.replace(/s$/i, ''); // Remove 's' suffix if present
                                if (endParam) result.end = endParam.replace(/s$/i, '');
                                
                                // Build params string for embed URL
                                const embedParams = [];
                                if (result.start) embedParams.push(`start=${result.start}`);
                                if (result.end) embedParams.push(`end=${result.end}`);
                                result.params = embedParams.join('&');
                                
                            } catch (e) {
                                console.log('[YouTube Debug] parseYouTubeUrl error:', e);
                                return result;
                            }
                            console.log('[YouTube Debug] parseYouTubeUrl result:', result);
                            return result;
                        };
                        
                        // Legacy helper for backward compatibility
                        const getYouTubeId = (url) => parseYouTubeUrl(url).videoId;

                        const renderYouTube = (url) => {
                            const parsed = parseYouTubeUrl(url);
                            if (!parsed.videoId) return null;

                            // Lazy placeholder (saves space and avoids loading iframe until user clicks play)
                            const thumb = `https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`;
                            const paramsAttr = parsed.params ? ` data-youtube-params="${parsed.params}"` : '';
                            return `
                              <div class="video-wrapper" data-youtube-id="${parsed.videoId}"${paramsAttr}>
                                <div class="yt-placeholder" data-youtube-id="${parsed.videoId}"${paramsAttr} role="button" aria-label="Play YouTube video">
                                  <img src="${thumb}" alt="YouTube thumbnail" class="yt-thumb" loading="lazy">
                                  <div class="yt-play-btn">▶</div>
                                </div>
                                <button type="button" class="video-fullscreen-btn" aria-label="Fullscreen">⛶</button>
                              </div>
                            `;
                        };

                        // New keyed formats (imgs + videos) - supports mixing
                        const keyed = parseKeyedMedia(content);
                        const renderCarouselItem = (item) => {
                            if (!item) return '';
                            if (item.type === 'img') {
                                return `<img src="${item.src}" alt="${project.title} media" class="mockup-media" loading="lazy">`;
                            }
                            if (item.type === 'yt') {
                                // Lazy YouTube placeholder (self-contained) with start/end support
                                const parsed = parseYouTubeUrl(item.src);
                                if (parsed.videoId) {
                                    const thumb = `https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`;
                                    const paramsAttr = parsed.params ? ` data-youtube-params="${parsed.params}"` : '';
                                    return `
                                      <div class="video-wrapper" data-youtube-id="${parsed.videoId}"${paramsAttr}>
                                        <div class="yt-placeholder" data-youtube-id="${parsed.videoId}"${paramsAttr} role="button" aria-label="Play YouTube video">
                                          <img src="${thumb}" alt="YouTube thumbnail" class="yt-thumb" loading="lazy">
                                          <div class="yt-play-btn">▶</div>
                                        </div>
                                        <button type="button" class="video-fullscreen-btn" aria-label="Fullscreen">⛶</button>
                                      </div>
                                    `;
                                }
                                return `<p>${item.src}</p>`;
                            }
                            if (item.type === 'vd') {
                                return `<div class="video-wrapper" data-video-src="${item.src}">
                                    <video src="${item.src}" class="mockup-media" controls playsinline></video>
                                    <button type="button" class="video-fullscreen-btn" aria-label="Fullscreen">⛶</button>
                                </div>`;
                            }
                            if (item.type === 'em') {
                                // Embed iframe (Jumpshare, Loom, etc.) with fullscreen button
                                return `<div class="embed-wrapper">
                                    <iframe src="${item.src}" class="mockup-media embed-iframe" frameborder="0" allowfullscreen webkitallowfullscreen mozallowfullscreen allow="autoplay; fullscreen"></iframe>
                                    <button type="button" class="embed-fullscreen-btn" aria-label="Fullscreen">⛶</button>
                                    <div class="embed-zoom-hint">Tap fullscreen for better viewing</div>
                                </div>`;
                            }
                            if (item.type === 'gd') {
                                // Google Drive video embed
                                return `<div class="embed-wrapper">
                                    <iframe src="https://drive.google.com/file/d/${item.src}/preview" class="mockup-media embed-iframe" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>
                                    <button type="button" class="embed-fullscreen-btn" aria-label="Fullscreen">⛶</button>
                                    <div class="embed-zoom-hint">Tap fullscreen for better viewing</div>
                                </div>`;
                            }
                            if (item.type === 'gdv') {
                                // Google Drive Direct Video (Native Player)
                                return `<div class="video-wrapper" data-video-src="https://drive.google.com/uc?export=download&id=${item.src}">
                                    <video src="https://drive.google.com/uc?export=download&id=${item.src}" class="mockup-media" controls playsinline></video>
                                    <button type="button" class="video-fullscreen-btn" aria-label="Fullscreen">⛶</button>
                                </div>`;
                            }
                            return '';
                        };

                        if (keyed.length) {
                            const encoded = encodeURIComponent(JSON.stringify(keyed));
                            mockupContentHTML = `
                              <div class="mockup-carousel" data-items="${encoded}" data-index="0">
                                <div class="mockup-carousel-item">
                                  ${renderCarouselItem(keyed[0])}
                                </div>
                                ${keyed.length > 1 ? `
                                  <button type="button" class="mockup-carousel-btn mockup-carousel-btn-prev" data-dir="prev" aria-label="Previous">←</button>
                                  <button type="button" class="mockup-carousel-btn mockup-carousel-btn-next" data-dir="next" aria-label="Next">→</button>
                                  <div class="mockup-carousel-counter">1 / ${keyed.length}</div>
                                ` : ''}
                              </div>
                            `;
                        }
                        // Handle multiple image slides (legacy: img1:...)
                        else if (content.includes('img1:')) {
                            const slideUrls = [];
                            const pattern = /img\d+:(https?:\/\/[^\s]+(?:\s|$))/g;
                            let match;
                            while ((match = pattern.exec(content)) !== null) {
                                const url = match[1].trim();
                                slideUrls.push(url);
                            }

                            if (slideUrls.length > 0) {
                                mockupContentHTML = `<div class="slide-preview">
                                    <img src="${slideUrls[0]}" 
                                         alt="${project.title} slides" 
                                         class="mockup-media" 
                                         data-external-slides="${slideUrls.join('|')}">
                                    <div class="slide-hint">Click to view slideshow (${slideUrls.length} images)</div>
                                </div>`;
                            }
                        }
                        // Handle single external image (legacy)
                        else if (content.startsWith('img:')) {
                            const imgUrl = content.substring(4);
                            mockupContentHTML = `<img src="${imgUrl}" alt="${project.title} mockup" class="mockup-media">`;
                        }
                        // Handle slide images from local storage
                        else if (content.startsWith('slides/')) {
                            const slidePath = content.split('/')[1];
                            mockupContentHTML = `<div class="slide-preview">
                                <img src="/static/slides/${slidePath}/0.jpg" 
                                     alt="${project.title} slides" 
                                     class="mockup-media" 
                                     data-slides="${slidePath}">
                                <div class="slide-hint">Click to view slideshow</div>
                            </div>`;
                        }
                        // Handle local images
                        else if (content.startsWith('image/')) {
                            const imagePath = content.replace(/^image\/image\//, 'image/');
                            mockupContentHTML = `<img src="/static/${imagePath}" alt="${project.title} mockup" class="mockup-media">`;
                        }
                        // Handle local videos
                        else if (content.startsWith('video/')) {
                            const videoPath = content.replace(/^video\/video\//, 'video/');
                            mockupContentHTML = `<div class="video-wrapper" data-video-src="/static/${videoPath}">
                                <video src="/static/${videoPath}" class="mockup-media" controls playsinline></video>
                                <button type="button" class="video-fullscreen-btn" aria-label="Fullscreen">⛶</button>
                            </div>`;
                        }
                        // Handle YouTube videos (legacy: raw url)
                        else if (content.includes('youtube.com/watch') || content.includes('youtu.be/')) {
                            const yt = renderYouTube(content);
                            mockupContentHTML = yt || `<p>${content}</p>`;
                        }
                        // Handle plain text
                        else {
                            mockupContentHTML = `<p>${content}</p>`;
                        }
                    }

                    const mockupTypeClass = project.mockup_type === 'terminal' ? 'terminal-mockup' : '';
                    const mockupContentClass = project.mockup_type === 'terminal' ? 'terminal-content' : '';
                    
                    const projectPreviewHTML = mockupContentHTML
                        ? `
                        <div class="project-preview">
                            <div class="project-mockup ${mockupTypeClass}">
                                <div class="mockup-header">
                                    <div class="mockup-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                                <div class="mockup-content ${mockupContentClass}">
                                    ${mockupContentHTML}
                                </div>
                            </div>
                        </div>`
                        : '';

                    // --- BUTTONS LOGIC ---
                    let buttonsHTML = '';
                    if (project.confidential) {
                        buttonsHTML = '<span style="color:#f87171;font-size:1em;">Confidential Project</span>';
                    } else {
                        if (project.github_url) {
                            buttonsHTML += `<a href="${project.github_url}" class="project-link" target="_blank">${project.link_button_text || 'GitHub'}</a>`;
                        }
                        if (project.demo_url) {
                            buttonsHTML += `<a href="${project.demo_url}" class="project-link" target="_blank">${project.demo_button_text || 'Demo'}</a>`;
                        }
                    }

                    // Format description: convert lines starting with - to list items, preserve newlines
                    let formattedDesc = project.description || '';
                    if (formattedDesc.includes('\n') || formattedDesc.includes('-')) {
                        const lines = formattedDesc.split('\n');
                        const listItems = [];
                        const introLines = [];
                        let inList = false;
                        
                        lines.forEach(line => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('-')) {
                                inList = true;
                                listItems.push(`<li>${trimmed.substring(1).trim()}</li>`);
                            } else if (trimmed) {
                                if (inList) {
                                    listItems.push(`<li>${trimmed}</li>`);
                                } else {
                                    introLines.push(trimmed);
                                }
                            }
                        });
                        
                        if (listItems.length > 0) {
                            formattedDesc = introLines.join('<br>') + (introLines.length ? '<ul style="margin:0.5em 0 0 1em;padding:0;list-style:disc;">' : '<ul style="margin:0;padding:0 0 0 1em;list-style:disc;">') + listItems.join('') + '</ul>';
                        } else {
                            formattedDesc = formattedDesc.replace(/\n/g, '<br>');
                        }
                    }

                    projectCard.innerHTML = `
                        <div class="project-preview">
                            <div class="project-info">
                                <h3 class="project-title">${project.title}</h3>
                                <div class="project-description">${formattedDesc}</div>
                            </div>
                            ${projectPreviewHTML}
                            <div class="project-tags">
                                ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
                            </div>
                            <div class="project-date" style="font-size:0.85em;color:#a5b4fc;margin-bottom:0.5em;">
                                <span>Date: ${project.date ? project.date : 'N/A'}</span>
                            </div>
                            <div class="project-links">${buttonsHTML}</div>
                        </div>
                    `;
                    projectsGrid.appendChild(projectCard);

                    // Note: YouTube placeholder click handling is done via global event delegation
                    // in setupGlobalYouTubeHandler(), so no manual binding is needed here

                    // Mixed-media carousel controls
                    const carousel = projectCard.querySelector('.mockup-carousel');
                    if (carousel) {
                        const items = JSON.parse(decodeURIComponent(carousel.dataset.items || '%5B%5D'));
                        const itemContainer = carousel.querySelector('.mockup-carousel-item');
                        const counter = carousel.querySelector('.mockup-carousel-counter');

                        const renderCarouselItem = (item) => {
                            if (!item) return '';
                            if (item.type === 'img') {
                                return `<img src="${item.src}" alt="${project.title} media" class="mockup-media">`;
                            }
                            if (item.type === 'yt') {
                                // Lazy YouTube placeholder with start/end support
                                // Note: parseYouTubeUrl helper defined in the parent scope
                                const parseYT = (input) => {
                                    const result = { videoId: null, params: '' };
                                    if (!input) return result;
                                    let url = input.trim();
                                    if (url.startsWith('<iframe')) {
                                        const srcMatch = url.match(/src=["']([^"']+)["']/i);
                                        if (srcMatch) url = srcMatch[1];
                                    }
                                    try {
                                        const u = new URL(url);
                                        if (u.hostname.includes('youtube.com')) {
                                            if (u.pathname.includes('/embed/')) {
                                                result.videoId = u.pathname.split('/embed/')[1]?.split(/[?&/]/)[0];
                                            } else {
                                                result.videoId = u.searchParams.get('v');
                                            }
                                        } else if (u.hostname.includes('youtu.be')) {
                                            result.videoId = u.pathname.slice(1);
                                        }
                                        const startParam = u.searchParams.get('start') || u.searchParams.get('t');
                                        const endParam = u.searchParams.get('end');
                                        const embedParams = [];
                                        if (startParam) embedParams.push(`start=${startParam.replace(/s$/i, '')}`);
                                        if (endParam) embedParams.push(`end=${endParam.replace(/s$/i, '')}`);
                                        result.params = embedParams.join('&');
                                    } catch (e) {}
                                    return result;
                                };
                                const parsed = parseYT(item.src);
                                if (parsed.videoId) {
                                    const thumb = `https://img.youtube.com/vi/${parsed.videoId}/hqdefault.jpg`;
                                    const paramsAttr = parsed.params ? ` data-youtube-params="${parsed.params}"` : '';
                                    return `
                                      <div class="yt-placeholder" data-youtube-id="${parsed.videoId}"${paramsAttr} role="button" aria-label="Play YouTube video">
                                        <img src="${thumb}" alt="YouTube thumbnail" class="yt-thumb">
                                        <div class="yt-play-btn">▶</div>
                                      </div>
                                    `;
                                }
                                return `<p>${item.src}</p>`;
                            }
                            if (item.type === 'vd') {
                                return `<video src="${item.src}" class="mockup-media" controls playsinline></video>`;
                            }
                            if (item.type === 'gd') {
                                // Google Drive video embed
                                return `<div class="embed-wrapper">
                                    <iframe src="https://drive.google.com/file/d/${item.src}/preview" class="mockup-media embed-iframe" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>
                                    <button type="button" class="embed-fullscreen-btn" aria-label="Fullscreen">⛶</button>
                                    <div class="embed-zoom-hint">Tap fullscreen for better viewing</div>
                                </div>`;
                            }
                            if (item.type === 'gdv') {
                                // Google Drive Direct Video (Native Player)
                                return `<video src="https://drive.google.com/uc?export=download&id=${item.src}" class="mockup-media" controls playsinline></video>`;
                            }
                            return '';
                        };

                        const stopMediaInCard = (rootEl) => {
                            const root = rootEl || projectCard;
                            // Pause any HTML5 video
                            root.querySelectorAll('video').forEach(v => {
                                try { v.pause(); } catch (e) {}
                                try { v.currentTime = 0; } catch (e) {}
                            });

                            // Stop YouTube iframes by replacing them back with a placeholder
                            root.querySelectorAll('iframe.yt-iframe, iframe[src*="youtube.com/embed/"]').forEach(fr => {
                                try {
                                    const src = fr.getAttribute('src') || '';
                                    const m = src.match(/embed\/([^?&/]+)/);
                                    const videoId = m ? m[1] : null;
                                    if (videoId) {
                                        const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                        fr.outerHTML = `
                                          <div class="yt-placeholder" data-youtube-id="${videoId}" role="button" aria-label="Play YouTube video">
                                            <img src="${thumb}" alt="YouTube thumbnail" class="yt-thumb">
                                            <div class="yt-play-btn">▶</div>
                                          </div>
                                        `;
                                    } else {
                                        // fallback: blank it
                                        fr.setAttribute('src', '');
                                    }
                                } catch (e) {}
                            });
                        };

                        // Note: YouTube placeholder click handling is done via global event delegation
                        // So we don't need to manually bind handlers here

                        const setIndex = (newIndex) => {
                            if (!items.length) return;

                            // Stop currently playing media before switching slides
                            stopMediaInCard(projectCard);

                            const idx = (newIndex + items.length) % items.length;
                            carousel.dataset.index = String(idx);
                            if (itemContainer) itemContainer.innerHTML = renderCarouselItem(items[idx]);
                            if (counter) counter.textContent = `${idx + 1} / ${items.length}`;
                            // Global event delegation handles YouTube placeholder clicks automatically
                        };

                        // Event delegation so controls keep working after innerHTML changes
                        carousel.addEventListener('click', (e) => {
                            const btn = e.target.closest('.mockup-carousel-btn');
                            if (!btn) return;
                            e.preventDefault();
                            const dir = btn.dataset.dir;
                            const cur = parseInt(carousel.dataset.index || '0', 10) || 0;
                            setIndex(dir === 'next' ? cur + 1 : cur - 1);
                        });

                        // No initial bind needed - global event delegation handles it
                    }

                    const video = projectCard.querySelector('video');
                    if (video) {
                        // Stop all other videos when this video starts playing
                        video.addEventListener('play', () => {
                            // Pause all other videos
                            document.querySelectorAll('.project-card video').forEach(v => {
                                if (v !== video) {
                                    try { v.pause(); } catch (e) {}
                                }
                            });
                            // Also stop any YouTube iframes
                            document.querySelectorAll('.project-card iframe.yt-iframe, .project-card iframe[src*="youtube.com/embed/"]').forEach(fr => {
                                try {
                                    const src = fr.getAttribute('src') || '';
                                    const m = src.match(/embed\/([^?&/]+)/);
                                    const videoId = m ? m[1] : null;
                                    if (videoId) {
                                        const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                        fr.outerHTML = `
                                          <div class="yt-placeholder" data-youtube-id="${videoId}" role="button" aria-label="Play YouTube video">
                                            <img src="${thumb}" alt="YouTube thumbnail" class="yt-thumb">
                                            <div class="yt-play-btn">▶</div>
                                          </div>
                                        `;
                                    }
                                } catch (e) {}
                            });
                        });
                        
                        video.addEventListener('dblclick', () => {
                            if (video.requestFullscreen) {
                                video.requestFullscreen();
                            } else if (video.webkitRequestFullscreen) { /* Safari */
                                video.webkitRequestFullscreen();
                            } else if (video.msRequestFullscreen) { /* IE11 */
                                video.msRequestFullscreen();
                            }
                        });
                    }
                });
                // Filter buttons are rendered from /api/categories in loadCategoriesAndRenderFilters().
                // (Do not overwrite them here.)

                this._projectsLoaded = true;
                this.applyInitialProjectsFilterIfReady();
            });
    }

    loadSkills() {
        Promise.all([
            fetch('/api/skills').then(res => res.json()),
            fetch('/api/skill-categories').then(res => res.json())
        ]).then(([skills, skillCategories]) => {
            const categories = skillCategories.map(c => c.name);
            const grouped = {};
            for (const cat of categories) grouped[cat] = [];
            for (const skill of skills) {
                if (grouped[skill.category]) grouped[skill.category].push(skill);
            }
            for (const cat of categories) {
                grouped[cat].sort((a, b) => a.id - b.id);
            }
            var skillsGrid = document.querySelector('#skills-section .skills-grid');
            var tabsContainer = document.querySelector('#skills-section .category-tabs');
            if (skillsGrid) {
                if (!tabsContainer) {
                    tabsContainer = document.createElement('div');
                    tabsContainer.className = 'category-tabs';
                    tabsContainer.style.display = 'flex';
                    tabsContainer.style.gap = '1rem';
                    tabsContainer.style.marginBottom = '1.5rem';
                    skillsGrid.parentNode.insertBefore(tabsContainer, skillsGrid);
                }
                tabsContainer.innerHTML = '';
                let activeCat = categories[0];
                if (window.selectedSkillCategory && categories.includes(window.selectedSkillCategory)) {
                    activeCat = window.selectedSkillCategory;
                }
                categories.forEach(cat => {
                    const btn = document.createElement('button');
                    btn.className = 'category-tab-btn';
                    btn.textContent = cat;
                    btn.style.padding = '0.5rem 1.2rem';
                    btn.style.border = 'none';
                    btn.style.borderRadius = '8px';
                    btn.style.background = 'var(--card-bg)';
                    btn.style.color = 'var(--text-secondary)';
                    btn.style.fontWeight = '600';
                    btn.style.cursor = 'pointer';
                    btn.style.transition = 'all 0.2s';
                    if (cat === activeCat) btn.classList.add('active'); // Modified line
                    btn.addEventListener('click', () => {
                        window.selectedSkillCategory = cat;
                        this.renderSkillsByCategory(grouped, cat, skillsGrid);
                   tabsContainer.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                       btn.classList.add('active');
                    });
                    tabsContainer.appendChild(btn);
                });
                this.renderSkillsByCategory(grouped, activeCat, skillsGrid);
            }
        });
    }
    renderSkillsByCategory(grouped, cat, skillsGrid) {
        skillsGrid.innerHTML = '';
        if (grouped[cat] && grouped[cat].length > 0) {
            grouped[cat].forEach(skill => {
                var skillCard = document.createElement('div');
                skillCard.className = 'skill-card';
                skillCard.innerHTML =
                    '<div class="skill-icon">' + this.getSkillIconSVG(skill) + '</div>' +
                    '<span class="skill-name">' + skill.name + '</span>';
                skillsGrid.appendChild(skillCard);
            });
        } else {
            skillsGrid.innerHTML = '<div style="color:#a0a0a0;text-align:center;width:100%;">No skills in this category.</div>';
        }
    }

    getSkillIconSVG(skill) {
        // Map icon field to SVGs (add more as needed)
        switch ((skill.icon || '').toLowerCase()) {
            case 'code':
                return "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='16 18 22 12 16 6'></polyline><polyline points='8 6 2 12 8 18'></polyline></svg>";
            case 'server':
                return "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='12' x='3' y='4' rx='2' ry='2'></rect><line x1='2' y1='20' x2='22' y2='20'></line></svg>";
            case 'database':
                return "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><ellipse cx='12' cy='5' rx='9' ry='3'></ellipse><path d='M3 5v14a9 3 0 0 0 18 0V5'></path></svg>";
            case 'palette':
                return "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'></path><polyline points='14,2 14,8 20,8'></polyline></svg>";
            case 'git-branch':
                return "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'></path></svg>";
            case 'link':
                return "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'></path><path d='M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'></path></svg>";
            case 'html5':
                return "<svg class='w-6 h-6 text-gray-800 dark:text-white' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='currentColor' viewBox='0 0 24 24'><path d='m3 2 1.578 17.824L12 22l7.467-2.175L21 2H3Zm14.049 6.048H9.075l.172 2.016h7.697l-.626 6.565-4.246 1.381-4.281-1.455-.288-2.932h2.024l.16 1.411 2.4.815 2.346-.763.297-3.005H7.416l-.562-6.05h10.412l-.217 2.017Z'/></svg>";
            case 'code': // fallback for 'Code' (Java)
                return "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='16 18 22 12 16 6'></polyline><polyline points='8 6 2 12 8 18'></polyline></svg>";
            default:
                // Support inline SVG or img tags
                if (skill.icon && (skill.icon.trim().toLowerCase().startsWith('<svg') || skill.icon.trim().toLowerCase().startsWith('<img'))) {
                    return skill.icon;
                }
                return '⚡';
        }
    }
}

// ===== BUG SQUASH ANIMATION =====
// Fun Easter egg: Click on profile image to spawn bugs that get squashed by a tester!

class BugSquashAnimation {
    constructor() {
        this.bugs = [];
        this.tester = null;
        this.isAnimating = false;
        this.container = null;
        this.hintsShown = false;
        this.easterEggTriggered = false; // Only allow Easter egg once per session
        this.init();
    }

    showClickMeHints() {
        // Don't show hints if already shown or if Easter egg was triggered
        if (this.hintsShown || this.easterEggTriggered) return;
        // Check if hints were already shown/dismissed in this session
        if (this.hintsShown || this.easterEggTriggered || sessionStorage.getItem('profileHintDismissed')) return;
        this.hintsShown = true;

        const profileImage = document.getElementById('profile-image');
        const profileContainer = document.querySelector('.profile-image-container');
        const bottomNav = document.querySelector('.bottom-nav');
        
        // Add glow animation to profile image and show "Click Here!" hint
        if (profileImage && profileContainer) {
            // Add glow effect to profile image
            profileImage.classList.add('logo-highlighted');
            
            // Remove existing hint if any
            const existingHint = profileContainer.querySelector('.logo-click-hint.profile-hint');
            if (existingHint) existingHint.remove();
            
            // Create hint ABOVE the profile image
            const imageHint = document.createElement('div');
            imageHint.className = 'logo-click-hint profile-hint top-positioned';
            imageHint.innerHTML = 'Click Here!';
            imageHint.style.cssText = `
                position: absolute;
                bottom: calc(100% + 15px);
                top: auto;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
            `;
            profileContainer.style.position = 'relative';
            profileContainer.appendChild(imageHint);

            // Animate in
            setTimeout(() => imageHint.classList.add('visible'), 150);

            // Remove only when user clicks on the image
            const dismissHandler = () => {
                imageHint.classList.remove('visible');
                profileImage.classList.remove('logo-highlighted');
                setTimeout(() => imageHint.remove(), 500);
                // Mark as dismissed in session storage
                sessionStorage.setItem('profileHintDismissed', 'true');
            };
            
            profileImage.addEventListener('click', dismissHandler, { once: true });
            profileImage.addEventListener('touchend', dismissHandler, { once: true });
        }
        
        // Add hint for bottom navigation
        if (bottomNav) {
            // Remove existing hint if any
            const existingNavHint = document.querySelector('.logo-click-hint.nav-hint');
            if (existingNavHint) existingNavHint.remove();

            const navHint = document.createElement('div');
            navHint.className = 'logo-click-hint nav-hint';
            navHint.innerHTML = 'Navigate';
            navHint.style.cssText = `
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
            `;
            document.body.appendChild(navHint);

            // Animate in with slight delay
            setTimeout(() => navHint.classList.add('visible'), 200);

            // Remove after 3 seconds
            setTimeout(() => {
                navHint.classList.remove('visible');
                setTimeout(() => navHint.remove(), 500);
            }, 3000);
        }
    }

    init() {
        // Wait for the profile image to be available
        const checkImage = setInterval(() => {
            const profileImage = document.getElementById('profile-image');
            const imageContainer = document.querySelector('.profile-image-container');
            const heroTitle = document.getElementById('hero-title');
            const logoText = document.getElementById('logo-text');
            
            if (profileImage && imageContainer) {
                clearInterval(checkImage);
                // Profile image triggers Easter egg animation
                this.setupClickHandler(profileImage, imageContainer);
                
                // Logo text in header also triggers Easter egg
                if (logoText) {
                    this.setupLogoHandler(logoText, profileImage, imageContainer);
                }
            }
        }, 100);
    }

    setupLogoHandler(logoText, profileImage, imageContainer) {
        logoText.style.cursor = 'pointer';
        logoText.classList.add('bug-trigger');
        
        // Add click handler
        logoText.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.isAnimating) {
                logoText.classList.add('bug-shake-text');
                setTimeout(() => {
                    logoText.classList.remove('bug-shake-text');
                }, 300);
                this.startAnimation(profileImage, 'logo');
            }
        });

        // Add touch handler for mobile
        logoText.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.isAnimating) {
                logoText.classList.add('bug-shake-text');
                setTimeout(() => {
                    logoText.classList.remove('bug-shake-text');
                }, 300);
                this.startAnimation(profileImage, 'logo');
            }
        });
    }

    setupHeroTitleHandler(heroTitle, profileImage, imageContainer) {
        // Make the name highlight clickable
        const nameHighlight = heroTitle.querySelector('.name-highlight');
        const targetElement = nameHighlight || heroTitle;
        
        targetElement.style.cursor = 'pointer';
        targetElement.classList.add('bug-trigger');
        
        // Add click handler
        targetElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.isAnimating) {
                // Add shake to the title
                targetElement.classList.add('bug-shake-text');
                setTimeout(() => {
                    targetElement.classList.remove('bug-shake-text');
                }, 300);
                this.startAnimation(profileImage, 'name');
            }
        });

        // Add touch handler for mobile
        targetElement.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.isAnimating) {
                targetElement.classList.add('bug-shake-text');
                setTimeout(() => {
                    targetElement.classList.remove('bug-shake-text');
                }, 300);
                this.startAnimation(profileImage, 'name');
            }
        });
    }

    setupClickHandler(profileImage, imageContainer) {
        // Create a container for the bugs and tester
        this.container = document.createElement('div');
        this.container.className = 'bug-squash-container';
        imageContainer.style.position = 'relative';
        imageContainer.appendChild(this.container);

        // Add click/tap handler
        profileImage.addEventListener('click', (e) => {
            e.preventDefault();
            // Always shake on click
            profileImage.classList.add('bug-shake');
            setTimeout(() => profileImage.classList.remove('bug-shake'), 300);
            
            // Only run full animation once per session
            if (!this.isAnimating && !this.easterEggTriggered) {
                this.startAnimation(profileImage, 'image');
            }
        });

        // Add touch handler for mobile
        profileImage.addEventListener('touchend', (e) => {
            e.preventDefault();
            // Always shake on touch
            profileImage.classList.add('bug-shake');
            setTimeout(() => profileImage.classList.remove('bug-shake'), 300);
            
            // Only run full animation once per session
            if (!this.isAnimating && !this.easterEggTriggered) {
                this.startAnimation(profileImage, 'image');
            }
        });

        // Add cursor style to indicate clickability
        profileImage.style.cursor = 'pointer';
    }

    startAnimation(profileImage, triggerSource = 'image') {
        // Only allow Easter egg once per session
        if (this.easterEggTriggered) return;
        this.easterEggTriggered = true;
        this.isAnimating = true;
        
        // Activate terminal mode theme during animation
        document.body.classList.add('terminal-mode');
        document.documentElement.setAttribute('data-theme', 'dark');
        
        // Start portfolio tour during animation (no scrolling)
        if (PortfolioConfig.EASTER_EGG.TOUR.ENABLED) {
            const sections = PortfolioConfig.EASTER_EGG.TOUR.SECTIONS;
            const tourDelay = PortfolioConfig.EASTER_EGG.TOUR.SECTION_DELAY;
            
            sections.forEach((section, index) => {
                setTimeout(() => {
                    if (window.portfolioApp) {
                        window.portfolioApp.showSection(section);
                        window.portfolioApp.updateActiveNavItem(section);
                        if (section === 'home') {
                            window.portfolioApp.currentSection = 'home';
                        }
                    }
                }, index * tourDelay);
            });
        }
        
        // Track the Easter egg click
        fetch('/api/track_easter_egg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trigger_source: triggerSource })
        }).catch(() => {}); // Silently fail if tracking fails
        
        // Add shake/vibrate effect to image (like Mohamed Gomaa logo)
        profileImage.classList.add('bug-shake');
        setTimeout(() => {
            profileImage.classList.remove('bug-shake');
        }, PortfolioConfig.EASTER_EGG.SHAKE_DURATION);
        
        // Spawn bugs after shake effect
        setTimeout(() => {
            this.spawnBugs(profileImage);
        }, PortfolioConfig.EASTER_EGG.BUG_SPAWN_DELAY);
    }

    spawnBugs(profileImage) {
        // Use config for bug counts
        const baseCount = PortfolioConfig.EASTER_EGG.BUG_MIN_COUNT;
        const randomAdd = PortfolioConfig.EASTER_EGG.BUG_MAX_ADDITIONAL;
        const bugCount = baseCount + Math.floor(Math.random() * randomAdd);
        const rect = profileImage.getBoundingClientRect();
        
        // Get viewport dimensions for spreading bugs across page
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate center of the image (for starting point)
        const startX = rect.left + rect.width / 2;
        const startY = rect.top + rect.height / 2;

        // Bug emoji options
        const bugEmojis = ['🐛', '🐜', '🪲', '🦗', '🕷️'];

        for (let i = 0; i < bugCount; i++) {
            setTimeout(() => {
                const bug = document.createElement('div');
                bug.className = 'bug-creature';
                bug.innerHTML = bugEmojis[Math.floor(Math.random() * bugEmojis.length)];
                bug.style.position = 'fixed';
                bug.style.left = startX + 'px';
                bug.style.top = startY + 'px';
                bug.style.zIndex = '10000';
                
                // Random end position across the whole page
                const endX = Math.random() * (viewportWidth - 50) + 25;
                const endY = Math.random() * (viewportHeight - 50) + 25;
                
                // Random speed
                const duration = 800 + Math.random() * 600;
                
                document.body.appendChild(bug);
                this.bugs.push({
                    element: bug,
                    endX: endX,
                    endY: endY,
                    eliminated: false
                });

                // Animate bug crawling out to random position
                bug.animate([
                    { left: startX + 'px', top: startY + 'px', transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 0 },
                    { left: startX + 'px', top: startY + 'px', transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1, offset: 0.1 },
                    { left: endX + 'px', top: endY + 'px', transform: 'translate(-50%, -50%) scale(1) rotate(' + (Math.random() * 720 - 360) + 'deg)', opacity: 1 }
                ], {
                    duration: duration,
                    easing: 'ease-out',
                    fill: 'forwards'
                });

                // Update position for tester to find
                setTimeout(() => {
                    bug.style.left = endX + 'px';
                    bug.style.top = endY + 'px';
                }, duration);

            }, i * 80); // Faster stagger
        }

        // Spawn tester after bugs are out
        setTimeout(() => {
            this.spawnTesterFullPage(startX, startY);
        }, bugCount * 80 + 600);
    }

    spawnTesterFullPage(startX, startY) {
        const tester = document.createElement('div');
        tester.className = 'tester-character';
        tester.innerHTML = '🧑‍💻';
        tester.style.position = 'fixed';
        tester.style.left = startX + 'px';
        tester.style.top = startY + 'px';
        tester.style.zIndex = '10001';
        document.body.appendChild(tester);
        this.tester = tester;

        // Animate tester appearing
        tester.animate([
            { transform: 'translate(-50%, -50%) scale(0) rotate(-180deg)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.5) rotate(0deg)', opacity: 1 }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fill: 'forwards'
        });

        // Start eliminating bugs
        setTimeout(() => {
            this.eliminateBugsFullPage();
        }, 500);
    }

    eliminateBugsFullPage() {
        const bugsToEliminate = [...this.bugs].filter(b => !b.eliminated);
        let delay = 0;

        bugsToEliminate.forEach((bugData, index) => {
            setTimeout(() => {
                if (bugData.eliminated) return;
                bugData.eliminated = true;

                const bug = bugData.element;
                const targetX = bugData.endX;
                const targetY = bugData.endY;

                // Move tester to bug position
                this.tester.animate([
                    { },
                    { left: targetX + 'px', top: targetY + 'px' }
                ], {
                    duration: 150,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                });

                // Squash the bug after tester arrives
                setTimeout(() => {
                    // Create squash effect
                    const squash = document.createElement('div');
                    squash.className = 'bug-squash-effect';
                    squash.innerHTML = '💥';
                    squash.style.position = 'fixed';
                    squash.style.left = targetX + 'px';
                    squash.style.top = targetY + 'px';
                    squash.style.zIndex = '10002';
                    document.body.appendChild(squash);

                    // Animate squash
                    squash.animate([
                        { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                        { transform: 'translate(-50%, -50%) scale(2)', opacity: 1, offset: 0.3 },
                        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 }
                    ], {
                        duration: 300,
                        easing: 'ease-out',
                        fill: 'forwards'
                    });

                    // Remove bug
                    bug.animate([
                        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
                        { transform: 'translate(-50%, -50%) scale(0) rotate(720deg)', opacity: 0 }
                    ], {
                        duration: 200,
                        easing: 'ease-in',
                        fill: 'forwards'
                    });

                    setTimeout(() => {
                        bug.remove();
                        squash.remove();
                    }, 300);

                }, 150);

            }, delay);

            delay += 250; // Faster elimination
        });

        // Clean up after all bugs eliminated
        setTimeout(() => {
            this.finishAnimationFullPage();
        }, delay + 400);
    }

    finishAnimationFullPage() {
        if (this.tester) {
            // Tester victory animation
            this.tester.animate([
                { transform: 'translate(-50%, -50%) scale(1.5)' },
                { transform: 'translate(-50%, -50%) scale(2) rotate(360deg)', offset: 0.5 },
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 }
            ], {
                duration: 600,
                easing: 'ease-in-out',
                fill: 'forwards'
            });

            // Show success message in center of screen
            const successMsg = document.createElement('div');
            successMsg.className = 'bug-success-message';
            successMsg.innerHTML = '✅ All Bugs Fixed By Eng. Gomaa!';
            successMsg.style.position = 'fixed';
            successMsg.style.left = '50%';
            successMsg.style.top = '50%';
            successMsg.style.transform = 'translate(-50%, -50%)';
            successMsg.style.zIndex = '10003';
            document.body.appendChild(successMsg);

            successMsg.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.3 },
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.7 },
                { transform: 'translate(-50%, -50%) scale(0.8)', opacity: 0 }
            ], {
                duration: 1200,
                easing: 'ease-out',
                fill: 'forwards'
            });

            setTimeout(() => {
                this.tester.remove();
                successMsg.remove();
                this.cleanupFullPage();
                // Deactivate terminal mode after animation
                document.body.classList.remove('terminal-mode');
                // Trigger nav highlight after Easter egg
                if (window.portfolioApp) {
                    window.portfolioApp.triggerNavHighlight();
                }
            }, 1200);
        } else {
            this.cleanupFullPage();
        }
    }

    cleanupFullPage() {
        this.bugs.forEach(b => {
            if (b.element && b.element.parentNode) {
                b.element.remove();
            }
        });
        this.bugs = [];
        this.tester = null;
        this.isAnimating = false;
    }

    spawnTester(centerX, centerY) {
        const tester = document.createElement('div');
        tester.className = 'tester-character';
        tester.innerHTML = '🧑‍💻';
        tester.style.left = centerX + 'px';
        tester.style.top = centerY + 'px';
        this.container.appendChild(tester);
        this.tester = tester;

        // Animate tester appearing
        tester.animate([
            { transform: 'translate(-50%, -50%) scale(0) rotate(-180deg)', opacity: 0 },
            { transform: 'translate(-50%, -50%) scale(1.5) rotate(0deg)', opacity: 1 }
        ], {
            duration: 400,
            easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            fill: 'forwards'
        });

        // Start eliminating bugs
        setTimeout(() => {
            this.eliminateBugs(centerX, centerY);
        }, 500);
    }

    eliminateBugs(centerX, centerY) {
        const bugsToEliminate = [...this.bugs].filter(b => !b.eliminated);
        let delay = 0;

        bugsToEliminate.forEach((bugData, index) => {
            setTimeout(() => {
                if (bugData.eliminated) return;
                bugData.eliminated = true;

                const bug = bugData.element;
                const bugRect = bug.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();
                
                // Move tester to bug position
                const targetX = parseFloat(bug.style.left) || bugData.endX;
                const targetY = parseFloat(bug.style.top) || bugData.endY;

                this.tester.animate([
                    { transform: this.tester.style.transform || 'translate(-50%, -50%) scale(1.5)' },
                    { transform: `translate(calc(${targetX - centerX}px - 50%), calc(${targetY - centerY}px - 50%)) scale(1.5)` }
                ], {
                    duration: 200,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                });

                // Squash the bug after tester arrives
                setTimeout(() => {
                    // Create squash effect
                    const squash = document.createElement('div');
                    squash.className = 'bug-squash-effect';
                    squash.innerHTML = '💥';
                    squash.style.left = targetX + 'px';
                    squash.style.top = targetY + 'px';
                    this.container.appendChild(squash);

                    // Animate squash
                    squash.animate([
                        { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
                        { transform: 'translate(-50%, -50%) scale(2)', opacity: 1, offset: 0.3 },
                        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 }
                    ], {
                        duration: 400,
                        easing: 'ease-out',
                        fill: 'forwards'
                    });

                    // Remove bug
                    bug.animate([
                        { transform: bug.style.transform, opacity: 1 },
                        { transform: 'translate(-50%, -50%) scale(0) rotate(720deg)', opacity: 0 }
                    ], {
                        duration: 300,
                        easing: 'ease-in',
                        fill: 'forwards'
                    });

                    setTimeout(() => {
                        bug.remove();
                        squash.remove();
                    }, 400);

                }, 200);

            }, delay);

            delay += 350; // Time between each squash
        });

        // Clean up after all bugs eliminated
        setTimeout(() => {
            this.finishAnimation(centerX, centerY);
        }, delay + 500);
    }

    finishAnimation(centerX, centerY) {
        if (this.tester) {
            // Tester victory animation
            this.tester.animate([
                { transform: 'translate(-50%, -50%) scale(1.5)' },
                { transform: `translate(0, 0) scale(2)`, offset: 0.3 },
                { transform: `translate(0, 0) scale(2) rotate(360deg)`, offset: 0.6 },
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 }
            ], {
                duration: 800,
                easing: 'ease-in-out',
                fill: 'forwards'
            });

            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'bug-success-message';
            successMsg.innerHTML = '✅ All Bugs Fixed!';
            successMsg.style.left = centerX + 'px';
            successMsg.style.top = centerY + 'px';
            this.container.appendChild(successMsg);

            successMsg.animate([
                { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.3 },
                { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 0.7 },
                { transform: 'translate(-50%, -100%) scale(0.8)', opacity: 0 }
            ], {
                duration: 1500,
                easing: 'ease-out',
                fill: 'forwards'
            });

            setTimeout(() => {
                this.tester.remove();
                successMsg.remove();
                this.cleanup();
                // Deactivate terminal mode after animation
                document.body.classList.remove('terminal-mode');
            }, 1500);
        } else {
            this.cleanup();
        }
    }

    cleanup() {
        this.bugs = [];
        this.tester = null;
        this.isAnimating = false;
        // Clean any remaining elements
        this.container.innerHTML = '';
        
        // Deactivate terminal mode theme after animation
        document.body.classList.remove('terminal-mode');
    }
}

// Initialize bug squash animation
window.bugSquashAnimation = null;

// Initialize the Portfolio App
document.addEventListener('DOMContentLoaded', () => {
    const app = new PortfolioApp();
    
    // Initialize bug squash Easter egg
    window.bugSquashAnimation = new BugSquashAnimation();
});