// Portfolio Website JavaScript
class PortfolioApp {
    constructor() {
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
        this.typingSpeed = 100;
        this.deletingSpeed = 50;
        this.pauseTime = 2000;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startTypingAnimation();
        this.showSection('home');
        this.loadCategoriesAndRenderFilters(); // NEW: dynamically render filter buttons
        this.loadProjects();
        this.loadSkills();
        this.loadConfig();
        this.loadAboutSection();
        this.loadContactSection();
        this.trackVisit('home');
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

                if (showAll) {
                    const allBtn = document.createElement('button');
                    // Not active by default (we default to first category)
                    allBtn.className = 'filter-btn';
                    allBtn.dataset.filter = 'all';
                    allBtn.textContent = 'All';
                    allBtn.addEventListener('click', (e) => {
                        this.filterProjects('all');
                        this.updateActiveFilter(e.target);
                    });
                    container.appendChild(allBtn);
                }

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

        const typeText = () => {
            const currentText = this.typingTexts[this.currentTextIndex];
            
            if (this.isDeleting) {
                typingElement.textContent = currentText.substring(0, this.currentCharIndex - 1);
                this.currentCharIndex--;
                
                if (this.currentCharIndex === 0) {
                    this.isDeleting = false;
                    this.currentTextIndex = (this.currentTextIndex + 1) % this.typingTexts.length;
                    setTimeout(typeText, this.typingSpeed);
                } else {
                    setTimeout(typeText, this.deletingSpeed);
                }
            } else {
                typingElement.textContent = currentText.substring(0, this.currentCharIndex + 1);
                this.currentCharIndex++;
                
                if (this.currentCharIndex === currentText.length) {
                    this.isDeleting = true;
                    setTimeout(typeText, this.pauseTime);
                } else {
                    setTimeout(typeText, this.typingSpeed);
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
            }, 150);
        }

        // Update navigation
        this.updateActiveNavItem(section);
        this.currentSection = section;
        this.trackVisit(section);
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
        fetch('/api/track_visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ page: page }),
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
                        const content = project.mockup_content;
                        // Handle multiple image slides
                        if (content.includes('img1:')) {
                            const slideUrls = [];
                            // Match any imgN: followed by URL (where N is any number)
                            const pattern = /img\d+:(https?:\/\/[^\s]+(?:\s|$))/g;
                            let match;
                            
                            // Find all matches in the content
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
                                    <div class="slide-hint">
                                        Click to view slideshow (${slideUrls.length} images)
                                    </div>
                                </div>`;
                            }
                        }
                        // Handle single external image
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
                                <div class="slide-hint">
                                    Click to view slideshow
                                </div>
                            </div>`;
                        }
                        // Handle local images
                        else if (content.startsWith('image/')) {
                            // Remove any duplicate "image/" in the path
                            const imagePath = content.replace(/^image\/image\//, 'image/');
                            mockupContentHTML = `<img src="/static/${imagePath}" alt="${project.title} mockup" class="mockup-media">`;
                        }
                        // Handle local videos
                        else if (content.startsWith('video/')) {
                            // Remove any duplicate "video/" in the path
                            const videoPath = content.replace(/^video\/video\//, 'video/');
                            mockupContentHTML = `<video src="/static/${videoPath}" class="mockup-media" controls playsinline></video>`;
                        }
                        // Handle YouTube videos
                        else if (content.includes('youtube.com/watch') || content.includes('youtu.be/')) {
                            let videoId;
                            if (content.includes('youtube.com/watch')) {
                                videoId = new URL(content).searchParams.get('v');
                            } else {
                                videoId = new URL(content).pathname.substring(1);
                            }
                            mockupContentHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen class="mockup-media"></iframe>`;
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

                    projectCard.innerHTML = `
                        <div class="project-preview">
                            <div class="project-info">
                                <h3 class="project-title">${project.title}</h3>
                                <p class="project-description">${project.description}</p>
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

                    const video = projectCard.querySelector('video');
                    if (video) {
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
                return skill.icon && skill.icon.startsWith('<svg') ? skill.icon : '⚡';
        }
    }
}

// Initialize the Portfolio App
document.addEventListener('DOMContentLoaded', () => {
    const app = new PortfolioApp();
});