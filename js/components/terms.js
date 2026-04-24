// Terms component
window.router.register('terms', async function() {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const p = (k) => t('termsPage.' + k);

    return `
        <div class="terms-page" style="padding: 2rem 0;">
            <div class="card" style="max-width: 860px; margin: 0 auto; padding: 2rem;">
                <h1 style="margin-bottom: 0.5rem; color: var(--primary-color);">${p('title')}</h1>
                <p style="color: #888; margin-bottom: 2rem; font-size: 0.9rem;">${p('version')}</p>

                <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 1.25rem 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                    <strong style="color: #856404;">${p('betaLabel')}</strong>
                    <span style="color: #856404;"> ${t('home.termsBeta')}</span>
                </div>

                <div style="line-height: 1.7;">

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">${p('s1Title')}</h3>
                        <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead><tr style="background: var(--bg-secondary, #f5f5f5);">
                                <th style="padding: 8px 12px; text-align:left; border: 1px solid #ddd;">${p('s1ColTerm')}</th>
                                <th style="padding: 8px 12px; text-align:left; border: 1px solid #ddd;">${p('s1ColDef')}</th>
                            </tr></thead>
                            <tbody>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r1t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r1d')}</td></tr>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r2t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r2d')}</td></tr>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r3t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r3d')}</td></tr>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r4t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r4d')}</td></tr>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r5t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r5d')}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s2Title')}</h3>
                        <p>${p('s2p1')}</p>
                        <p style="margin-top: 0.5rem;">${p('s2p2')}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s3Title')}</h3>
                        <p>${p('s3p1')}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s4Title')}</h3>
                        <ol style="padding-left: 1.5rem;">
                            <li style="margin-bottom: 0.4rem;">${p('s4i1')}</li>
                            <li style="margin-bottom: 0.4rem;">${p('s4i2')}</li>
                            <li style="margin-bottom: 0.4rem;">${p('s4i3')}</li>
                            <li style="margin-bottom: 0.4rem;">${p('s4i4')}</li>
                            <li style="margin-bottom: 0.4rem;">${p('s4i5')}</li>
                        </ol>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s5Title')}</h3>
                        <p>${p('s5p1')}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s6Title')}</h3>
                        <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead><tr style="background: var(--bg-secondary, #f5f5f5);">
                                <th style="padding: 8px 12px; text-align:left; border: 1px solid #ddd;">${p('s6ColRisk')}</th>
                                <th style="padding: 8px 12px; text-align:left; border: 1px solid #ddd;">${p('s6ColDesc')}</th>
                            </tr></thead>
                            <tbody>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s6r1t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s6r1d')}</td></tr>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s6r2t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s6r2d')}</td></tr>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s6r3t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s6r3d')}</td></tr>
                                <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s6r4t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s6r4d')}</td></tr>
                            </tbody>
                        </table>
                        <div style="background: #e8f4fd; border: 1px solid #bee5eb; padding: 0.9rem 1.25rem; border-radius: 8px; margin-top: 0.75rem; font-size: 0.9rem;">
                            ${p('s6rec')}
                        </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s7Title')}</h3>
                        <p>${p('s7p1')}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s8Title')}</h3>
                        <p>${p('s8p1')}</p>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s9Title')}</h3>
                        <p>${p('s9p1')}</p>
                    </div>

                    <div style="margin-bottom: 0.5rem;">
                        <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s10Title')}</h3>
                        <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 1.25rem 1.5rem; border-radius: 8px; font-size: 0.95rem;">
                            <p style="margin: 0 0 0.5rem;"><strong>${p('s10intro')}</strong></p>
                            <ul style="padding-left: 1.25rem; margin: 0;">
                                <li>${p('s10i1')}</li>
                                <li>${p('s10i2')}</li>
                                <li>${p('s10i3')}</li>
                                <li>${p('s10i4')}</li>
                                <li>${p('s10i5')}</li>
                            </ul>
                        </div>
                    </div>

                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <a href="#" data-page="home" class="btn btn-secondary">${t('home.backToHome')}</a>
                </div>
            </div>
        </div>
    `;
});

window.router.register('contacts', async function() {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;

    return `
        <div class="terms-page" style="padding: 2rem 0;">
            <div class="card" style="max-width: 800px; margin: 0 auto; padding: 2rem;">
                <h1 style="margin-bottom: 1rem; color: var(--primary-color);">${t('home.contactsTitle')}</h1>
                <p style="line-height: 1.6; margin-bottom: 2rem;">${t('home.contactsIntro')}</p>

                <div class="terms-content">
                    <section style="margin-bottom: 2rem;">
                        <h3 style="margin-bottom: 1rem;">1. ${t('home.contactsGithubTitle')}</h3>
                        <p style="line-height: 1.6;">${t('home.contactsGithubText')}</p>
                        <p style="margin-top: 0.5rem;">
                            <a href="https://github.com/dronov-dmitry/fertig-lance" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); font-weight: bold; text-decoration: underline;">
                                github.com/dronov-dmitry/fertig-lance
                            </a>
                        </p>
                    </section>

                    <section style="margin-bottom: 2rem;">
                        <h3 style="margin-bottom: 1rem;">2. ${t('home.contactsEmailTitle')}</h3>
                        <p style="line-height: 1.6;">${t('home.contactsEmailText')}</p>
                        <p style="margin-top: 0.5rem;">
                            <a href="mailto:dronov.dmitry.bim@gmail.com" style="color: var(--primary-color); font-weight: bold; text-decoration: underline;">
                                dronov.dmitry.bim@gmail.com
                            </a>
                        </p>
                    </section>
                </div>

                <div style="margin-top: 3rem; text-align: center;">
                    <a href="#" data-page="home" class="btn btn-secondary">${t('home.backToHome')}</a>
                </div>
            </div>
        </div>
    `;
});

window.router.register('info', async function() {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const p = (k) => t('termsPage.' + k);

    let statsHtml = '';
    try {
        const statsRes = await window.api.getStats();
        const stats = statsRes.data || statsRes;
        statsHtml = `
            <section style="margin-bottom: 2.5rem;">
                <h2 style="font-size: 1.1rem; margin-bottom: 1rem;">${t('info.statsTitle') || 'Статистика платформы'}</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                    <thead>
                        <tr style="background: var(--bg-secondary, #f5f5f5);">
                            <th style="padding: 10px 14px; text-align: left; border: 1px solid #ddd;">${t('info.statsMetric') || 'Показатель'}</th>
                            <th style="padding: 10px 14px; text-align: left; border: 1px solid #ddd;">${t('info.statsValue') || 'Значение'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 10px 14px; border: 1px solid #ddd;">${t('info.statsUsers') || 'Зарегистрированных пользователей'}</td>
                            <td style="padding: 10px 14px; border: 1px solid #ddd; font-weight: bold;">${stats.userCount || 0}</td>
                        </tr>
                        <tr style="background: var(--bg-secondary, #f9f9f9);">
                            <td style="padding: 10px 14px; border: 1px solid #ddd;">${t('info.statsTasks') || 'Всего создано задач'}</td>
                            <td style="padding: 10px 14px; border: 1px solid #ddd; font-weight: bold;">${stats.taskCount || 0}</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        `;
    } catch (e) {
        console.error('Error loading stats:', e);
    }

    return `
        <div class="terms-page" style="padding: 2rem 0;">
            <div class="card" style="max-width: 860px; margin: 0 auto; padding: 2rem;">
                <h1 style="margin-bottom: 2rem; color: var(--primary-color);">${t('nav.info')}</h1>

                ${statsHtml}

                <section style="margin-bottom: 2.5rem;">
                    <h2 style="font-size: 1.1rem; margin-bottom: 1rem;">${p('linksTitle')}</h2>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
                        <thead>
                            <tr style="background: var(--bg-secondary, #f5f5f5);">
                                <th style="padding: 10px 14px; text-align: left; border: 1px solid #ddd;">${p('linksColDesc')}</th>
                                <th style="padding: 10px 14px; text-align: left; border: 1px solid #ddd;">${p('linksColUrl')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 10px 14px; border: 1px solid #ddd;">${p('link1desc')}</td>
                                <td style="padding: 10px 14px; border: 1px solid #ddd;">
                                    <a href="https://github.com/dronov-dmitry/fertig-lance" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">
                                        github.com/dronov-dmitry/fertig-lance
                                    </a>
                                </td>
                            </tr>
                            <tr style="background: var(--bg-secondary, #f9f9f9);">
                                <td style="padding: 10px 14px; border: 1px solid #ddd;">${p('link2desc')}</td>
                                <td style="padding: 10px 14px; border: 1px solid #ddd;">
                                    <a href="https://github.com/dronov-dmitry/open-lance" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">
                                        github.com/dronov-dmitry/open-lance
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; border: 1px solid #ddd;">${p('link3desc')}</td>
                                <td style="padding: 10px 14px; border: 1px solid #ddd;">
                                    <a href="https://www.youtube.com/watch?v=lEO2ZJ0XY9Y" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">
                                        youtube.com/watch?v=lEO2ZJ0XY9Y
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 10px 14px; border: 1px solid #ddd;">${p('link4desc')}</td>
                                <td style="padding: 10px 14px; border: 1px solid #ddd;">
                                    <a href="https://github.com/dronov-dmitry" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color);">
                                        github.com/dronov-dmitry
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section>
                    <h2 style="font-size: 1.1rem; margin-bottom: 0.5rem;">${p('title')}</h2>
                    <p style="color: #888; margin-bottom: 1.5rem; font-size: 0.9rem;">${p('version')}</p>

                    <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 1.25rem 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                        <strong style="color: #856404;">${p('betaLabel')}</strong>
                        <span style="color: #856404;"> ${t('home.termsBeta')}</span>
                    </div>

                    <div style="line-height: 1.7;">

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">${p('s1Title')}</h3>
                            <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
                                <thead><tr style="background: var(--bg-secondary, #f5f5f5);">
                                    <th style="padding: 8px 12px; text-align:left; border: 1px solid #ddd;">${p('s1ColTerm')}</th>
                                    <th style="padding: 8px 12px; text-align:left; border: 1px solid #ddd;">${p('s1ColDef')}</th>
                                </tr></thead>
                                <tbody>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r1t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r1d')}</td></tr>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r2t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r2d')}</td></tr>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r3t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r3d')}</td></tr>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r4t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r4d')}</td></tr>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s1r5t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s1r5d')}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s2Title')}</h3>
                            <p>${p('s2p1')}</p>
                            <p style="margin-top: 0.5rem;">${p('s2p2')}</p>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s3Title')}</h3>
                            <p>${p('s3p1')}</p>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s4Title')}</h3>
                            <ol style="padding-left: 1.5rem;">
                                <li style="margin-bottom: 0.4rem;">${p('s4i1')}</li>
                                <li style="margin-bottom: 0.4rem;">${p('s4i2')}</li>
                                <li style="margin-bottom: 0.4rem;">${p('s4i3')}</li>
                                <li style="margin-bottom: 0.4rem;">${p('s4i4')}</li>
                                <li style="margin-bottom: 0.4rem;">${p('s4i5')}</li>
                            </ol>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s5Title')}</h3>
                            <p>${p('s5p1')}</p>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s6Title')}</h3>
                            <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
                                <thead><tr style="background: var(--bg-secondary, #f5f5f5);">
                                    <th style="padding: 8px 12px; text-align:left; border: 1px solid #ddd;">${p('s6ColRisk')}</th>
                                    <th style="padding: 8px 12px; text-align:left; border: 1px solid #ddd;">${p('s6ColDesc')}</th>
                                </tr></thead>
                                <tbody>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s6r1t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s6r1d')}</td></tr>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s6r2t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s6r2d')}</td></tr>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s6r3t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s6r3d')}</td></tr>
                                    <tr><td style="padding: 8px 12px; border: 1px solid #ddd;"><strong>${p('s6r4t')}</strong></td><td style="padding: 8px 12px; border: 1px solid #ddd;">${p('s6r4d')}</td></tr>
                                </tbody>
                            </table>
                            <div style="background: #e8f4fd; border: 1px solid #bee5eb; padding: 0.9rem 1.25rem; border-radius: 8px; margin-top: 0.75rem; font-size: 0.9rem;">
                                ${p('s6rec')}
                            </div>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s7Title')}</h3>
                            <p>${p('s7p1')}</p>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s8Title')}</h3>
                            <p>${p('s8p1')}</p>
                        </div>

                        <div style="margin-bottom: 1.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s9Title')}</h3>
                            <p>${p('s9p1')}</p>
                        </div>

                        <div style="margin-bottom: 0.5rem;">
                            <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">${p('s10Title')}</h3>
                            <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 1.25rem 1.5rem; border-radius: 8px; font-size: 0.95rem;">
                                <p style="margin: 0 0 0.5rem;"><strong>${p('s10intro')}</strong></p>
                                <ul style="padding-left: 1.25rem; margin: 0;">
                                    <li>${p('s10i1')}</li>
                                    <li>${p('s10i2')}</li>
                                    <li>${p('s10i3')}</li>
                                    <li>${p('s10i4')}</li>
                                    <li>${p('s10i5')}</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </section>

                <div style="margin-top: 3rem; text-align: center;">
                    <a href="#" data-page="home" class="btn btn-secondary">${t('home.backToHome')}</a>
                </div>
            </div>
        </div>
    `;
});
