// Main application initialization

// ── Utility functions ──────────────────────────────────────────────────────
window.utils = {
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const existingToasts = container.querySelectorAll('.toast');
        if (existingToasts.length >= 3) existingToasts[0].remove();

        const toast = document.createElement('div');
        const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        const titles = {
            error:   '❌ ' + t('toast.error'),
            success: '✅ ' + t('toast.success'),
            warning: '⚠️ ' + t('toast.warning'),
            info:    'ℹ️ ' + t('toast.info')
        };
        toast.innerHTML = `<strong>${titles[type] || t('toast.info')}</strong><p>${message}</p>`;
        toast.className = `toast ${type}`;
        container.appendChild(toast);

        const removeToast = () => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                setTimeout(() => toast.parentNode && toast.remove(), 300);
            }
        };
        const tid = setTimeout(removeToast, 2000);
        toast.addEventListener('click', () => { clearTimeout(tid); removeToast(); });
    },

    formatCurrency(amount, currency) {
        if (window.currencyService) return window.currencyService.formatAmount(amount, currency || null);
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    },

    isValidUrl(string) {
        try { new URL(string); return true; } catch (_) { return false; }
    },

    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },

    renderAuthRequired(message) {
        const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        return `
            <div class="empty-state">
                <h3>${t('common.authRequired')}</h3>
                <p>${message}</p>
                <br>
                <button onclick="window.auth.openLoginModal()" class="btn btn-primary">
                    ${t('nav.login')}
                </button>
            </div>
        `;
    }
};

// ── Unread messages badge ──────────────────────────────────────────────────
window.updateUnreadMessagesBadge = async function(optionalCount) {
    const link = document.querySelector('a[data-page="messages"]');
    if (!link) return;
    let count;
    if (typeof optionalCount === 'number') {
        count = optionalCount;
    } else if (!window.auth.isLoggedIn()) {
        count = 0;
    } else if (window.api && typeof window.api.getUnreadMessagesCount === 'function') {
        try { count = await window.api.getUnreadMessagesCount(); } catch (e) { count = 0; }
    } else {
        count = 0;
    }
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const badge = count > 0
        ? ` <span class="nav-unread-badge" title="${t('common.unreadBadge')}">${count > 99 ? '99+' : count}</span>`
        : '';
    link.innerHTML = t('nav.messages') + badge;
};

// ── My Tasks route ─────────────────────────────────────────────────────────
window.router.register('my-tasks', async function() {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (!window.auth.isLoggedIn()) {
        return window.utils.renderAuthRequired(t('myTasks.authRequired'));
    }
    try {
        const cached   = localStorage.getItem('my-tasks-cache');
        const cacheTime = localStorage.getItem('my-tasks-cache-time');
        const CACHE_TTL = 0;

        let myTasks = [], myApplications = [], fromCache = false;

        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_TTL) {
            const d = JSON.parse(cached);
            myTasks = d.myTasks || [];
            myApplications = d.myApplications || [];
            fromCache = true;
        }

        const fetchData = async () => {
            const [tasksRes, appsRes] = await Promise.all([
                window.api.getTasks({ owner: 'me' }),
                window.api.getMyApplications()
            ]);
            const freshTasks = tasksRes.data || [];
            const freshApps  = appsRes.data?.applications || [];
            localStorage.setItem('my-tasks-cache', JSON.stringify({ myTasks: freshTasks, myApplications: freshApps }));
            localStorage.setItem('my-tasks-cache-time', Date.now().toString());
            return [freshTasks, freshApps];
        };

        if (!fromCache) {
            document.getElementById('app').innerHTML = `
                <div style="text-align:center;padding:3rem;">
                    <div class="spinner"></div>
                    <p style="margin-top:1rem;color:var(--text-secondary);">${t('myTasks.loadMy')}</p>
                </div>`;
            [myTasks, myApplications] = await fetchData();
        } else {
            fetchData().then(([ft, fa]) => {
                const cur = JSON.stringify({ myTasks, myApplications });
                const fresh = JSON.stringify({ myTasks: ft, myApplications: fa });
                if (cur !== fresh) window.router.navigate('my-tasks', {}, { replace: true });
            }).catch(() => {});
        }

        const statusText = (s) => {
            const map = {
                OPEN: t('status.OPEN'), MATCHED: t('status.MATCHED'),
                COMPLETED: t('status.COMPLETED'), CANCELLED: t('status.CANCELLED'),
                PENDING: t('status.PENDING'), ACCEPTED: t('status.ACCEPTED'), REJECTED: t('status.REJECTED')
            };
            return map[s] || s;
        };

        return `
            <div class="my-tasks-page">
                <h1 style="margin-bottom:2rem;">${t('myTasks.title')}</h1>
                <div class="card" style="margin-bottom:2rem;">
                    <h2 style="margin-bottom:1rem;">${t('myTasks.asCustomer')}</h2>
                    ${myTasks && myTasks.length > 0 ? `
                        <div class="grid grid-2">
                            ${myTasks.map(task => `
                                <div class="task-card">
                                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:1rem;">
                                        <h3 class="card-title" style="margin:0;">
                                            <a href="#" onclick="window.viewTaskDetails('${task.task_id}'); return false;" style="text-decoration: none; color: inherit; transition: color 0.2s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='inherit'">
                                                ${task.title}
                                            </a>
                                        </h3>
                                        <span class="task-status status-${task.status.toLowerCase()}">${statusText(task.status)}</span>
                                    </div>
                                    <p style="color:var(--text-secondary);margin-bottom:1rem;">${task.description.substring(0,100)}...</p>
                                    <div class="task-footer">
                                        <span>${window.utils.formatDate(task.created_at)}</span>
                                        <button onclick="window.router.navigate('task-details',{id:'${task.task_id}'})" class="btn btn-secondary btn-sm">${t('common.more')}</button>
                                    </div>
                                </div>`).join('')}
                        </div>` : `<p style="color:var(--text-secondary);">${t('myTasks.noCreated')}</p>`}
                </div>
                <div class="card">
                    <h2 style="margin-bottom:1rem;">${t('myTasks.asWorker')}</h2>
                    ${myApplications && myApplications.length > 0 ? `
                        <div class="grid grid-2">
                            ${myApplications.map(app => {
                                let appStatus = app.status;
                                if (app.task?.status === 'MATCHED' && app.task?.matched_user_id === app.worker_id) appStatus = 'ACCEPTED';
                                return `
                                <div class="task-card">
                                    <h3 class="card-title">
                                        <a href="#" onclick="window.viewTaskDetails('${app.task_id}'); return false;" style="text-decoration: underline; color: var(--blue); transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                            ${app.task_title || (app.task ? app.task.title : t('myTasks.task'))}
                                        </a>
                                    </h3>
                                    <p style="color:var(--text-secondary);margin-bottom:1rem;">${t('myTasks.responded')} ${window.utils.formatDate(app.created_at || app.updated_at)}</p>
                                    <p style="margin-bottom:1rem;"><strong>${t('myTasks.yourMessage')}</strong><br>${app.message}</p>
                                    <div class="task-footer">
                                        <span class="task-status status-${appStatus.toLowerCase()}">${statusText(appStatus)}</span>
                                        ${app.task_id ? `<button onclick="window.router.navigate('task-details',{id:'${app.task_id}'})" class="btn btn-secondary btn-sm">${t('common.more')}</button>` : ''}
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>` : `<p style="color:var(--text-secondary);">${t('myTasks.noApplications')}</p>`}
                </div>
            </div>`;
    } catch (error) {
        const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        return `<div class="empty-state"><h3>${t('myTasks.loadError')}</h3><p>${error.message}</p></div>`;
    }
});

window.viewTaskDetails = function(taskId) {
    window.router.navigate('task-details', { id: taskId });
};

// ── App initialization ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Currency service — non-blocking
    if (window.currencyService) window.currencyService.init();

    // Health check — fire and forget
    if (window.api && typeof window.api.checkHealth === 'function') {
        window.api.checkHealth().then(h => {
            if (!h.available) {
                const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
                window.utils.showToast('⚠️ ' + t('app.apiUnavailable') + '. ' + t('app.refreshPage'), 'error');
            }
        }).catch(() => {});
    }

    // Email verification token in URL
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const verifyToken = hashParams.get('verify') || new URLSearchParams(window.location.search).get('verify');
    if (verifyToken) {
        try {
            await window.api.request(`/auth/verify?token=${verifyToken}`, { method: 'GET' });
            const url = new URL(window.location);
            url.searchParams.delete('verify');
            if (window.location.hash.includes('verify=')) {
                let h = window.location.hash.replace(/([?&])verify=[^&]+(&|$)/, '$1');
                if (h.endsWith('?') || h.endsWith('&')) h = h.slice(0, -1);
                window.location.hash = h;
            } else {
                window.history.replaceState({}, document.title, url.pathname + url.search);
            }
            window.utils.showToast(window.i18n?.t('auth.verifySuccess') || 'Email подтверждён!', 'success');
            setTimeout(() => window.auth?.openLoginModal(), 1000);
        } catch (e) {
            window.utils.showToast(e.message || window.i18n?.t('auth.verifyError') || 'Ошибка подтверждения.', 'error');
        }
    }

    // Initial route
    if (!window.location.hash || window.location.hash === '#') {
        window.router.navigate('home', {}, { replace: true });
    } else {
        window.dispatchEvent(new Event('popstate'));
    }

    // Delegated profile link clicks
    document.addEventListener('click', function(e) {
        const el = e.target.closest('[data-profile-id]');
        if (el) {
            e.preventDefault();
            const id = el.getAttribute('data-profile-id');
            if (id) window.router.navigate('profile', { id });
        }
    });

    // Mobile nav
    const navToggle = document.getElementById('navToggle');
    const navbar    = document.querySelector('.navbar');
    const navMenu   = document.getElementById('navMenu');
    if (navToggle && navbar && navMenu) {
        navToggle.addEventListener('click', () => {
            navbar.classList.toggle('nav-open');
            navToggle.classList.toggle('is-active');
            document.body.style.overflow = navbar.classList.contains('nav-open') ? 'hidden' : '';
        });
        navMenu.addEventListener('click', e => {
            if (e.target.closest('a') || e.target.closest('button')) {
                navbar.classList.remove('nav-open');
                navToggle.classList.remove('is-active');
                document.body.style.overflow = '';
            }
        });
        document.addEventListener('click', e => {
            if (navbar.classList.contains('nav-open') && !navbar.contains(e.target)) {
                navbar.classList.remove('nav-open');
                navToggle.classList.remove('is-active');
                document.body.style.overflow = '';
            }
        });
    }

    // Navbar scroll shadow
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 8);
        }, { passive: true });
    }

    // Landing page: remove main margin-top
    window.addEventListener('route:home',  () => { const m = document.querySelector('main'); if (m) m.style.marginTop = '0'; });
    window.addEventListener('route:other', () => { const m = document.querySelector('main'); if (m) m.style.marginTop = ''; });

    // Unread badge
    if (window.auth.isLoggedIn() && typeof window.updateUnreadMessagesBadge === 'function') {
        window.updateUnreadMessagesBadge();
    }

    // i18n
    if (window.i18n) {
        window.i18n.applyToPage();
        const langBtn      = document.getElementById('langBtn');
        const langDropdown = document.getElementById('langDropdown');
        if (langBtn && langDropdown) {
            langBtn.addEventListener('click', e => { e.stopPropagation(); langDropdown.classList.toggle('show'); });
            langDropdown.querySelectorAll('button[data-lang]').forEach(btn => {
                btn.addEventListener('click', () => { window.i18n.setLang(btn.getAttribute('data-lang')); langDropdown.classList.remove('show'); });
            });
            document.addEventListener('click', () => langDropdown.classList.remove('show'));
        }
    }
});

// ── Global error handlers ──────────────────────────────────────────────────
window.addEventListener('error', event => {
    const msg = String((event.error && event.error.message) || event.message || '');
    const isTurnstile = msg.includes('Turnstile') || msg.includes('400020');
    if (isTurnstile) {
        const host = window.location.hostname || 'localhost';
        const t = window.i18n?.t?.bind(window.i18n) || (k => k);
        window.utils.showToast(t('app.turnstileDomain') + host + t('app.turnstileAdd'), 'error');
        event.preventDefault();
        return;
    }
    window.utils.showToast(window.i18n?.t('app.genericError') || 'Произошла ошибка.', 'error');
});

window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    const isTurnstile = reason && (
        reason.name === 'TurnstileError' ||
        String(reason.message || '').includes('Turnstile') ||
        String(reason.message || '').includes('400020')
    );
    if (isTurnstile) {
        window.utils.showToast(window.i18n?.t('app.turnstileUnavailable') || 'Капча недоступна.', 'error');
        event.preventDefault();
        return;
    }
    window.utils.showToast(window.i18n?.t('app.requestError') || 'Произошла ошибка при выполнении запроса.', 'error');
});
