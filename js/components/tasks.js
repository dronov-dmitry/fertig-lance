// Tasks component
window.router.register('tasks', async function() {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    
    try {
        const cached = localStorage.getItem('all-tasks-cache');
        const cacheTime = localStorage.getItem('all-tasks-cache-time');
        const CACHE_TTL = 1 * 60 * 1000;
        
        let allTasks = [];
        let fromCache = false;
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_TTL) {
            allTasks = JSON.parse(cached);
            fromCache = true;
        }
        
        const fetchData = async () => {
            const response = await window.api.getTasks({ status: 'OPEN' });
            const freshTasks = response.data || [];
            localStorage.setItem('all-tasks-cache', JSON.stringify(freshTasks));
            localStorage.setItem('all-tasks-cache-time', Date.now().toString());
            return freshTasks;
        };
        
        if (!fromCache) {
            document.getElementById('app').innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div style="display: inline-block; width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: #7f8c8d;">${tr('tasks.loadList')}</p>
                </div>
            `;
            allTasks = await fetchData();
        } else {
            fetchData().then(freshTasks => {
                if (JSON.stringify(allTasks) !== JSON.stringify(freshTasks)) {
                    window.router.navigate('tasks', { replace: true });
                }
            }).catch(e => console.error('Background tasks refresh failed:', e));
        }

        const now = new Date();
        allTasks = allTasks.filter(task => !task.deadline || new Date(task.deadline) >= now);

        // Filter and Sort State from URL
        const urlParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '');
        const currentFilters = {
            specialization: urlParams.get('specialization') || '',
            minPrice: urlParams.get('minPrice') || '',
            maxPrice: urlParams.get('maxPrice') || '',
            sortBy: urlParams.get('sortBy') || 'date_desc'
        };

        const specializations = window.APP_CONFIG.specializations || [];

        window.applyTasksFilter = () => {
            const spec = document.getElementById('tasks-specialization-filter').value;
            const minP = document.getElementById('tasks-min-price').value;
            const maxP = document.getElementById('tasks-max-price').value;
            const sort = document.getElementById('tasks-sort-by').value;
            
            const params = new URLSearchParams();
            if (spec) params.set('specialization', spec);
            if (minP) params.set('minPrice', minP);
            if (maxP) params.set('maxPrice', maxP);
            if (sort) params.set('sortBy', sort);
            
            window.location.hash = '#/tasks?' + params.toString();
        };

        window.resetTasksFilter = () => {
            window.location.hash = '#/tasks';
        };

        // Apply filtering logic
        let displayedTasks = [...allTasks];
        if (currentFilters.specialization) {
            displayedTasks = displayedTasks.filter(t => t.category === currentFilters.specialization);
        }
        if (currentFilters.minPrice) {
            displayedTasks = displayedTasks.filter(t => (t.budget_estimate || 0) >= parseFloat(currentFilters.minPrice));
        }
        if (currentFilters.maxPrice) {
            displayedTasks = displayedTasks.filter(t => (t.budget_estimate || 0) <= parseFloat(currentFilters.maxPrice));
        }

        // Apply sorting logic
        displayedTasks.sort((a, b) => {
            switch (currentFilters.sortBy) {
                case 'date_desc': return new Date(b.created_at) - new Date(a.created_at);
                case 'date_asc': return new Date(a.created_at) - new Date(b.created_at);
                case 'price_desc': return (b.budget_estimate || 0) - (a.budget_estimate || 0);
                case 'price_asc': return (a.budget_estimate || 0) - (b.budget_estimate || 0);
                default: return 0;
            }
        });

        let isAdmin = false;
        let currentUserId = null;
        const payload = window.auth.getJwtPayload();
        if (payload) {
            isAdmin = payload.role === 'ADMIN';
            currentUserId = payload.userId;
        }

        window.deleteTaskAdmin = async (taskId) => {
            if (!confirm(tr('tasks.confirmDelete'))) return;
            try {
                await window.api.request(`/tasks/${taskId}`, { method: 'DELETE' });
                window.utils.showToast(tr('tasks.deleted'), 'success');
                localStorage.removeItem('all-tasks-cache');
                localStorage.removeItem('all-tasks-cache-time');
                window.router.navigate('tasks', { replace: true });
            } catch (e) {
                window.utils.showToast(e.message || tr('tasks.deleteError'), 'error');
            }
        };

        const getInitials = (name, email) => {
            if (name) {
                const parts = name.trim().split(/\s+/);
                if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                else if (parts[0] && parts[0].length > 0) return parts[0][0].toUpperCase();
            }
            if (email && email.length > 0) return email[0].toUpperCase();
            return '?';
        };

        return `
            <div class="tasks-page">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; margin-top: 1rem;">
                    <h1 style="margin: 0;">${tr('tasks.allOpen')}</h1>
                    ${window.auth.isLoggedIn() ? `
                        <button class="btn btn-primary" data-i18n="tasks.createTask" onclick="document.getElementById('createTaskModal').classList.add('active')">
                            ${tr('tasks.createTask')}
                        </button>
                    ` : ''}
                </div>

                <!-- Filter Bar -->
                <div class="card" style="margin-bottom: 2rem; padding: 1.5rem;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; align-items: end;">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="tasks-specialization-filter" style="font-weight: 500; font-size: 0.85rem; margin-bottom: 5px; display: block;">${tr('users.specializationLabel')}</label>
                            <select id="tasks-specialization-filter" class="form-control" onchange="window.applyTasksFilter()" style="padding: 8px;">
                                <option value="">${tr('users.allSpecializations')}</option>
                                ${specializations.map(spec => `
                                    <option value="${spec}" ${currentFilters.specialization === spec ? 'selected' : ''}>${spec}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label style="font-weight: 500; font-size: 0.85rem; margin-bottom: 5px; display: block;">${tr('tasks.budget')}</label>
                            <div style="display: flex; gap: 5px;">
                                <input type="number" id="tasks-min-price" class="form-control" placeholder="Min" value="${currentFilters.minPrice}" onchange="window.applyTasksFilter()" style="padding: 8px; width: 100%;">
                                <input type="number" id="tasks-max-price" class="form-control" placeholder="Max" value="${currentFilters.maxPrice}" onchange="window.applyTasksFilter()" style="padding: 8px; width: 100%;">
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label for="tasks-sort-by" style="font-weight: 500; font-size: 0.85rem; margin-bottom: 5px; display: block;">${tr('users.sortBy')}</label>
                            <select id="tasks-sort-by" class="form-control" onchange="window.applyTasksFilter()" style="padding: 8px;">
                                <option value="date_desc" ${currentFilters.sortBy === 'date_desc' ? 'selected' : ''}>${tr('tasks.published')} (${tr('users.sortDesc')})</option>
                                <option value="date_asc" ${currentFilters.sortBy === 'date_asc' ? 'selected' : ''}>${tr('tasks.published')} (${tr('users.sortAsc')})</option>
                                <option value="price_desc" ${currentFilters.sortBy === 'price_desc' ? 'selected' : ''}>${tr('tasks.budget')} (${tr('users.sortDesc')})</option>
                                <option value="price_asc" ${currentFilters.sortBy === 'price_asc' ? 'selected' : ''}>${tr('tasks.budget')} (${tr('users.sortAsc')})</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="window.resetTasksFilter()" class="btn btn-outline" style="flex: 1; padding: 8px;">${tr('users.resetFilter')}</button>
                        </div>
                    </div>
                    <div style="margin-top: 15px; font-size: 0.85rem; color: #7f8c8d; border-top: 1px solid #f0f0f0; padding-top: 10px;">
                        ${tr('users.found')}: <strong>${displayedTasks.length}</strong>
                    </div>
                </div>

                <div class="card">
                    ${displayedTasks && displayedTasks.length > 0 ? `
                        <div class="grid grid-2">
                            ${displayedTasks.map(task => `
                                <div class="task-card">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
                                        <h3 class="card-title" style="margin: 0; flex: 1;">
                                            <a href="#" onclick="window.viewTaskDetails('${task.task_id}'); return false;" style="text-decoration: underline; color: var(--blue); transition: opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                                                ${task.title}
                                            </a>
                                        </h3>
                                        <span style="font-size: 0.7rem; background: #e8f4f8; color: #2c3e50; padding: 2px 8px; border-radius: 12px; white-space: nowrap;">${task.category || 'Other'}</span>
                                    </div>
                                    ${task.author ? `
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding: 6px; background: #f8f9fa; border-radius: 6px;">
                                            ${task.author.avatar_url 
                                                ? `<img src="${task.author.avatar_url}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`
                                                : `<div style="width: 24px; height: 24px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; letter-spacing: 0.5px;">${getInitials(task.author.name, task.author.email)}</div>`
                                            }
                                            <a href="#" onclick="window.router.navigate('profile', { id: '${task.owner_id}' }); return false;" style="font-size: 0.85rem; font-weight: bold; color: var(--primary-color); text-decoration: none;">${task.author.name || task.author.email || tr('tasks.noName')}</a>
                                        </div>
                                    ` : ''}
                                    <p style="color: #7f8c8d; margin-bottom: 1rem;">
                                        ${task.description.substring(0, 150)}${task.description.length > 150 ? '...' : ''}
                                    </p>
                                    <div style="margin-bottom: 1rem;">
                                        <strong>${tr('tasks.budget')}:</strong> ${window.utils.formatCurrency(task.budget_estimate, task.currency)} 
                                        ${task.budget_type === 'HOURLY' ? `<span style="color: #7f8c8d; font-size: 0.9em;">(${tr('users.perHour')})</span>` : ''}
                                        <br>
                                        <strong>${tr('tasks.deadline')}:</strong> ${window.utils.formatDate(task.deadline)}
                                    </div>
                                    <div class="task-footer">
                                        <span style="font-size: 0.8rem;">${tr('tasks.published')}: ${window.utils.formatDate(task.created_at)}</span>
                                        <div style="display: flex; gap: 10px;">
                                            <button onclick="viewTaskDetails('${task.task_id}')" class="btn btn-secondary">${tr('tasks.more')}</button>
                                            ${(isAdmin || task.owner_id === currentUserId) ? `
                                                <button onclick="window.deleteTaskAdmin('${task.task_id}')" class="btn" style="background-color: #ef4444; color: white;">${tr('tasks.delete')}</button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: #7f8c8d; text-align: center; padding: 2rem;">${
                            (function(){
                                const val = tr('tasks.noTasks');
                                if (val && val !== 'tasks.noTasks' && val.indexOf('.') === -1) return val;
                                const lang = (window.i18n && window.i18n.lang) || 'ru';
                                const map = {
                                    ru: 'На данный момент нет открытых задач.',
                                    uk: 'На даний момент немає відкритих завдань.',
                                    de: 'Derzeit keine offenen Aufgaben.',
                                    en: 'No open tasks at the moment.'
                                };
                                return map[lang] || map.en;
                            })()
                        }</p>
                    `}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading tasks:', error);
        const msg = (error && error.message) ? String(error.message) : '';
        const isUnauthorized = /Unauthorized|401|authorization|токен|token/i.test(msg);
        let title = tr('tasks.loadError');
        let description = (msg || '') + '.';
        if (isUnauthorized) {
            title = tr('tasks.unauthorizedTitle');
            description = '<p style="margin-bottom: 0.75rem;">' + tr('tasks.unauthorizedDesc') + '</p><p style="margin-top: 1rem;"><button type="button" class="btn btn-primary" onclick="document.getElementById(\'authBtn\').click()">' + tr('nav.login') + '</button></p>';
        }
        return `
            <div class="empty-state">
                <h3>${title}</h3>
                <div class="empty-state-description">${description}</div>
            </div>
        `;
    }
});
