// Home component - Landing Page
window.router.register('home', async function() {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const isLoggedIn = window.auth.isLoggedIn();
    return `
        <div class="landing-page">

            <!-- ── HERO ── -->
            <section class="hero-section">
                <div class="hero-content">
                    <div class="hero-badge">${t('home.heroBadge')}</div>
                    <h1 class="hero-title">
                        ${t('home.heroTitleLine1')}<br>
                        <span class="accent">${t('home.heroTitleLine2')}</span>
                    </h1>
                    <p class="hero-subtitle">${t('home.subtitle')}</p>
                    <div class="hero-buttons">
                        ${isLoggedIn
                            ? `<a href="#" data-page="tasks" class="btn btn-primary btn-large">${t('home.goToTasks')}</a>`
                            : `<button onclick="document.getElementById('registerModal').classList.add('active')" class="btn btn-primary btn-large">${t('home.getStarted')}</button>
                               <button onclick="window.auth.openLoginModal()" class="btn btn-outline btn-large">${t('nav.login')}</button>`
                        }
                    </div>
                    <div class="hero-stats">
                        <div class="hero-stat">
                            <div class="hero-stat-value">0%</div>
                            <div class="hero-stat-label">${t('home.statCommission')}</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-value">∞</div>
                            <div class="hero-stat-label">${t('home.statTasks')}</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-value">4</div>
                            <div class="hero-stat-label">${t('home.statLanguages')}</div>
                        </div>
                        <div class="hero-stat">
                            <div class="hero-stat-value">$0</div>
                            <div class="hero-stat-label">${t('home.statCost')}</div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── FEATURES ── -->
            <section class="features-section">
                <div class="container">
                    
                    <h2 class="section-title">${t('home.featuresTitle')}</h2>
                    <p class="section-subtitle">${t('home.featuresSubtitle')}</p>
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">👥</div>
                            <h3>${t('home.feature1Title')}</h3>
                            <p>${t('home.feature1Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💰</div>
                            <h3>${t('home.feature7Title')}</h3>
                            <p>${t('home.feature7Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">⭐</div>
                            <h3>${t('home.feature2Title')}</h3>
                            <p>${t('home.feature2Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💼</div>
                            <h3>${t('home.feature3Title')}</h3>
                            <p>${t('home.feature3Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">💬</div>
                            <h3>${t('home.feature5Title')}</h3>
                            <p>${t('home.feature5Text')}</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🔒</div>
                            <h3>${t('home.feature4Title')}</h3>
                            <p>${t('home.feature4Text')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── HOW IT WORKS ── -->
            <section class="how-it-works-section">
                <div class="container">
                    
                    <h2 class="section-title">${t('home.howTitle')}</h2>
                    <p class="section-subtitle" style="color: rgba(255,255,255,0.55);">${t('home.howSubtitle')}</p>
                    <div class="steps">
                        <div class="step">
                            <div class="step-number">1</div>
                            <h3>${t('home.step1')}</h3>
                            <p>${t('home.step1Text')}</p>
                        </div>
                        <div class="step">
                            <div class="step-number">2</div>
                            <h3>${t('home.step2')}</h3>
                            <p>${t('home.step2Text')}</p>
                        </div>
                        <div class="step">
                            <div class="step-number">3</div>
                            <h3>${t('home.step3')}</h3>
                            <p>${t('home.step3Text')}</p>
                        </div>
                        <div class="step">
                            <div class="step-number">4</div>
                            <h3>${t('home.step4')}</h3>
                            <p>${t('home.step4Text')}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── CTA ── -->
            <section class="cta-section">
                <div class="container">
                    <h2>${t('home.ctaTitle')}</h2>
                    <p>${t('home.ctaText')}</p>
                    ${isLoggedIn
                        ? `<a href="#" data-page="tasks" class="btn btn-primary btn-large">${t('home.goToTasks')}</a>`
                        : `<button onclick="document.getElementById('registerModal').classList.add('active')" class="btn btn-primary btn-large">${t('auth.registerBtn')}</button>`
                    }
                </div>
            </section>

            <!-- ── FAQ ── -->
            <section class="faq-section">
                <div class="container" style="max-width: 760px;">
                    
                    <h2 class="section-title">${t('home.faqTitle')}</h2>
                    <p class="section-subtitle">${t('home.faqSubtitle')}</p>
                    <div itemscope itemtype="https://schema.org/FAQPage">
                        ${[1,2,3,4,5].map(i => `
                        <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
                            <h3 itemprop="name">${t('home.faq'+i+'q')}</h3>
                            <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
                                <p itemprop="text">${t('home.faq'+i+'a')}</p>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>
            </section>

            <!-- ── FOOTER ── -->
            <footer class="landing-footer" itemscope itemtype="https://schema.org/Organization">
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h4 itemprop="name">⚡ Fertig-Lance</h4>
                            <p itemprop="description">${t('home.footerMarketplace')}</p>
                            <p style="margin-top:0.75rem; font-size:0.8rem;">${t('home.footerVersion')}</p>
                        </div>
                        <div class="footer-section">
                            <h4>${t('home.footerAuthor')}</h4>
                            <p>Dronov Dmitry</p>
                            <a href="https://t.me/DmitryDronovBIM" target="_blank" rel="noopener noreferrer" class="footer-link">
                                📱 ${t('home.telegramChannel')}
                            </a>
                        </div>
                        <div class="footer-section">
                            <h4>${t('home.footerPlatform')}</h4>
                            <a href="#" data-page="terms" class="footer-link">${t('home.terms')}</a><br>
                            <a href="#" data-page="info" class="footer-link" style="margin-top:0.4rem;">${t('nav.info')}</a><br>
                            <a href="#" data-page="contacts" class="footer-link" style="margin-top:0.4rem;">${t('home.contacts')}</a>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p>&copy; ${new Date().getFullYear()} Fertig-Lance. ${t('home.footerDeveloped')} <a href="https://t.me/DmitryDronovBIM" target="_blank" rel="noopener noreferrer" itemprop="founder">Dronov Dmitry</a></p>
                    </div>
                </div>
            </footer>

        </div>
    `;
});
