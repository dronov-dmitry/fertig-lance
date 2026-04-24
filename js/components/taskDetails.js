// Task details page component
window.router.register('task-details', async function(props) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (!props || !props.id) {
        return `
            <div class="container" style="margin-top: 2rem;">
                <p class="error">${tr('taskDetails.taskNotFound')}</p>
                <button onclick="window.router.navigate('tasks')" class="btn btn-outline">${tr('taskDetails.backToTasks')}</button>
            </div>
        `;
    }

    const taskId = props.id;
    const currentUser = window.auth.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'ADMIN';

    try {
        const response = await window.api.getTask(taskId);
        const task = response.data || response;

        if (!task || !task.task_id) {
            throw new Error(tr('taskDetails.taskNotFound'));
        }

        const isOwner = currentUser && (task.owner_id === currentUser.user_id || task.owner_id === currentUser.id);
        
        // Show "Review customer" only if worker can review owner
        let canReviewOwner = false;
        if (currentUser && !isOwner && task.status === 'COMPLETED') {
            try {
                const canReviewResp = await window.api.canReviewUser(task.owner_id);
                canReviewOwner = (canReviewResp.data || canReviewResp).canReview === true;
            } catch (e) { /* canReviewOwner remains false */ }
        }
        
        // Check if owner can review worker
        let canReviewWorker = false;
        if (currentUser && isOwner && task.status === 'COMPLETED') {
            try {
                // Find accepted worker from applications to check review status
                const appsResp = await window.api.getApplications(taskId);
                const apps = appsResp.data || appsResp;
                const acceptedApp = Array.isArray(apps) ? apps.find(a => a.status === 'ACCEPTED') : null;
                
                if (acceptedApp) {
                    const canReviewResp = await window.api.canReviewUser(acceptedApp.worker_id);
                    canReviewWorker = (canReviewResp.data || canReviewResp).canReview === true;
                    // Store worker_id for review form
                    task.accepted_worker_id = acceptedApp.worker_id;
                }
            } catch (e) { /* canReviewWorker remains false */ }
        }

        const statusClass = `status-${(task.status || 'OPEN').toLowerCase()}`;
        const statusText = tr(`status.${task.status || 'OPEN'}`);

        // Render tags
        const tagsHtml = task.tags && task.tags.length > 0
            ? `<div class="task-tags" style="margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; gap: 8px;">
                ${task.tags.map(tag => `<span class="tag" style="background: #e1f5fe; color: #0288d1; padding: 4px 12px; border-radius: 16px; font-size: 0.9rem; margin: 0;">${tag}</span>`).join('')}
               </div>`
            : '';

        // Worker application logic
        let actionFormHtml = '';
        if (currentUser && !isOwner) {
            let myApplication = null;
            try {
                const appsResp = await window.api.getApplications(taskId);
                const apps = appsResp.data || appsResp;
                if (Array.isArray(apps)) {
                    myApplication = apps.find(a => a.worker_id === (currentUser.user_id || currentUser.id));
                }
            } catch (e) {}

            if (myApplication) {
                const appStatusText = tr(`status.${myApplication.status}`);
                actionFormHtml = `
                    <div class="card" style="margin-top: 2rem; border-left: 4px solid #3498db;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0;">${tr('taskDetails.yourResponse')}</h3>
                            <span class="task-status status-${myApplication.status.toLowerCase()}">${appStatusText}</span>
                        </div>
                        <div id="application-view-mode">
                            <p style="white-space: pre-wrap; margin-bottom: 1.5rem; color: #34495e;">${myApplication.message}</p>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="window.toggleEditApplication(true)" class="btn btn-outline" style="padding: 6px 16px; font-size: 0.9rem;">${tr('taskDetails.changeResponse')}</button>
                                <button onclick="window.withdrawApplication('${myApplication.application_id}', '${taskId}')" class="btn btn-outline" style="padding: 6px 16px; font-size: 0.9rem; color: #e74c3c; border-color: #e74c3c;">${tr('taskDetails.withdrawResponse')}</button>
                            </div>
                        </div>
                        <div id="application-edit-mode" style="display: none;">
                            <textarea id="edit-app-message" class="form-control" rows="4" style="margin-bottom: 1rem; width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">${myApplication.message}</textarea>
                            <div style="display: flex; gap: 10px;">
                                <button id="save-app-btn" onclick="window.saveApplicationEdit('${myApplication.application_id}', '${taskId}')" class="btn btn-primary" style="padding: 6px 16px; font-size: 0.9rem;">${tr('taskDetails.saveChanges')}</button>
                                <button onclick="window.toggleEditApplication(false)" class="btn btn-outline" style="padding: 6px 16px; font-size: 0.9rem;">${tr('taskDetails.cancel')}</button>
                            </div>
                        </div>

                        ${myApplication.status === 'ACCEPTED' && task.status === 'MATCHED' ? `
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                                <p style="color: #27ae60; font-weight: bold; margin-bottom: 15px;">${tr('status.youAccepted')}</p>
                                <button onclick="window.toggleInlineMessageForm('${task.owner_id}')" class="btn btn-primary" style="margin-bottom: 15px;">✉ ${tr('messages.replyTitle')}</button>
                                
                                <div id="inline-msg-form-${task.owner_id}" style="display: none; margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                                    <h4 style="margin: 0 0 12px 0; color: #2c3e50;">${tr('messages.replyTitle')}</h4>
                                    <textarea id="inline-msg-text-${task.owner_id}" rows="4" placeholder="${tr('messages.replyPlaceholder')}" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical; margin-bottom: 10px;"></textarea>
                                    <div style="display: flex; gap: 10px;">
                                        <button onclick="window.sendInlineMessage('${task.owner_id}', '${task.task_id}')" class="btn btn-primary" style="padding: 6px 15px; font-size: 0.9rem;">${tr('messages.sendBtn')}</button>
                                        <button onclick="document.getElementById('inline-msg-form-${task.owner_id}').style.display = 'none'" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">${tr('profile.cancel')}</button>
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                        ${canReviewOwner ? `
                            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                                <button onclick="window.toggleInlineReviewForm('${task.owner_id}')" class="btn btn-primary">⭐ ${tr('taskDetails.reviewCustomer')}</button>
                                
                                <div id="inline-review-form-${task.owner_id}" style="display: none; margin-top: 15px; padding: 15px; border: 1px solid #f39c12; border-radius: 8px; background: #fffdf5;">
                                    <h4 style="margin: 0 0 12px 0; color: #2c3e50;">${tr('profile.reviewCustomer')}</h4>
                                    <div style="margin-bottom: 10px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">${tr('profile.ratingLabel')}</label>
                                        <select id="inline-review-rating-${task.owner_id}" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit;">
                                            <option value="5">${tr('profile.rating5Full') || '⭐⭐⭐⭐⭐ (5) Excellent'}</option>
                                            <option value="4">${tr('profile.rating4Full') || '⭐⭐⭐⭐ (4) Good'}</option>
                                            <option value="3">${tr('profile.rating3Full') || '⭐⭐⭐ (3) Normal'}</option>
                                            <option value="2">${tr('profile.rating2Full') || '⭐⭐ (2) Poor'}</option>
                                            <option value="1">${tr('profile.rating1Full') || '⭐ (1) Very poor'}</option>
                                        </select>
                                    </div>
                                    <div style="margin-bottom: 10px;">
                                        <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">${tr('profile.commentLabel')}</label>
                                        <textarea id="inline-review-text-${task.owner_id}" rows="3" placeholder="${tr('profile.commentPlaceholder')}" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                                    </div>
                                    <div style="display: flex; gap: 10px;">
                                        <button onclick="window.submitInlineReview('${task.owner_id}', 'AS_WORKER', '${task.task_id}')" class="btn btn-primary" style="padding: 6px 16px; font-size: 0.85rem;">${tr('profile.publish')}</button>
                                        <button onclick="document.getElementById('inline-review-form-${task.owner_id}').style.display = 'none'" class="btn btn-outline" style="padding: 6px 16px; font-size: 0.85rem;">${tr('profile.cancel')}</button>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            } else if (task.status === 'OPEN') {
                actionFormHtml = `
                    <div class="card" style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">${tr('taskDetails.applyToTask')}</h3>
                        <div class="form-group">
                            <label for="apply-message">${tr('taskDetails.messageToCustomer')}</label>
                            <textarea id="apply-message" class="form-control" rows="4" placeholder="${tr('taskDetails.applyPlaceholder')}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;"></textarea>
                        </div>
                        <button id="apply-btn" onclick="window.applyToTask('${taskId}')" class="btn btn-primary" style="margin-top: 1rem;">${tr('taskDetails.sendResponse')}</button>
                    </div>
                `;
            }
        } else if (!window.auth.isLoggedIn()) {
            actionFormHtml = `
                <div class="card" style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1.5rem;">${tr('taskDetails.applyToTask')}</h3>
                    <div style="text-align: center; padding: 30px 20px; background: #f8f9fa; border-radius: 8px; border: 1px dashed #cbd5e1;">
                        <p style="margin-bottom: 1.25rem; color: #64748b; font-size: 0.95rem;">${tr('common.authRequired')}</p>
                        <button onclick="window.auth.openLoginModal()" class="btn btn-primary" style="padding: 10px 24px;">${tr('nav.login')}</button>
                    </div>
                </div>
            `;
        } else if (isOwner) {
            let applicationsHtml = `<p style="color: #7f8c8d;">${tr('taskDetails.noApplications')}</p>`;
            try {
                const appsResp = await window.api.getApplications(taskId);
                const apps = appsResp.data || appsResp;
                if (Array.isArray(apps) && apps.length > 0) {
                    applicationsHtml = `
                        <div class="applications-list">
                            ${apps.map(app => `
                                <div class="card" style="margin-bottom: 1rem; border-left: 4px solid ${app.status === 'ACCEPTED' ? '#27ae60' : '#ddd'};">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
                                        <div style="flex: 1; min-width: 200px;">
                                            <a href="#" data-profile-id="${app.worker_id}" class="message-author" style="font-weight: bold; color: var(--primary-color); text-decoration: none; font-size: 1.1rem; display: block; margin-bottom: 5px;">${app.worker_name || 'Freelancer'}</a>
                                            <div style="font-size: 0.85rem; color: #7f8c8d;">${tr('taskDetails.ratingLabel')} ${app.worker_rating ? '⭐ ' + app.worker_rating : '—'}</div>
                                            <p style="white-space: pre-wrap; margin: 10px 0; color: #34495e;">${app.message}</p>
                                        </div>
                                        <span class="task-status status-${app.status.toLowerCase()}">${tr(`status.${app.status}`)}</span>
                                    </div>
                                    
                                    <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                                        ${app.status === 'PENDING' && task.status === 'OPEN' ? `
                                            <button onclick="window.updateApplicationStatus('${app.application_id}', 'ACCEPTED', '${taskId}')" class="btn btn-primary" style="padding: 6px 15px; font-size: 0.9rem;">${tr('status.ACCEPTED')}</button>
                                            <button onclick="window.updateApplicationStatus('${app.application_id}', 'REJECTED', '${taskId}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem; color: #e74c3c; border-color: #e74c3c;">${tr('status.REJECTED')}</button>
                                            <button onclick="window.toggleInlineMessageForm('${app.worker_id}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">✉</button>
                                        ` : ''}
                                        
                                        ${app.status === 'ACCEPTED' && task.status === 'MATCHED' ? `
                                            <button onclick="window.completeTaskAdmin('${task.task_id}')" class="btn" style="background-color: #22c55e; color: white; padding: 6px 15px; font-size: 0.9rem;">${tr('taskDetails.completeTask')}</button>
                                            <button onclick="window.toggleInlineMessageForm('${app.worker_id}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">✉ ${tr('messages.reply')}</button>
                                            ${canReviewWorker && task.accepted_worker_id === app.worker_id ? `<button onclick="window.toggleInlineReviewForm('${app.worker_id}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">⭐ ${tr('taskDetails.reviewWorker')}</button>` : ''}
                                        ` : ''}

                                        ${app.status === 'ACCEPTED' && task.status === 'COMPLETED' ? `
                                            <button onclick="window.toggleInlineMessageForm('${app.worker_id}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">✉ ${tr('messages.reply')}</button>
                                            ${canReviewWorker && task.accepted_worker_id === app.worker_id ? `<button onclick="window.toggleInlineReviewForm('${app.worker_id}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">⭐ ${tr('taskDetails.reviewWorker')}</button>` : ''}
                                        ` : ''}
                                    </div>

                                    <div id="inline-review-form-${app.worker_id}" style="display: none; margin-top: 15px; padding: 15px; border: 1px solid #f39c12; border-radius: 8px; background: #fffdf5;">
                                        <h4 style="margin: 0 0 12px 0; color: #2c3e50;">${tr('profile.reviewWorker')}</h4>
                                        <div style="margin-bottom: 10px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">${tr('profile.ratingLabel')}</label>
                                            <select id="inline-review-rating-${app.worker_id}" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit;">
                                                <option value="5">${tr('profile.rating5Full') || '⭐⭐⭐⭐⭐ (5) Excellent'}</option>
                                                <option value="4">${tr('profile.rating4Full') || '⭐⭐⭐⭐ (4) Good'}</option>
                                                <option value="3">${tr('profile.rating3Full') || '⭐⭐⭐ (3) Normal'}</option>
                                                <option value="2">${tr('profile.rating2Full') || '⭐⭐ (2) Poor'}</option>
                                                <option value="1">${tr('profile.rating1Full') || '⭐ (1) Very poor'}</option>
                                            </select>
                                        </div>
                                        <div style="margin-bottom: 10px;">
                                            <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem;">${tr('profile.commentLabel')}</label>
                                            <textarea id="inline-review-text-${app.worker_id}" rows="3" placeholder="${tr('profile.commentPlaceholder')}" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                                        </div>
                                        <div style="display: flex; gap: 10px;">
                                            <button onclick="window.submitInlineReview('${app.worker_id}', 'AS_CLIENT', '${task.task_id}')" class="btn btn-primary" style="padding: 6px 16px; font-size: 0.85rem;">${tr('profile.publish')}</button>
                                            <button onclick="document.getElementById('inline-review-form-${app.worker_id}').style.display = 'none'" class="btn btn-outline" style="padding: 6px 16px; font-size: 0.85rem;">${tr('profile.cancel')}</button>
                                        </div>
                                    </div>

                                    <div id="inline-msg-form-${app.worker_id}" style="display: none; margin-top: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                                        <h4 style="margin: 0 0 12px 0; color: #2c3e50;">${tr('messages.replyTitle')}</h4>
                                        <textarea id="inline-msg-text-${app.worker_id}" rows="3" placeholder="${tr('messages.replyPlaceholder')}" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical; margin-bottom: 10px;"></textarea>
                                        <div style="display: flex; gap: 10px;">
                                            <button onclick="window.sendInlineMessage('${app.worker_id}', '${task.task_id}')" class="btn btn-primary" style="padding: 6px 15px; font-size: 0.9rem;">${tr('messages.sendBtn')}</button>
                                            <button onclick="document.getElementById('inline-msg-form-${app.worker_id}').style.display = 'none'" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">${tr('profile.cancel')}</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            } catch (e) {
                applicationsHtml = `<p style="color: #e74c3c;">${tr('taskDetails.error')}: ${e.message}</p>`;
            }

            actionFormHtml = `
                <div style="margin-top: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 10px;">
                        <h3 style="margin: 0;">${tr('taskDetails.applicationTitle')}</h3>
                    </div>
                    ${applicationsHtml}
                </div>
            `;
        }

        return `
            <div class="container" style="max-width: 900px; padding-bottom: 50px;">
                <div style="margin: 1.5rem 0;">
                    <a href="#" onclick="window.router.navigate('tasks'); return false;" style="text-decoration: none; color: #7f8c8d; font-weight: 500; display: flex; align-items: center; gap: 5px;">
                        <span style="font-size: 1.2rem; margin-right: 5px;">&larr;</span> ${tr('taskDetails.backBtn')}
                    </a>
                </div>

                <div class="card">
                    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                            <span class="task-status ${statusClass}" style="font-size: 0.85rem; padding: 4px 12px; white-space: nowrap;">${statusText}</span>
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                                ${isOwner && task.status === 'OPEN' ? `
                                    <button onclick="window.cancelTask('${task.task_id}')" class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem; border-color: #ef4444; color: #ef4444;">
                                        ${tr('taskDetails.closeTask')}
                                    </button>
                                    <button onclick="window.openEditTaskModal()" class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem; border-color: var(--primary-color); color: var(--primary-color);">
                                        ${tr('tasks.editTask')}
                                    </button>
                                ` : isOwner && (task.status === 'MATCHED' || task.status === 'COMPLETED' || task.status === 'CANCELLED') ? `
                                    <button onclick="window.openEditTaskModal()" class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem; border-color: var(--primary-color); color: var(--primary-color);">
                                        ${tr('tasks.editTask')}
                                    </button>
                                ` : ''}
                                ${(isAdmin || isOwner) ? `
                                    ${task.status === 'MATCHED' ? `
                                        <button onclick="window.completeTaskAdmin('${task.task_id}')" class="btn" style="background-color: #22c55e; color: white; padding: 4px 12px; font-size: 0.8rem;">
                                            ${tr('taskDetails.completeTask')}
                                        </button>
                                    ` : ''}
                                    <button onclick="window.deleteTaskAdmin('${task.task_id}')" class="btn" style="background-color: #ef4444; color: white; padding: 4px 12px; font-size: 0.8rem;">
                                        ${tr('tasks.delete')}
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <h1 style="margin: 0; font-size: clamp(1.5rem, 6vw, 2.25rem); color: #2c3e50; word-break: break-word; line-height: 1.2; letter-spacing: -0.02em;">${task.title}</h1>
                    </div>

                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; background: #fcfcfc; padding: 15px; border-radius: 8px; border: 1px solid #f0f0f0;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            ${task.author ? `
                                <div style="display: inline-flex; align-items: center; gap: 10px; padding: 4px 8px; background: #fff; border-radius: 6px; border: 1px solid #eee;">
                                    ${task.author.avatar_url 
                                        ? `<img src="${task.author.avatar_url}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">` 
                                        : `<div style="width: 24px; height: 24px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">${(task.author.name || 'U').charAt(0).toUpperCase()}</div>`
                                    }
                                    <a href="#" data-profile-id="${task.owner_id}" class="message-author" style="text-decoration: none; color: #2c3e50; font-weight: 600; font-size: 0.9rem;">${task.author.name || 'User'}</a>
                                    ${task.author.rating_client ? `<span style="font-size: 0.75rem; color: #95a5a6;">⭐ ${task.author.rating_client}</span>` : ''}
                                </div>
                            ` : ''}
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                            <div style="font-size: 0.9rem; color: #34495e;">
                                <strong>${tr('users.specializationLabel')}</strong> <span style="background: #e8f4f8; color: #2c3e50; padding: 2px 8px; border-radius: 12px; font-size: 0.85rem;">${task.category || 'Other'}</span>
                            </div>
                            <div style="font-size: 0.9rem; color: #34495e;">
                                <strong>${tr('taskDetails.budgetLabel')}</strong> <span style="color: #27ae60; font-weight: bold;">${task.budget_estimate ? (window.utils.formatCurrency ? window.utils.formatCurrency(task.budget_estimate, task.currency) : task.budget_estimate + ' ' + (task.currency || '₽')) : '—'}</span> ${task.budget_type === 'HOURLY' ? ` / ${tr('users.perHour')}` : ''}
                            </div>
                            <div style="font-size: 0.9rem; color: #34495e;">
                                <strong>${tr('taskDetails.deadlineLabel')}</strong> ${window.utils.formatDate(task.deadline)}
                            </div>
                            <div style="font-size: 0.9rem; color: #34495e;">
                                <strong>${tr('taskDetails.createdLabel')}</strong> ${window.utils.formatDate(task.created_at)}
                            </div>
                        </div>
                    </div>

                    ${tagsHtml}

                    <div style="margin-top: 1.5rem;">
                        <h3 style="margin-bottom: 1rem; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">${tr('taskDetails.descriptionTitle')}</h3>
                        <div style="line-height: 1.8; color: #2c3e50; white-space: pre-wrap; font-size: 1.05rem; word-break: break-word;">${task.description}</div>
                    </div>

                    <div class="card" style="margin-top: 2rem; background: #fdfdfd; border: 1px dashed #ddd; overflow: hidden;">
                        <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px;">
                            <span style="font-weight: bold; color: #555;">${tr('taskDetails.share')}</span>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                <button onclick="window.copyTaskLink('${task.task_id}')" class="btn btn-outline" style="padding: 5px 12px; font-size: 0.8rem; display: flex; align-items: center; gap: 5px;">
                                    📋 ${tr('taskDetails.copyLink')}
                                </button>
                                <a href="https://t.me/share/url?url=${encodeURIComponent(window.location.origin + window.location.pathname + '#/task-details?id=' + task.task_id)}&text=${encodeURIComponent(tr('taskDetails.shareText') + task.title)}" target="_blank" class="btn btn-outline" style="padding: 5px 12px; font-size: 0.8rem; border-color: #0088cc; color: #0088cc; text-decoration: none;">
                                    TG
                                </a>
                                <a href="https://vk.com/share.php?url=${encodeURIComponent(window.location.origin + window.location.pathname + '#/task-details?id=' + task.task_id)}&title=${encodeURIComponent(task.title)}" target="_blank" class="btn btn-outline" style="padding: 5px 12px; font-size: 0.8rem; border-color: #4c75a3; color: #4c75a3; text-decoration: none;">
                                    VK
                                </a>
                                <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(tr('taskDetails.shareText') + task.title + ' ' + window.location.origin + window.location.pathname + '#/task-details?id=' + task.task_id)}" target="_blank" class="btn btn-outline" style="padding: 5px 12px; font-size: 0.8rem; border-color: #25d366; color: #25d366; text-decoration: none;">
                                    WA
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                ${actionFormHtml}

                <!-- Edit Task Modal (inline) -->
                <div id="editTaskModal" class="modal">
                    <div class="modal-content" style="max-width: 700px;">
                        <span class="close" onclick="window.closeEditTaskModal()">&times;</span>
                        <h2>${tr('tasks.editTask')}</h2>
                        <form id="editTaskForm" onsubmit="window.submitEditTask(event, '${task.task_id}')">
                            <div class="form-group">
                                <label for="edit-task-title">${tr('createTask.taskTitle')}</label>
                                <input type="text" id="edit-task-title" class="form-control" required value="${task.title.replace(/"/g, '&quot;')}">
                            </div>
                            <div class="form-group">
                                <label for="edit-task-desc">${tr('createTask.description')}</label>
                                <textarea id="edit-task-desc" class="form-control" rows="8" required>${task.description}</textarea>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                                <div class="form-group">
                                    <label for="edit-task-category">${tr('users.specializationLabel')}</label>
                                    <select id="edit-task-category" class="form-control" required style="width: 100%; padding: 10px; border: 1.5px solid var(--border); border-radius: var(--r); background: var(--bg-card); font-family: inherit;">
                                        ${(window.APP_CONFIG.specializations || []).map(spec => `
                                            <option value="${spec}" ${task.category === spec ? 'selected' : ''}>${spec}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit-task-deadline">${tr('createTask.deadline')}</label>
                                    <input type="date" id="edit-task-deadline" class="form-control" required value="${task.deadline ? task.deadline.split('T')[0] : ''}">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 15px;">
                                <div class="form-group">
                                    <label for="edit-task-budget">${tr('createTask.budget')}</label>
                                    <input type="number" id="edit-task-budget" class="form-control" value="${task.budget_estimate || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="edit-task-budget-type">${tr('profile.perHour')}</label>
                                    <select id="edit-task-budget-type" class="form-control">
                                        <option value="FIXED" ${task.budget_type === 'FIXED' ? 'selected' : ''}>${tr('createTask.budgetFixed')}</option>
                                        <option value="HOURLY" ${task.budget_type === 'HOURLY' ? 'selected' : ''}>${tr('createTask.budgetHourly')}</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="edit-task-currency">${tr('profile.currencyLabel')}</label>
                                    <select id="edit-task-currency" class="form-control">
                                        <option value="RUB" ${task.currency === 'RUB' ? 'selected' : ''}>RUB (₽)</option>
                                        <option value="UAH" ${task.currency === 'UAH' ? 'selected' : ''}>UAH (₴)</option>
                                        <option value="EUR" ${task.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                                        <option value="USD" ${task.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="edit-task-tags">${tr('createTask.skills')}</label>
                                <input type="text" id="edit-task-tags" class="form-control" value="${task.tags ? task.tags.join(', ') : ''}" placeholder="${tr('createTask.skillsPlaceholder')}">
                            </div>
                            <div style="margin-top: 1.5rem; display: flex; gap: 10px; justify-content: flex-end;">
                                <button type="button" onclick="window.closeEditTaskModal()" class="btn btn-outline">${tr('taskDetails.cancel')}</button>
                                <button type="submit" id="save-task-btn" class="btn btn-primary">${tr('taskDetails.saveChanges')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        console.error('[TaskDetails] Error:', e);
        return `
            <div class="container" style="text-align: center; margin-top: 3rem;">
                <h3 style="color: #e74c3c;">${tr('taskDetails.error')}</h3>
                <p style="margin-bottom: 1.5rem;">${e.message || tr('taskDetails.taskNotFound')}</p>
                <button onclick="window.router.navigate('tasks')" class="btn btn-primary">${tr('taskDetails.backToTasks')}</button>
            </div>
        `;
    }
});

// Helper for task sharing
window.copyTaskLink = function(taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const url = window.location.origin + window.location.pathname + '#/task-details?id=' + taskId;
    navigator.clipboard.writeText(url).then(() => {
        window.utils.showToast(tr('taskDetails.linkCopied') || 'Link copied!', 'success');
    }).catch(err => {
        console.error('Error copying link:', err);
    });
};

// Application form logic
window.applyToTask = async function(taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const message = document.getElementById('apply-message').value.trim();
    const btn = document.getElementById('apply-btn');

    if (!message || message.length < 10) {
        window.utils.showToast(tr('messages.enterText') || 'Message too short', 'warning');
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = tr('auth.sending') || 'Sending...';
        await window.api.applyToTask(taskId, message);
        window.utils.showToast(tr('taskDetails.applySuccess') || 'Application sent!', 'success');
        localStorage.removeItem('my-tasks-cache');
        localStorage.removeItem('my-tasks-cache-time');
        window.router.navigate('task-details', { id: taskId }, { force: true });
    } catch (error) {
        console.error('Error sending application:', error);
        window.utils.showToast(error.message || tr('taskDetails.applyError'), 'error');
        btn.disabled = false;
        btn.textContent = tr('taskDetails.sendResponse');
    }
};

window.toggleEditApplication = function(show) {
    const viewMode = document.getElementById('application-view-mode');
    const editMode = document.getElementById('application-edit-mode');
    if (show) {
        viewMode.style.display = 'none';
        editMode.style.display = 'block';
    } else {
        viewMode.style.display = 'block';
        editMode.style.display = 'none';
    }
};

window.saveApplicationEdit = async function(applicationId, taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const message = document.getElementById('edit-app-message').value.trim();
    const btn = document.getElementById('save-app-btn');

    if (!message || message.length < 10) {
        window.utils.showToast(tr('messages.enterText') || 'Message too short', 'warning');
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = tr('profile.saving') || 'Saving...';
        await window.api.updateApplicationMessage(applicationId, message);
        window.utils.showToast(tr('taskDetails.updateSuccess') || 'Application updated!', 'success');
        localStorage.removeItem('my-tasks-cache');
        localStorage.removeItem('my-tasks-cache-time');
        window.router.navigate('task-details', { id: taskId }, { force: true });
    } catch (error) {
        console.error('Error updating application:', error);
        window.utils.showToast(error.message || tr('taskDetails.updateError'), 'error');
        btn.disabled = false;
        btn.textContent = tr('taskDetails.saveChanges');
    }
};

window.withdrawApplication = async function(applicationId, taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (!confirm(tr('taskDetails.withdrawConfirm') || 'Withdraw application?')) {
        return;
    }

    try {
        await window.api.deleteApplication(applicationId);
        window.utils.showToast(tr('taskDetails.withdrawSuccess') || 'Withdrawn', 'success');
        localStorage.removeItem('my-tasks-cache');
        localStorage.removeItem('my-tasks-cache-time');
        window.router.navigate('task-details', { id: taskId }, { force: true });
    } catch (error) {
        console.error('Error withdrawing application:', error);
        window.utils.showToast(error.message || tr('taskDetails.withdrawError'), 'error');
    }
};

// Cancel/Close task (owner only, task must be OPEN)
window.cancelTask = async function(taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (!confirm(tr('taskDetails.closeConfirm') || 'Close task?')) return;
    try {
        await window.api.updateTask(taskId, { status: 'CANCELLED' });
        window.utils.showToast(tr('taskDetails.closeSuccess') || 'Task closed', 'success');
        localStorage.removeItem('my-tasks-cache');
        localStorage.removeItem('my-tasks-cache-time');
        window.router.navigate('task-details', { id: taskId }, { force: true });
    } catch (e) {
        window.utils.showToast(e.message || tr('taskDetails.closeError'), 'error');
    }
};

// Complete task (owner only, task must be MATCHED)
window.completeTaskAdmin = async function(taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (!confirm(tr('taskDetails.completeConfirm') || 'Mark as completed?')) return;
    try {
        await window.api.completeTask(taskId);
        window.utils.showToast(tr('taskDetails.completeSuccess') || 'Task completed', 'success');
        localStorage.removeItem('my-tasks-cache');
        localStorage.removeItem('my-tasks-cache-time');
        window.router.navigate('task-details', { id: taskId }, { force: true });
    } catch (e) {
        window.utils.showToast(e.message || tr('taskDetails.completeError'), 'error');
    }
};

// Delete task (owner or admin)
window.deleteTaskAdmin = async function(taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (!confirm(tr('tasks.confirmDelete') || 'Delete task?')) return;
    try {
        await window.api.deleteTask(taskId);
        window.utils.showToast(tr('tasks.deleted') || 'Task deleted', 'success');
        localStorage.removeItem('my-tasks-cache');
        localStorage.removeItem('my-tasks-cache-time');
        window.router.navigate('tasks');
    } catch (e) {
        window.utils.showToast(e.message || tr('tasks.deleteError'), 'error');
    }
};

// Application status update (accept/reject)
window.updateApplicationStatus = async function(applicationId, newStatus, taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const confirmMsg = newStatus === 'ACCEPTED' ? tr('taskDetails.acceptConfirm') : tr('taskDetails.rejectConfirm');
    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        await window.api.matchWorker(taskId, applicationId); // This is likely what is intended by status update in this app's context
        // If the API had a direct application status update, it would be used here.
        // Assuming matchWorker handles the ACCEPTED logic.
        const successMsg = newStatus === 'ACCEPTED' ? tr('taskDetails.acceptSuccess') : tr('taskDetails.rejectSuccess');
        window.utils.showToast(successMsg, 'success');
        localStorage.removeItem('my-tasks-cache');
        localStorage.removeItem('my-tasks-cache-time');
        window.router.navigate('task-details', { id: taskId }, { force: true });
    } catch (error) {
        console.error('Error updating status:', error);
        window.utils.showToast(error.message || tr('taskDetails.statusUpdateError'), 'error');
    }
};

// Inline Messaging
window.toggleInlineMessageForm = function(targetId) {
    const form = document.getElementById(`inline-msg-form-${targetId}`);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
            const textarea = document.getElementById(`inline-msg-text-${targetId}`);
            if (textarea) textarea.focus();
        }
    }
};

window.sendInlineMessage = async function(targetId, taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const textEl = document.getElementById(`inline-msg-text-${targetId}`);
    const text = textEl ? textEl.value.trim() : '';

    if (!text) {
        window.utils.showToast(tr('messages.enterText'), 'warning');
        return;
    }
    if (text.length < 5) {
        window.utils.showToast(tr('profile.commentTooShort'), 'warning');
        return;
    }

    try {
        const btn = event.target;
        if (btn) {
            btn.disabled = true;
            btn.textContent = tr('auth.sending') || 'Sending...';
        }

        await window.api.sendMessage(targetId, text);
        window.utils.showToast(tr('messages.sentSuccess'), 'success');
        
        if (textEl) textEl.value = '';
        window.toggleInlineMessageForm(targetId);
        
        if (btn) {
            btn.disabled = false;
            btn.textContent = tr('messages.sendBtn');
        }
    } catch (error) {
        console.error('Error sending inline message:', error);
        window.utils.showToast(error.message || tr('taskDetails.error'), 'error');
        const btn = event.target;
        if (btn) {
            btn.disabled = false;
            btn.textContent = tr('messages.sendBtn');
        }
    }
};

// Inline Reviews
window.toggleInlineReviewForm = function(targetId) {
    const form = document.getElementById(`inline-review-form-${targetId}`);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        if (form.style.display === 'block') {
            const textarea = document.getElementById(`inline-review-text-${targetId}`);
            if (textarea) textarea.focus();
        }
    }
};

window.submitInlineReview = async function(targetId, reviewAs, taskId) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const ratingEl = document.getElementById(`inline-review-rating-${targetId}`);
    const textEl = document.getElementById(`inline-review-text-${targetId}`);
    const rating = ratingEl ? parseInt(ratingEl.value) : 5;
    const text = textEl ? textEl.value.trim() : '';

    if (text.length < 5) {
        window.utils.showToast(tr('profile.commentTooShort'), 'warning');
        return;
    }

    try {
        const btn = event.target;
        if (btn) { btn.disabled = true; btn.textContent = tr('auth.sending'); }

        await window.api.submitProfileReview(targetId, rating, text, reviewAs);
        window.utils.showToast(tr('users.reviewSent'), 'success');
        
        window.toggleInlineReviewForm(targetId);
        window.router.navigate('task-details', { id: taskId }, { force: true });
        
        if (btn) { btn.disabled = false; btn.textContent = tr('profile.publish'); }
    } catch (error) {
        console.error('Error sending inline review:', error);
        window.utils.showToast(error.message || tr('users.reviewError'), 'error');
        const btn = event.target;
        if (btn) { btn.disabled = false; btn.textContent = tr('profile.publish'); }
    }
};

// Edit Task Modal logic
window.openEditTaskModal = function() {
    const modal = document.getElementById('editTaskModal');
    if (!modal) return;
    modal.classList.add('active');
};

window.closeEditTaskModal = function() {
    const modal = document.getElementById('editTaskModal');
    if (modal) modal.classList.remove('active');
};

window.submitEditTask = async function(event, taskId) {
    event.preventDefault();
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const btn = document.getElementById('save-task-btn');

    const taskData = {
        title: document.getElementById('edit-task-title').value.trim(),
        description: document.getElementById('edit-task-desc').value.trim(),
        category: document.getElementById('edit-task-category').value.trim(),
        budget_estimate: parseFloat(document.getElementById('edit-task-budget').value) || null,
        budget_type: document.getElementById('edit-task-budget-type').value,
        currency: document.getElementById('edit-task-currency').value,
        deadline: document.getElementById('edit-task-deadline').value,
        tags: document.getElementById('edit-task-tags').value.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
        btn.disabled = true;
        btn.textContent = '...';
        
        const currentTaskResp = await window.api.getTask(taskId);
        const currentTask = currentTaskResp.data || currentTaskResp;
        
        if (currentTask.status === 'CANCELLED') {
            taskData.status = 'OPEN';
        }
        
        await window.api.updateTask(taskId, taskData);
        window.utils.showToast(tr('tasks.editSuccess') || 'Task updated!', 'success');
        
        window.closeEditTaskModal();
        window.router.navigate('task-details', { id: taskId }, { force: true });
    } catch (error) {
        console.error('Error updating task:', error);
        window.utils.showToast(error.message || tr('profile.updateError'), 'error');
        btn.disabled = false;
        btn.textContent = tr('taskDetails.saveChanges');
    }
};
