// API Service - Handles all HTTP requests to backend
const log = () => {};
const logErr = console.error.bind(console);

class APIService {
    constructor() {
        this.baseURL = window.APP_CONFIG.apiBaseURL;
        this.retryAttempts = window.APP_CONFIG.retryAttempts;
        this.retryDelay = window.APP_CONFIG.retryDelay;
        // Simple in-memory GET cache: { url -> { data, ts } }
        this._cache = new Map();
        this._cacheTTL = 60 * 1000; // 60 seconds
    }

    getAuthToken() {
        return window.authToken || localStorage.getItem('authToken');
    }
    setAuthToken(token) { window.authToken = token; }
    clearAuthToken() { window.authToken = null; }

    // Check if API is available
    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                return { available: true, data };
            }
            return { available: false, error: `Health check returned ${response.status}` };
        } catch (error) {
            if (error.name === 'AbortError') return { available: false, error: 'API не отвечает (таймаут 5с)' };
            return { available: false, error: error.message };
        }
    }

    // Make HTTP request with retry logic
    async request(endpoint, options = {}, attempt = 1) {
        const isGET = !options.method || options.method === 'GET';
        const cacheKey = this.baseURL + endpoint;

        // Return cached GET response if fresh
        if (isGET && this.getAuthToken()) {
            const cached = this._cache.get(cacheKey);
            if (cached && (Date.now() - cached.ts) < this._cacheTTL) {
                log('[API] Cache hit:', endpoint);
                return cached.data;
            }
        }

        const token = this.getAuthToken();
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            let response;
            try {
                response = await fetch(`${this.baseURL}${endpoint}`, {
                    ...options,
                    headers,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    const health = await this.checkHealth();
                    if (!health.available) {
                        throw new Error(`API недоступен: ${health.error}. Проверьте, что backend развернут по адресу ${this.baseURL}`);
                    }
                    throw new Error('Запрос превысил время ожидания. Попробуйте позже.');
                }
                throw fetchError;
            }

            // Rate limit / server error — retry with backoff
            if (response.status === 429 || response.status === 500) {
                if (attempt <= this.retryAttempts) {
                    await this.sleep(this.retryDelay * Math.pow(2, attempt - 1));
                    return this.request(endpoint, options, attempt + 1);
                }
                throw new Error(response.status === 429 ? 'Too many requests. Please try again later.' : 'Server error. Please try again later.');
            }

            if (response.status === 401) {
                if (this.getAuthToken() && window.auth) {
                    window.auth.logout();
                }
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Не удалось выполнить запрос';
                try {
                    const errorData = JSON.parse(errorText);
                    const translateDetails = (details) => details.map(d => {
                        if (d.includes('Deadline must be in the future')) return 'Срок выполнения должен быть в будущем';
                        if (d.includes('title') || d.includes('Title')) return 'Слишком короткое или длинное название (макс 100 символов)';
                        if (d.includes('description')) return 'Слишком короткое описание';
                        if (d.includes('budget')) return 'Некорректный бюджет';
                        if (d.includes('Name must be')) return 'Имя не должно превышать 100 символов';
                        if (d.includes('Bio must be')) return 'Поле "О себе" не должно превышать 1000 символов';
                        if (d.includes('Invalid avatar URL')) return 'Неверный формат ссылки на изображение';
                        if (d.includes('Avatar URL is too long')) return 'Ссылка на аватар слишком длинная (макс 500 символов)';
                        return d;
                    }).join('\n');

                    if (errorData.details && Array.isArray(errorData.details)) {
                        errorMessage = translateDetails(errorData.details);
                    } else if (errorData.error?.details && Array.isArray(errorData.error.details)) {
                        errorMessage = translateDetails(errorData.error.details);
                    } else if (typeof errorData.error === 'string') {
                        errorMessage = errorData.error;
                    } else if (errorData.error?.message) {
                        errorMessage = errorData.error.message;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (_) { /* non-JSON error body */ }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            // Cache successful GET responses
            if (isGET && this.getAuthToken()) {
                this._cache.set(cacheKey, { data, ts: Date.now() });
            }

            return data;
        } catch (error) {
            logErr('[API] Error:', endpoint, error.message);
            throw error;
        }
    }

    // Invalidate cache for a path prefix (call after mutations)
    invalidateCache(prefix) {
        for (const key of this._cache.keys()) {
            if (key.includes(prefix)) this._cache.delete(key);
        }
    }

    sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

    async get(endpoint) { return this.request(endpoint, { method: 'GET' }); }
    async post(endpoint, data) {
        const result = await this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
        // Invalidate related caches after writes
        const base = '/' + endpoint.split('/')[1];
        this.invalidateCache(base);
        return result;
    }
    async put(endpoint, data) {
        const result = await this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
        const base = '/' + endpoint.split('/')[1];
        this.invalidateCache(base);
        return result;
    }
    async delete(endpoint) {
        const result = await this.request(endpoint, { method: 'DELETE' });
        const base = '/' + endpoint.split('/')[1];
        this.invalidateCache(base);
        return result;
    }

    // ===== Auth Endpoints =====
    async register(email, password) { return this.post('/auth/register', { email, password }); }
    async login(email, password, turnstileToken) {
        const body = { email, password };
        if (turnstileToken) body.turnstile_token = turnstileToken;
        return this.post('/auth/login', body);
    }
    async googleLogin(credential) { return this.post('/auth/google-login', { credential }); }
    async changePassword(oldPassword, newPassword) {
        return this.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword });
    }
    async resendVerificationEmail(email) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        try {
            const response = await fetch(`${this.baseURL}/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.status === 401) {
                if (this.getAuthToken() && window.auth) {
                    window.auth.logout();
                }
                throw new Error('Authentication required');
            }

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try { errorData = JSON.parse(errorText); } catch (_) { throw new Error(errorText || `HTTP ${response.status}`); }
                throw new Error(errorData.message || errorData.error || 'Ошибка при отправке письма');
            }
            return response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') throw new Error('Запрос превысил время ожидания. Попробуйте позже.');
            throw error;
        }
    }

    // ===== Task Endpoints =====
    async getTasks(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.get(`/tasks${queryString ? '?' + queryString : ''}`);
    }
    async getTask(taskId) { return this.get(`/tasks/${taskId}`); }
    async getStats() { return this.get('/stats'); }
    async createTask(taskData) { return this.post('/tasks', { action: 'create_task', data: taskData }); }
    async updateTask(taskId, taskData) { return this.put(`/tasks/${taskId}`, { action: 'update_task', data: taskData }); }
    async deleteTask(taskId) { return this.delete(`/tasks/${taskId}`); }
    async applyToTask(taskId, message) { return this.post(`/tasks/${taskId}/apply`, { action: 'apply_to_task', data: { message } }); }
    async matchWorker(taskId, workerId) { return this.post(`/tasks/${taskId}/match`, { action: 'match_worker', data: { worker_id: workerId } }); }
    async completeTask(taskId) { return this.post(`/tasks/${taskId}/complete`, { action: 'complete_task' }); }
    async cancelTask(taskId) { return this.post(`/tasks/${taskId}/cancel`, { action: 'cancel_task' }); }

    // ===== User/Profile Endpoints =====
    async getUsers(filters = {}) {
        const params = new URLSearchParams();
        if (filters.specialization) params.append('specialization', filters.specialization);
        if (filters.search) params.append('search', filters.search);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
        const qs = params.toString();
        return this.get('/users' + (qs ? '?' + qs : ''));
    }
    async getSpecializations() { return this.get('/users/specializations'); }
    async updateUserRole(targetUserId, newRole) { return this.put('/admin/users/role', { data: { targetUserId, newRole } }); }
    async updateUserStatus(targetUserId, newStatus) { return this.put('/admin/users/ban', { data: { targetUserId, newStatus } }); }
    async getProfile(userId = 'me') { return this.get(`/users/${userId}`); }
    async updateProfile(profileData) { return this.put('/users/me', { action: 'update_profile', data: profileData }); }
    async addContactLink(link) { return this.post('/users/me/contacts', { action: 'add_contact_link', data: link }); }
    async removeContactLink(linkId) { return this.delete(`/users/me/contacts/${linkId}`); }

    // ===== Review Endpoints =====
    async submitReview(userId, rating, comment) { return this.post(`/users/${userId}/reviews`, { data: { rating, comment } }); }
    async getReviews(userId) { return this.get(`/users/${userId}/reviews`); }
    async getProfileReviews(userId) { return this.get(`/users/${userId}/reviews`); }
    async canReviewUser(userId) { return this.get(`/users/${userId}/reviews/can-review`); }
    async submitProfileReview(userId, rating, comment, role) { return this.post(`/users/${userId}/reviews`, { data: { rating, comment, role } }); }
    async updateProfileReview(userId, reviewId, rating, comment, role) { return this.put(`/users/${userId}/reviews/${reviewId}`, { data: { rating, comment, role } }); }

    // ===== Message Endpoints =====
    async getUnreadMessagesCount() {
        const res = await this.get('/messages/unread-count');
        const data = res.data || res;
        return typeof data.unreadCount === 'number' ? data.unreadCount : 0;
    }
    async sendMessage(receiverId, content) { return this.post('/messages', { data: { receiverId, content } }); }

    // ===== Application Endpoints =====
    async getApplications(taskId) { return this.get(`/applications/task/${taskId}`); }
    async getMyApplications() { return this.get('/applications/me'); }
    async updateApplicationMessage(applicationId, message) { return this.put(`/applications/${applicationId}/message`, { message }); }
    async deleteApplication(applicationId) { return this.delete(`/applications/${applicationId}`); }
}

try {
    window.api = new APIService();
} catch (error) {
    logErr('[API] Failed to initialize APIService:', error);
    window.api = {
        getTasks: () => Promise.reject(new Error('API not initialized')),
        getMyApplications: () => Promise.reject(new Error('API not initialized')),
        login: () => Promise.reject(new Error('API not initialized')),
        register: () => Promise.reject(new Error('API not initialized')),
        createTask: () => Promise.reject(new Error('API not initialized')),
        getProfile: () => Promise.reject(new Error('API not initialized')),
        updateProfile: () => Promise.reject(new Error('API not initialized')),
        getTask: () => Promise.reject(new Error('API not initialized'))
    };
}
