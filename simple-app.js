// Simple Interview Tracker Application - No React, No External Dependencies
document.addEventListener('DOMContentLoaded', function() {
    // Global state
    const state = {
        currentFilter: 'all',
        editingId: null,
        timelineCount: 0
    };

    // DOM Elements
    const elements = {
        addInterviewBtn: document.getElementById('addInterviewBtn'),
        addDeliveryBtn: document.getElementById('addDeliveryBtn'),
        quickAddDeliveryBtn: document.getElementById('quickAddDeliveryBtn'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        closeDeliveryModalBtn: document.getElementById('closeDeliveryModalBtn'),
        interviewModal: document.getElementById('interviewModal'),
        deliveryModal: document.getElementById('deliveryModal'),
        interviewForm: document.getElementById('interviewForm'),
        deliveryForm: document.getElementById('deliveryForm'),
        interviewList: document.getElementById('interviewList'),
        filterTabs: document.querySelectorAll('.filter-tab, .filter-subtab'),
        addTimelineBtn: document.getElementById('addTimelineBtn'),
        timelineContainer: document.getElementById('timelineContainer'),
        timelineTemplate: document.getElementById('timelineTemplate'),
        exportBtn: document.getElementById('exportBtn')
    };

    // Initialize the database
    const db = window.interviewDB;

    // Initialize the application
    async function init() {
        try {
            await db.init();
            console.log('Database initialized successfully');
            loadInterviews();
            
            // Add event listener for export button
            if (elements.exportBtn) {
                elements.exportBtn.addEventListener('click', exportInterviews);
            } else {
                console.warn('Export button not found');
            }
        } catch (error) {
            console.error('Failed to initialize database:', error);
            showError('数据库初始化失败，请检查浏览器控制台。');
        }
    }

    // Load and display interviews
    async function loadInterviews() {
        try {
            const interviews = await db.getAllInterviews();
            renderInterviews(interviews);
        } catch (error) {
            console.error('Error loading interviews:', error);
            showError('加载面试记录失败');
        }
    }

    // Export all interviews to CSV file
    async function exportInterviews() {
        try {
            const interviews = await db.getAllInterviews();
            if (interviews.length === 0) {
                showError('没有可导出的面试记录');
                return;
            }

            // Sort interviews by company and position to group them together
            const sortedInterviews = interviews.sort((a, b) => {
                if (a.company !== b.company) {
                    return a.company.localeCompare(b.company);
                }
                if (a.position !== b.position) {
                    return a.position.localeCompare(b.position);
                }
                // Within same company and position, sort by date
                return new Date(a.date) - new Date(b.date);
            });

            // Define CSV headers (Chinese)
            const headers = [
                '公司',
                '职位',
                '日期',
                '时间',
                '时长(分钟)',
                '面试官',
                '第几面',
                '是否通过',
                '阶段',
                '状态',
                '面试记录',
                '面试复盘',
                '时间线'
            ];

            // Convert interviews to CSV rows, adding empty rows between groups
            const rows = [];
            let lastCompany = '';
            let lastPosition = '';
            
            sortedInterviews.forEach((interview, index) => {
                // Add empty row when company or position changes (except first row)
                if (index > 0 && (interview.company !== lastCompany || interview.position !== lastPosition)) {
                    rows.push(''); // Empty row as separator
                }
                
                const timelineStr = interview.timeline && interview.timeline.length > 0 
                    ? interview.timeline.map(item => `${item.time}: ${item.content}`).join('; ')
                    : '';

                rows.push([
                    `"${(interview.company || '').replace(/"/g, '""')}"`,
                    `"${(interview.position || '').replace(/"/g, '""')}"`,
                    `"${interview.date || ''}"`,
                    `"${interview.time || ''}"`,
                    `"${interview.duration || ''}"`,
                    `"${(interview.interviewer || '').replace(/"/g, '""')}"`,
                    `"${(interview.round || '').replace(/"/g, '""')}"`,
                    `"${(interview.passed || '').replace(/"/g, '""')}"`,
                    `"${interview.phase || ''}"`,
                    `"${interview.status || ''}"`,
                    `"${(interview.notes || '').replace(/"/g, '""')}"`,
                    `"${(interview.reflection || '').replace(/"/g, '""')}"`,
                    `"${timelineStr.replace(/"/g, '""')}"`
                ].join(','));

                lastCompany = interview.company;
                lastPosition = interview.position;
            });

            // Combine headers and rows
            const csvContent = [headers.join(','), ...rows].join('\n');

            // Create download link
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `面试记录_${new Date().toISOString().slice(0,10)}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showError('导出成功！文件已下载。');
        } catch (error) {
            console.error('Error exporting interviews:', error);
            showError('导出失败：' + error.message);
        }
    }

    // Render interviews to the DOM
    function renderInterviews(interviews) {
        // Render dashboard with all interviews
        renderDashboard(interviews);
        
        const statusMap = {
            'upcoming': '即将进行',
            'completed': '已完成',
            'cancelled': '已取消'
        };
        
        const filteredInterviews = filterInterviews(interviews, state.currentFilter);
        
        if (filteredInterviews.length === 0) {
            elements.interviewList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <div class="empty-message">暂无面试记录</div>
                    <p>${state.currentFilter === 'all' ? '点击"添加面试记录"创建第一个面试记录' : '没有匹配当前筛选条件的面试记录'}</p>
                </div>
            `;
            return;
        }

        // Group interviews by company and position
        const groups = {};
        filteredInterviews.forEach(interview => {
            const key = `${interview.company}|${interview.position}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(interview);
        });

        // Helper to get round order for sorting
        function getRoundOrder(round) {
            const orderMap = {
                '一面': 1,
                '二面': 2,
                '三面': 3,
                '四面及以上': 4
            };
            return orderMap[round] || 99;
        }

        // Generate HTML for each group
        let html = '';
        Object.keys(groups).sort().forEach(key => {
            const groupInterviews = groups[key];
            const [company, position] = key.split('|');
            
            // Sort interviews within group by round order, then by date
            groupInterviews.sort((a, b) => {
                const roundOrderA = getRoundOrder(a.round);
                const roundOrderB = getRoundOrder(b.round);
                if (roundOrderA !== roundOrderB) {
                    return roundOrderA - roundOrderB;
                }
                // If same round, sort by date ascending
                return new Date(a.date) - new Date(b.date);
            });

            // Group header
            html += `
                <div class="position-group">
                    <div class="group-header">
                        <h2 class="group-company">${escapeHtml(company)}</h2>
                        <h3 class="group-position">${escapeHtml(position)}</h3>
                        <span class="group-count">${groupInterviews.length} 次面试</span>
                    </div>
                    <div class="group-interviews">
            `;

            // Interview cards within group
            groupInterviews.forEach(interview => {
                html += `
                    <div class="interview-card" data-id="${interview.id}">
                        <div class="card-header">
                            <div>
                                <h3 class="company-name">${escapeHtml(interview.company)}</h3>
                                <p class="position">${escapeHtml(interview.position)}</p>
                            </div>
                            <span class="status-badge status-${interview.status}">${statusMap[interview.status] || interview.status}</span>
                        </div>
                        
                        <div class="card-details">
                            <div class="detail-row">
                                <span class="detail-label">第几面:</span>
                                <span class="detail-value">${escapeHtml(interview.round)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">日期:</span>
                                <span class="detail-value">${formatDate(interview.date)}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">时间:</span>
                                <span class="detail-value">${interview.time}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">时长:</span>
                                <span class="detail-value">${interview.duration} 分钟</span>
                            </div>
                            ${interview.interviewer ? `
                            <div class="detail-row">
                                <span class="detail-label">面试官:</span>
                                <span class="detail-value">${escapeHtml(interview.interviewer)}</span>
                            </div>` : ''}
                            ${interview.passed ? `
                            <div class="detail-row">
                                <span class="detail-label">是否通过:</span>
                                <span class="detail-value">${escapeHtml(interview.passed)}</span>
                            </div>` : ''}
                        </div>
                        
                        ${interview.notes ? `
                        <div class="card-details">
                            <div class="detail-row">
                                <span class="detail-label">面试记录:</span>
                                <span class="detail-value">${truncateText(escapeHtml(interview.notes), 100)}</span>
                            </div>
                        </div>` : ''}
                        
                        <div class="card-actions">
                            <button class="btn" onclick="editInterview('${interview.id}')">编辑</button>
                            <button class="btn btn-secondary" onclick="viewInterview('${interview.id}')">详情</button>
                            <button class="btn btn-danger" onclick="deleteInterview('${interview.id}')">删除</button>
                        </div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        elements.interviewList.innerHTML = html;
    }

    // Filter interviews based on current filter
    function filterInterviews(interviews, filter) {
        if (filter === 'all') return interviews;
        
        // Handle composite filters for interview phase sub-status
        if (filter.startsWith('面试中-')) {
            const status = filter.split('-')[1]; // upcoming, completed, cancelled, failed
            // For failed status, records should be in "已结束" phase
            if (status === 'failed') {
                return interviews.filter(interview => 
                    interview.phase === '已结束' && interview.status === status
                );
            }
            return interviews.filter(interview => 
                interview.phase === '面试中' && interview.status === status
            );
        }
        
        return interviews.filter(interview => interview.phase === filter);
    }

    // Render dashboard with statistics
    function renderDashboard(interviews) {
        if (interviews.length === 0) {
            document.getElementById('phaseStats').innerHTML = '<div class="loading">暂无数据</div>';
            document.getElementById('positionStats').innerHTML = '<div class="loading">暂无数据</div>';
            return;
        }
        
        // Phase statistics
        const phases = ['已投递', '笔试中', '面试中', '已offer', '已结束'];
        const phaseColors = {
            '已投递': '#2196f3',
            '笔试中': '#ff9800',
            '面试中': '#9c27b0',
            '已offer': '#4caf50',
            '已结束': '#f44336'
        };
        
        // Status mapping for interview phase subcategories
        const statusMap = {
            'upcoming': '即将面试',
            'completed': '已完成',
            'cancelled': '已取消',
            'failed': '未通过'
        };
        const statusColors = {
            'upcoming': '#ff9800',
            'completed': '#4caf50',
            'cancelled': '#f44336',
            'failed': '#9c27b0'
        };
        
        const phaseCounts = {};
        phases.forEach(phase => phaseCounts[phase] = 0);
        
        // Count interviews in "面试中" phase by status
        const interviewPhaseStatusCounts = {
            'upcoming': 0,
            'completed': 0,
            'cancelled': 0,
            'failed': 0
        };
        let interviewPhaseTotal = 0;
        
        interviews.forEach(interview => {
            const phase = interview.phase || '已投递';
            if (phaseCounts.hasOwnProperty(phase)) {
                phaseCounts[phase]++;
            } else {
                phaseCounts[phase] = 1;
            }
            
            // Count sub-status for "面试中" phase (including failed status which may be in "已结束" phase)
            const status = interview.status || 'upcoming';
            if (status === 'upcoming' || status === 'completed' || status === 'cancelled' || status === 'failed') {
                if (phase === '面试中' || (status === 'failed' && phase === '已结束')) {
                    interviewPhaseTotal++;
                    if (interviewPhaseStatusCounts.hasOwnProperty(status)) {
                        interviewPhaseStatusCounts[status]++;
                    } else {
                        interviewPhaseStatusCounts[status] = 1;
                    }
                }
            }
        });
        
        const total = interviews.length;
        let phaseHtml = '';
        
        phases.forEach(phase => {
            const count = phaseCounts[phase];
            const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
            const color = phaseColors[phase];
            
            phaseHtml += `
                <div class="phase-item">
                    <span class="phase-label">${phase}</span>
                    <div class="phase-bar-container">
                        <div class="phase-bar" style="width: ${percentage}%; background-color: ${color};"></div>
                    </div>
                    <span class="phase-percentage">${percentage}% (${count})</span>
                </div>
            `;
            
            // Add sub‑items for "面试中" phase
            if (phase === '面试中' && interviewPhaseTotal > 0) {
                Object.keys(interviewPhaseStatusCounts).forEach(statusKey => {
                    const subCount = interviewPhaseStatusCounts[statusKey];
                    if (subCount === 0) return;
                    const subPercentage = Math.round((subCount / interviewPhaseTotal) * 100);
                    const subColor = statusColors[statusKey];
                    const subLabel = statusMap[statusKey];
                    phaseHtml += `
                        <div class="phase-item" style="margin-left: 20px; border-left: 2px solid ${subColor}; padding-left: 8px;">
                            <span class="phase-label" style="font-size: 0.85em;">${subLabel}</span>
                            <div class="phase-bar-container">
                                <div class="phase-bar" style="width: ${subPercentage}%; background-color: ${subColor};"></div>
                            </div>
                            <span class="phase-percentage" style="font-size: 0.85em;">${subPercentage}% (${subCount})</span>
                        </div>
                    `;
                });
            }
        });
        
        document.getElementById('phaseStats').innerHTML = phaseHtml;
        
        // Position distribution
        const positionCounts = {};
        interviews.forEach(interview => {
            const position = interview.position || '未知岗位';
            positionCounts[position] = (positionCounts[position] || 0) + 1;
        });
        
        // Sort positions by count descending
        const sortedPositions = Object.keys(positionCounts).sort((a, b) => positionCounts[b] - positionCounts[a]);
        
        let positionHtml = '';
        sortedPositions.forEach(position => {
            const count = positionCounts[position];
            positionHtml += `
                <div class="position-item">
                    <span class="position-name">${escapeHtml(position)}</span>
                    <span class="position-count">${count}</span>
                </div>
            `;
        });
        
        document.getElementById('positionStats').innerHTML = positionHtml;
    }

    // Open modal for adding new interview
    function openAddModal() {
        state.editingId = null;
        elements.interviewForm.reset();
        elements.timelineContainer.innerHTML = '';
        state.timelineCount = 0;
        document.querySelector('.modal-title').textContent = '添加面试记录';
        elements.interviewModal.style.display = 'flex';
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        
        // Set default time to current hour
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        document.getElementById('time').value = `${hours}:${minutes}`;
    }

    // Open modal for adding new delivery record
    function openDeliveryModal() {
        elements.deliveryForm.reset();
        elements.deliveryModal.style.display = 'flex';
        
        // Set default date-time to now
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        document.getElementById('deliveryDate').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        // Set default phase to "已投递"
        document.getElementById('deliveryPhase').value = '已投递';
    }

    // Open modal for editing existing interview
    async function editInterview(id) {
        try {
            const interview = await db.getInterview(id);
            if (!interview) {
                alert('Interview not found');
                return;
            }
            
            state.editingId = id;
            document.querySelector('.modal-title').textContent = '编辑面试记录';
            
            // Populate form fields
            document.getElementById('interviewId').value = interview.id;
            document.getElementById('company').value = interview.company;
            document.getElementById('position').value = interview.position;
            document.getElementById('date').value = interview.date;
            document.getElementById('time').value = interview.time;
            document.getElementById('duration').value = interview.duration;
            document.getElementById('interviewer').value = interview.interviewer || '';
            document.getElementById('round').value = interview.round || '一面';
            document.getElementById('passed').value = interview.passed || '待定';
            document.getElementById('status').value = interview.status;
            document.getElementById('phase').value = interview.phase || '面试中';
            document.getElementById('notes').value = interview.notes || '';
            document.getElementById('reflection').value = interview.reflection || '';
            
            // Populate timeline
            elements.timelineContainer.innerHTML = '';
            state.timelineCount = 0;
            if (interview.timeline && interview.timeline.length > 0) {
                interview.timeline.forEach(item => {
                    addTimelineItem(item.time, item.content);
                });
            }
            
            elements.interviewModal.style.display = 'flex';
        } catch (error) {
            console.error('Error loading interview for edit:', error);
            alert('Failed to load interview for editing');
        }
    }

    // View interview details (simplified - just opens edit modal for now)
    async function viewInterview(id) {
        try {
            const interview = await db.getInterview(id);
            if (!interview) {
                alert('未找到面试记录');
                return;
            }

            // Status mapping
            const statusMap = {
                'upcoming': '即将进行',
                'completed': '已完成',
                'cancelled': '已取消'
            };
            
            let details = `
                <h3>面试详情</h3>
                <div class="card-details">
                    <div class="detail-row">
                        <span class="detail-label">公司:</span>
                        <span class="detail-value">${escapeHtml(interview.company)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">职位:</span>
                        <span class="detail-value">${escapeHtml(interview.position)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">日期:</span>
                        <span class="detail-value">${formatDate(interview.date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">时间:</span>
                        <span class="detail-value">${interview.time}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">时长:</span>
                        <span class="detail-value">${interview.duration} 分钟</span>
                    </div>
                    ${interview.interviewer ? `
                    <div class="detail-row">
                        <span class="detail-label">面试官:</span>
                        <span class="detail-value">${escapeHtml(interview.interviewer)}</span>
                    </div>` : ''}
                    <div class="detail-row">
                        <span class="detail-label">第几面:</span>
                        <span class="detail-value">${escapeHtml(interview.round || '一面')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">是否通过:</span>
                        <span class="detail-value">${escapeHtml(interview.passed || '待定')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">状态:</span>
                        <span class="detail-value">${statusMap[interview.status] || interview.status}</span>
                    </div>
                </div>
            `;
            
            if (interview.notes) {
                details += `
                    <div class="card-details">
                        <h4>面试记录</h4>
                        <p>${escapeHtml(interview.notes).replace(/\n/g, '<br>')}</p>
                    </div>
                `;
            }
            
            if (interview.reflection) {
                details += `
                    <div class="card-details">
                        <h4>面试复盘</h4>
                        <p>${escapeHtml(interview.reflection).replace(/\n/g, '<br>')}</p>
                    </div>
                `;
            }
            
            if (interview.timeline && interview.timeline.length > 0) {
                details += `
                    <div class="card-details">
                        <h4>时间线</h4>
                        ${interview.timeline.map(item => `
                            <div class="timeline-item">
                                <div class="timeline-time">${escapeHtml(item.time)}</div>
                                <div class="timeline-content">${escapeHtml(item.content).replace(/\n/g, '<br>')}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            // Show details in a modal
            showModal('面试详情', details);
        } catch (error) {
            console.error('Error viewing interview:', error);
            alert('加载面试详情失败');
        }
    }

    // Delete interview with confirmation
    async function deleteInterview(id) {
        if (!confirm('确定要删除这个面试记录吗？此操作无法撤销。')) {
            return;
        }
        
        try {
            await db.deleteInterview(id);
            loadInterviews();
            showToast('面试记录删除成功');
        } catch (error) {
            console.error('Error deleting interview:', error);
            alert('Failed to delete interview');
        }
    }

    // Add a new timeline item
    function addTimelineItem(time = '', content = '') {
        const template = elements.timelineTemplate.content.cloneNode(true);
        const timelineItem = template.querySelector('.timeline-item');
        
        if (time) {
            timelineItem.querySelector('.timeline-time-input').value = time;
        }
        
        if (content) {
            timelineItem.querySelector('.timeline-content-input').value = content;
        }
        
        timelineItem.querySelector('.remove-timeline-btn').addEventListener('click', function() {
            timelineItem.remove();
        });
        
        elements.timelineContainer.appendChild(timelineItem);
        state.timelineCount++;
    }

    // Handle delivery form submission
    async function handleDeliverySubmit(event) {
        event.preventDefault();
        
        // Parse datetime-local value
        const datetimeValue = document.getElementById('deliveryDate').value;
        const [date, time] = datetimeValue.split('T');
        
        // Prepare interview object (as a delivery record)
        const interview = {
            id: Date.now().toString(),
            company: document.getElementById('deliveryCompany').value.trim(),
            position: document.getElementById('deliveryPosition').value.trim() || '待定',
            date: date,
            time: time || '00:00',
            duration: 0,
            interviewer: '',
            round: '一面',
            passed: '待定',
            status: 'upcoming',
            phase: document.getElementById('deliveryPhase').value,
            notes: '投递记录',
            reflection: '',
            timeline: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Validation
        if (!interview.company || !interview.position || !datetimeValue) {
            alert('请填写公司、岗位和投递时间');
            return;
        }
        
        try {
            await db.saveInterview(interview);
            closeDeliveryModal();
            loadInterviews();
            showToast('投递记录添加成功');
        } catch (error) {
            console.error('Error saving delivery record:', error);
            alert('保存投递记录失败');
        }
    }

    // Close delivery modal
    function closeDeliveryModal() {
        elements.deliveryModal.style.display = 'none';
        elements.deliveryForm.reset();
    }

    // Handle form submission
    async function handleFormSubmit(event) {
        event.preventDefault();
        
        // Collect timeline data
        const timelineItems = [];
        elements.timelineContainer.querySelectorAll('.timeline-item').forEach(item => {
            const time = item.querySelector('.timeline-time-input').value.trim();
            const content = item.querySelector('.timeline-content-input').value.trim();
            if (time || content) {
                timelineItems.push({ time, content });
            }
        });
        
        // Prepare interview object
        let phase = document.getElementById('phase').value;
        const status = document.getElementById('status').value;
        // If status is "failed", set phase to "已结束"
        if (status === 'failed') {
            phase = '已结束';
        }
        const interview = {
            id: state.editingId || Date.now().toString(),
            company: document.getElementById('company').value.trim(),
            position: document.getElementById('position').value.trim(),
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            duration: parseInt(document.getElementById('duration').value),
            interviewer: document.getElementById('interviewer').value.trim(),
            round: document.getElementById('round').value.trim(),
            passed: document.getElementById('passed').value.trim(),
            status: status,
            phase: phase,
            notes: document.getElementById('notes').value.trim(),
            reflection: document.getElementById('reflection').value.trim(),
            timeline: timelineItems,
            createdAt: state.editingId ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Validation
        if (!interview.company || !interview.position || !interview.date || !interview.time || !interview.duration) {
            alert('请填写所有必填字段（标有 * 的）');
            return;
        }
        
        if (interview.duration < 5 || interview.duration > 480) {
            alert('时长必须在5到480分钟之间');
            return;
        }
        
        try {
            await db.saveInterview(interview);
            closeModal();
            loadInterviews();
            showToast(state.editingId ? '面试记录更新成功' : '面试记录添加成功');
        } catch (error) {
            console.error('Error saving interview:', error);
            alert('Failed to save interview');
        }
    }

    // Close modal
    function closeModal() {
        elements.interviewModal.style.display = 'none';
        elements.interviewForm.reset();
    }

    // Show toast notification
    function showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Show custom modal
    function showModal(title, content) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2 class="modal-title">${escapeHtml(title)}</h2>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 25px;">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }

    // Utility functions
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            weekday: 'short'
        });
    }

    // Event listeners
    elements.addInterviewBtn.addEventListener('click', openAddModal);
    elements.addDeliveryBtn.addEventListener('click', openDeliveryModal);
    elements.quickAddDeliveryBtn.addEventListener('click', openDeliveryModal);
    elements.closeModalBtn.addEventListener('click', closeModal);
    elements.closeDeliveryModalBtn.addEventListener('click', closeDeliveryModal);
    elements.addTimelineBtn.addEventListener('click', () => addTimelineItem());
    elements.interviewForm.addEventListener('submit', handleFormSubmit);
    elements.deliveryForm.addEventListener('submit', handleDeliverySubmit);
    
    // Close modal on background click
    elements.interviewModal.addEventListener('click', function(event) {
        if (event.target === elements.interviewModal) {
            closeModal();
        }
    });
    
    elements.deliveryModal.addEventListener('click', function(event) {
        if (event.target === elements.deliveryModal) {
            closeDeliveryModal();
        }
    });
    
    // Filter tabs
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Remove active class from all filter tabs and subtabs
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // If a subtab is clicked, also activate the parent "面试中" tab
            if (filter.startsWith('面试中-')) {
                // Find the parent "面试中" tab in the same filter-group
                const parentGroup = this.closest('.filter-group');
                if (parentGroup) {
                    const parentTab = parentGroup.querySelector('.filter-tab[data-filter="面试中"]');
                    if (parentTab) {
                        parentTab.classList.add('active');
                    }
                }
            }
            
            state.currentFilter = filter;
            loadInterviews();
        });
    });
    
    // Make functions available globally for onclick handlers
    window.editInterview = editInterview;
    window.viewInterview = viewInterview;
    window.deleteInterview = deleteInterview;
    
    // Initialize the app
    init();
    
    // Add some sample data if empty
    setTimeout(async () => {
        try {
            const interviews = await db.getAllInterviews();
            if (interviews.length === 0) {
                console.log('No interviews found, adding sample data...');
                // Don't add sample automatically - let user add their own
            }
        } catch (error) {
            console.error('Error checking for sample data:', error);
        }
    }, 1000);
    
    console.log('Simple Interview Tracker initialized');
});