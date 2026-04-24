// Auth module - handles authentication and modals
window.auth = (function() {
    function t(key) { return window.i18n && window.i18n.t ? window.i18n.t(key) : key; }
    let googleGisInitialized = false;
    let googleScriptPromise = null;
    let turnstileScriptPromise = null;
    let ensureLoginProvidersReady = () => {};

    function isCurrentHostAllowed(allowedHosts) {
        const host = (window.location.hostname || '').toLowerCase();
        if (!host || !Array.isArray(allowedHosts) || allowedHosts.length === 0) {
            return false;
        }

        return allowedHosts.some((allowedHost) => {
            const normalized = String(allowedHost || '').toLowerCase();
            return normalized && host === normalized;
        });
    }

    function loadExternalScript({ id, src }) {
        const existingScript = document.getElementById(id);
        if (existingScript) {
            return Promise.resolve(existingScript);
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve(script);
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }
    // Get token from localStorage
    function getToken() {
        return localStorage.getItem('authToken');
    }

    // Save token to localStorage
    function saveToken(token) {
        localStorage.setItem('authToken', token);
        window.authToken = token;
    }

    // Remove token from localStorage
    function removeToken() {
        localStorage.removeItem('authToken');
        window.authToken = null;
    }

    function isLoggedIn() {
        return !!getToken();
    }

    function login(token, userData) {
        saveToken(token);
        if (userData) {
            localStorage.setItem('userData', JSON.stringify(userData));
            window.currentUser = userData;
        }
        updateUI();
        window.dispatchEvent(new CustomEvent('auth:login'));
    }

    function logout() {
        removeToken();
        localStorage.removeItem('userData');
        window.currentUser = null;
        updateUI();
        window.router.navigate('home');
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    function getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    function updateUI() {
        const authBtn = document.getElementById('authBtn');
        const navMenu = document.getElementById('navMenu');
        
        if (isLoggedIn()) {
            authBtn.textContent = (window.i18n && window.i18n.t ? window.i18n.t('nav.logout') : 'Выйти');
            authBtn.onclick = () => {
                if (confirm(window.i18n && window.i18n.t ? window.i18n.t('auth.confirmLogout') : 'Вы уверены, что хотите выйти?')) {
                    logout();
                }
            };
            // Show all menu items
            navMenu.querySelectorAll('a[data-page]').forEach(link => {
                link.style.display = '';
            });
            if (typeof window.updateUnreadMessagesBadge === 'function') {
                window.updateUnreadMessagesBadge();
            }
        } else {
            authBtn.textContent = (window.i18n && window.i18n.t ? window.i18n.t('nav.login') : 'Войти');
            authBtn.onclick = () => openLoginModal();
            // Hide protected pages
            const protectedPages = ['my-tasks', 'profile'];
            navMenu.querySelectorAll('a[data-page]').forEach(link => {
                if (protectedPages.includes(link.dataset.page)) {
                    link.style.display = 'none';
                }
            });
            if (typeof window.updateUnreadMessagesBadge === 'function') {
                window.updateUnreadMessagesBadge(0);
            }
        }
    }

    // Initialize auth on page load
    function init() {
        // Restore token if exists
        const token = getToken();
        if (token) {
            window.authToken = token;
            const userData = getCurrentUser();
            if (userData) {
                window.currentUser = userData;
            }
        }
        
        updateUI();
        setupModals();
    }

    // Setup modal functionality
    function setupModals() {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        // Close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.onclick = () => {
                closeAllModals();
            };
        });

        /*
        // Click outside to close (prevent closing if dragging from inside to outside)
        let mouseDownTarget = null;

        window.addEventListener('mousedown', (event) => {
            mouseDownTarget = event.target;
        });

        window.addEventListener('mouseup', (event) => {
            if (mouseDownTarget && mouseDownTarget.classList.contains('modal') && event.target.classList.contains('modal')) {
                closeAllModals();
            }
            mouseDownTarget = null;
        });
        */

        // Show register from login
        const showRegisterBtn = document.getElementById('showRegister');
        if (showRegisterBtn) {
            showRegisterBtn.onclick = (e) => {
                e.preventDefault();
                loginModal.classList.remove('active');
                registerModal.classList.add('active');
            };
        }

        // Show login from register
        const showLoginBtn = document.getElementById('showLogin');
        if (showLoginBtn) {
            showLoginBtn.onclick = (e) => {
                e.preventDefault();
                registerModal.classList.remove('active');
                loginModal.classList.add('active');
            };
        }

        // Terms link inside register modal
        const termsLink = document.getElementById('termsLink');
        if (termsLink) {
            termsLink.onclick = (e) => {
                e.preventDefault();
                closeAllModals();
                window.router.navigate('terms');
            };
        }

        // Update terms checkbox label text (supports i18n)
        function updateTermsLabel() {
            const linkText = window.i18n && window.i18n.t ? window.i18n.t('auth.termsLinkText') : 'Правила пользования сервисом';
            const text = window.i18n && window.i18n.t ? window.i18n.t('auth.termsCheckboxText') : '';
            if (!text) return;

            // Register modal checkbox
            const regLabel = document.getElementById('termsCheckboxLabel');
            if (regLabel) {
                regLabel.innerHTML = text.replace('{{link}}', `<a href="#" id="termsLink" style="color: var(--primary-color);">${linkText}</a>`);
                const regLink = document.getElementById('termsLink');
                if (regLink) regLink.onclick = (e) => { e.preventDefault(); closeAllModals(); window.router.navigate('terms'); };
            }

            // Login modal checkbox (for Google sign-in)
            const loginLabel = document.getElementById('loginTermsCheckboxLabel');
            if (loginLabel) {
                loginLabel.innerHTML = text.replace('{{link}}', `<a href="#" id="loginTermsLink" style="color: var(--primary-color);">${linkText}</a>`);
                const loginLink = document.getElementById('loginTermsLink');
                if (loginLink) loginLink.onclick = (e) => { e.preventDefault(); closeAllModals(); window.router.navigate('terms'); };
            }
        }
        updateTermsLabel();
        window.addEventListener('lang:changed', updateTermsLabel);

        const loginTermsCheckbox = document.getElementById('loginTermsCheckbox');
        const loginTermsLabel = document.getElementById('loginTermsLabel');
        const googleSignInContainer = document.getElementById('googleSignInContainer');
        const turnstileContainer = document.getElementById('turnstile-login-container');
        
        const googleClientId = window.APP_CONFIG && window.APP_CONFIG.googleClientId ? window.APP_CONFIG.googleClientId : '';
        const turnstileEnabled = Boolean(
            window.APP_CONFIG &&
            window.APP_CONFIG.turnstileSiteKey &&
            isCurrentHostAllowed(window.APP_CONFIG.turnstileAllowedHosts)
        );
        const googleEnabled = Boolean(
            googleClientId &&
            isCurrentHostAllowed(window.APP_CONFIG && window.APP_CONFIG.googleAllowedHosts)
        );

        function hasTurnstileVerification() {
            if (!turnstileEnabled) {
                return true;
            }

            if (window.turnstileLoginWidgetId == null || typeof window.turnstile === 'undefined') {
                return false;
            }

            return Boolean(window.turnstile.getResponse(window.turnstileLoginWidgetId));
        }

        function hideGoogleSignIn() {
            if (!googleSignInContainer) return;
            googleSignInContainer.style.display = 'none';
            googleSignInContainer.innerHTML = '';
        }

        function enableTermsCheckbox() {
            if (!loginTermsCheckbox || !loginTermsLabel) return;
            loginTermsCheckbox.disabled = false;
            loginTermsLabel.style.opacity = '1';
            loginTermsLabel.style.pointerEvents = 'auto';
        }

        function disableTermsCheckbox() {
            if (!loginTermsCheckbox || !loginTermsLabel) return;
            loginTermsCheckbox.checked = false;
            loginTermsCheckbox.disabled = true;
            loginTermsLabel.style.opacity = '0.5';
            loginTermsLabel.style.pointerEvents = 'none';
            hideGoogleSignIn();
        }

        function checkAllConditionsMet() {
            return hasTurnstileVerification() && loginTermsCheckbox && loginTermsCheckbox.checked;
        }

        async function initTurnstile() {
            if (!turnstileContainer) return;

            if (!turnstileEnabled) {
                turnstileContainer.style.display = 'none';
                enableTermsCheckbox();
                return;
            }

            turnstileContainer.style.display = '';
            if (window.turnstileLoginWidgetId != null && typeof window.turnstile !== 'undefined') {
                return;
            }

            try {
                if (!turnstileScriptPromise) {
                    turnstileScriptPromise = loadExternalScript({
                        id: 'cf-turnstile-script',
                        src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
                    });
                }
                await turnstileScriptPromise;
            } catch (error) {
                console.error('Turnstile load error:', error);
                turnstileContainer.style.display = 'none';
                enableTermsCheckbox();
                return;
            }

            if (typeof window.turnstile === 'undefined') {
                turnstileContainer.style.display = 'none';
                enableTermsCheckbox();
                return;
            }

            turnstileContainer.innerHTML = '';
            window.turnstileLoginWidgetId = window.turnstile.render(turnstileContainer, {
                sitekey: window.APP_CONFIG.turnstileSiteKey,
                theme: 'light',
                callback: () => {
                    enableTermsCheckbox();
                    if (loginTermsCheckbox && loginTermsCheckbox.checked) {
                        initGoogleSignIn();
                    }
                },
                'expired-callback': () => {
                    disableTermsCheckbox();
                },
                'error-callback': () => {
                    disableTermsCheckbox();
                }
            });
        }

        async function initGoogleSignIn() {
            if (!googleSignInContainer) return;

            if (!googleEnabled || !checkAllConditionsMet()) {
                hideGoogleSignIn();
                return;
            }

            googleSignInContainer.style.display = '';

            try {
                if (!googleScriptPromise) {
                    googleScriptPromise = loadExternalScript({
                        id: 'google-gis-script',
                        src: 'https://accounts.google.com/gsi/client'
                    });
                }
                await googleScriptPromise;
            } catch (error) {
                console.error('Google GIS load error:', error);
                hideGoogleSignIn();
                return;
            }

            if (!(window.google && window.google.accounts && window.google.accounts.id)) {
                hideGoogleSignIn();
                return;
            }

            if (!googleGisInitialized) {
                window.google.accounts.id.initialize({
                    client_id: googleClientId,
                    callback: async (response) => {
                        const credential = response && response.credential;
                        if (!credential) {
                            window.utils.showToast('Google sign-in failed', 'error');
                            return;
                        }

                        const loginTermsCheckbox = document.getElementById('loginTermsCheckbox');
                        if (!loginTermsCheckbox || !loginTermsCheckbox.checked) {
                            window.utils.showToast(t('auth.termsRequired'), 'error');
                            return;
                        }

                        try {
                            const res = await window.api.googleLogin(credential);
                            const token = res.data?.token || res.token;
                            const user = res.data?.user || res.user;

                            if (token) {
                                login(token, user);
                                closeAllModals();
                                window.utils.showToast(t('auth.loginSuccess') || 'Login success', 'success');
                                window.router.navigate('tasks');
                            } else {
                                throw new Error('Не получен токен авторизации');
                            }
                        } catch (error) {
                            console.error('Google login error:', error);
                            window.utils.showToast(error?.message || 'Google login failed', 'error', 10000);
                        }
                    }
                });
                googleGisInitialized = true;
            }

            googleSignInContainer.innerHTML = '';
            try {
                window.google.accounts.id.renderButton(googleSignInContainer, {
                    theme: 'outline',
                    size: 'large',
                    shape: 'pill',
                    text: 'signin_with'
                });
            } catch (error) {
                console.error('Google button render error:', error);
                hideGoogleSignIn();
            }
        }

        ensureLoginProvidersReady = () => {
            if (turnstileEnabled) {
                initTurnstile();
            } else if (turnstileContainer) {
                turnstileContainer.style.display = 'none';
                enableTermsCheckbox();
            }

            if (checkAllConditionsMet() && googleEnabled) {
                initGoogleSignIn();
            } else {
                hideGoogleSignIn();
            }
        };

        if (loginTermsCheckbox && googleSignInContainer) {
            loginTermsCheckbox.addEventListener('change', () => {
                if (checkAllConditionsMet()) {
                    initGoogleSignIn();
                } else {
                    hideGoogleSignIn();
                }
            });
        }

        // Resend verification email handler
        const resendVerificationContainer = document.getElementById('resendVerificationContainer');
        const resendVerificationBtn = document.getElementById('resendVerificationBtn');
        let currentEmailForResend = '';

        resendVerificationBtn.onclick = async () => {
            if (!currentEmailForResend) {
                window.utils.showToast(t('auth.emailRequired'), 'error');
                return;
            }

            try {
                resendVerificationBtn.disabled = true;
                resendVerificationBtn.textContent = t('auth.sending');

                const response = await window.api.resendVerificationEmail(currentEmailForResend);
                
                if (response.emailSent) {
                    window.utils.showToast(t('auth.resendSuccess'), 'success');
                } else {
                    window.utils.showToast(response.message || t('auth.resendSuccess'), 'success');
                }
                resendVerificationContainer.style.display = 'none';
            } catch (error) {
                console.error('Verification email resend error:', error);
                
                // Понятные сообщения об ошибках для пользователя
                let userMessage = 'Ошибка при генерации ссылки для подтверждения';
                
                if (error.message) {
                    if (error.message.includes('Email уже подтвержден')) {
                        userMessage = 'Этот email уже подтвержден. Вы можете войти в систему.';
                    } else if (error.message.includes('Invalid email') || error.message.includes('Неверный формат')) {
                        userMessage = 'Неверный формат email адреса.';
                    } else if (error.message.includes('timeout') || error.message.includes('превысил время ожидания')) {
                        userMessage = 'Сервер не отвечает. Проверьте подключение к интернету и попробуйте позже.';
                    } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
                        userMessage = 'Ошибка доступа. Попробуйте обновить страницу и повторить попытку.';
                    } else if (error.message.includes('500') || error.message.includes('Internal Server Error') || error.message.includes('Failed to send') || error.message.includes('Email service')) {
                        userMessage = 'Ошибка генерации ссылки подтверждения. Обратитесь в поддержку.';
                    } else if (error.message.includes('Не удалось') || error.message.includes('недоступен')) {
                        userMessage = 'Сервис временно недоступен. Попробуйте позже.';
                    } else if (error.message.includes('базы данных') || error.message.includes('database')) {
                        userMessage = 'Ошибка подключения к базе данных. Попробуйте позже.';
                    } else if (error.message.includes('сети') || error.message.includes('network')) {
                        userMessage = 'Ошибка сети. Проверьте подключение к интернету.';
                    } else {
                        userMessage = error.message;
                    }
                }
                
                window.utils.showToast(userMessage, 'error', 10000);
            } finally {
                resendVerificationBtn.disabled = false;
                resendVerificationBtn.textContent = t('auth.getLinkAgain');
            }
        };

        // Resend verification email handler logic inside register
        const resendVerificationRegisterContainer = document.getElementById('resendVerificationRegisterContainer');
        const resendVerificationRegisterBtn = document.getElementById('resendVerificationRegisterBtn');

        if (resendVerificationRegisterBtn) {
            resendVerificationRegisterBtn.onclick = async () => {
                const email = document.getElementById('regEmail').value;
                if (!email) return;

                try {
                    resendVerificationRegisterBtn.disabled = true;
                    resendVerificationRegisterBtn.textContent = t('auth.sending');

                    const response = await window.api.resendVerificationEmail(email);
                    
                    if (response.emailSent) {
                        window.utils.showToast(t('auth.resendSuccess'), 'success');
                    } else {
                        window.utils.showToast(response.message || t('auth.resendSuccess'), 'success');
                    }
                    resendVerificationRegisterContainer.style.display = 'none';
                    setTimeout(() => openLoginModal(), 1000);
                } catch (error) {
                    console.error('Verification email resend error (register):', error);
                    let userMessage = 'Ошибка при генерации ссылки для подтверждения';
                    
                    if (error.message) {
                        if (error.message.includes('Email уже подтвержден')) {
                            userMessage = t('auth.emailAlreadyVerified');
                            setTimeout(() => openLoginModal(), 1000);
                        } else if (error.message.includes('500') || error.message.includes('Failed to send')) {
                            userMessage = 'Ошибка генерации ссылки подтверждения. Обратитесь в поддержку.';
                        } else {
                            userMessage = error.message;
                        }
                    }
                    window.utils.showToast(userMessage, 'error', 10000);
                } finally {
                    resendVerificationRegisterBtn.disabled = false;
                    resendVerificationRegisterBtn.textContent = t('auth.resendBtn');
                }
            };
        }

        // Register form submit
        registerForm.onsubmit = async (e) => {
            e.preventDefault(); // Moved to the very top to stop page refresh on any error!
            
            if (resendVerificationRegisterContainer) {
                resendVerificationRegisterContainer.style.display = 'none';
            }
            
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;

            const termsCheckbox = document.getElementById('termsCheckbox');
            if (!termsCheckbox || !termsCheckbox.checked) {
                window.utils.showToast(t('auth.termsRequired'), 'error');
                return;
            }

            if (password !== passwordConfirm) {
                window.utils.showToast(t('auth.passMismatch'), 'error');
                return;
            }

            if (password.length < 6) {
                window.utils.showToast(t('auth.passMinLength'), 'error');
                return;
            }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = t('auth.registering');

                await window.api.register(email, password);
                
                closeAllModals();
                registerForm.reset();
                window.utils.showToast(t('auth.registerSuccess'), 'success');
                // Open login modal so they are ready once they click the link
                setTimeout(() => openLoginModal(), 1000);
            } catch (error) {
                console.error('Register error:', error);
                const errorMessage = error.message || 'Ошибка регистрации. Попробуйте другой email.';
                
                if (errorMessage.includes('уже существует')) {
                    if (resendVerificationRegisterContainer) {
                        resendVerificationRegisterContainer.style.display = 'block';
                    } else {
                        // Fallback completely
                        const shouldResend = confirm(
                            'Пользователь с таким email уже существует. Возможно, email не был подтвержден.\n\n' +
                            'Отправить письмо для подтверждения email повторно?'
                        );
                        if (shouldResend) {
                            try {
                                await window.api.resendVerificationEmail(email);
                                window.utils.showToast(t('auth.resendSuccess'), 'success');
                                setTimeout(() => openLoginModal(), 1000);
                            } catch (resendError) {
                                window.utils.showToast(resendError.message || 'Ошибка при отправке письма', 'error');
                            }
                        }
                    }
                } else {
                    if (window.utils && typeof window.utils.showToast === 'function') {
                        window.utils.showToast(errorMessage, 'error');
                    } else {
                        alert(errorMessage); // Fallback
                    }
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = t('auth.registerBtn');
            }
        };
    }

    function getJwtPayload() {
        const token = getToken();
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    function openLoginModal() {
        const loginFormElement = document.getElementById('loginForm');
        const loginTermsCheckbox = document.getElementById('loginTermsCheckbox');
        const loginTermsLabel = document.getElementById('loginTermsLabel');
        const googleSignInContainer = document.getElementById('googleSignInContainer');
        const resendVerificationContainer = document.getElementById('resendVerificationContainer');

        if (loginFormElement) {
            loginFormElement.reset();
        }
        if (loginTermsCheckbox) {
            loginTermsCheckbox.checked = false;
            loginTermsCheckbox.disabled = true;
        }
        if (loginTermsLabel) {
            loginTermsLabel.style.opacity = '0.5';
            loginTermsLabel.style.pointerEvents = 'none';
        }
        if (googleSignInContainer) {
            googleSignInContainer.style.display = 'none';
            googleSignInContainer.innerHTML = '';
        }
        if (resendVerificationContainer) {
            resendVerificationContainer.style.display = 'none';
        }
        if (window.turnstileLoginWidgetId != null && typeof window.turnstile !== 'undefined') {
            window.turnstile.reset(window.turnstileLoginWidgetId);
        }

        document.getElementById('loginModal').classList.add('active');
        ensureLoginProvidersReady();
    }

    function openRegisterModal() {
        document.getElementById('registerModal').classList.add('active');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    return {
        getToken,
        getJwtPayload,
        isLoggedIn,
        login,
        logout,
        getCurrentUser,
        updateUI,
        init,
        openLoginModal,
        openRegisterModal
    };
})();

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.auth.init());
} else {
    window.auth.init();
}
