// API Configuration
const API_URL = 'http://localhost:3000/api';
let socket;
let currentUser = null;
let authToken = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showDashboard();
        initializeSocket();
        loadDashboardData();
    }
    
    // Setup event listeners
    setupEventListeners();
});

// Socket.IO Setup
function initializeSocket() {
    socket = io('http://localhost:3000');
    
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('join_room', currentUser.id);
    });
    
    socket.on('event_created', () => {
        refreshData();
        showToast('New event created!', 'success');
    });
    
    socket.on('event_approved', () => {
        refreshData();
        showToast('Event approved!', 'success');
    });
    
    socket.on('event_rejected', () => {
        refreshData();
        showToast('Event rejected', 'warning');
    });
    
    socket.on('resources_allocated', () => {
        refreshData();
        showToast('Resources allocated successfully', 'success');
    });
    
    socket.on('event_completed', () => {
        refreshData();
        showToast('Event completed and resources released', 'success');
    });
    
    socket.on('allocation_conflict', (data) => {
        showToast('Allocation conflict detected', 'warning');
        refreshData();
    });
}

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Create event form
    document.getElementById('createEventForm').addEventListener('submit', handleCreateEvent);
    
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });
}

// Authentication
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        showDashboard();
        initializeSocket();
        loadDashboardData();
        showToast('Login successful!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        role: document.getElementById('registerRole').value,
        department_id: document.getElementById('registerDepartment').value || null,
        school_id: document.getElementById('registerSchool').value || null
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        showToast('Registration successful! Please login.', 'success');
        showLogin();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authToken = null;
    currentUser = null;
    
    if (socket) {
        socket.disconnect();
    }
    
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    showToast('Logged out successfully', 'success');
}

// UI Navigation
function showLogin() {
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}

function showRegister() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'flex';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('registerScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    
    // Show/hide elements based on role
    updateUIForRole();
}

function updateUIForRole() {
    const role = currentUser.role;
    
    // Show approvals nav for HOD, Dean, Head
    if (['HOD', 'Dean', 'Head'].includes(role)) {
        document.getElementById('approvalsNav').style.display = 'flex';
    }
    
    // Show create event button only for Coordinators
    if (role !== 'Coordinator') {
        const createBtn = document.getElementById('createEventBtn');
        if (createBtn) createBtn.style.display = 'none';
    }
    
    // Show add venue/resource buttons only for Admin
    if (role !== 'Admin') {
        const addVenueBtn = document.getElementById('addVenueBtn');
        const addResourceBtn = document.getElementById('addResourceBtn');
        if (addVenueBtn) addVenueBtn.style.display = 'none';
        if (addResourceBtn) addResourceBtn.style.display = 'none';
    }
}

function switchView(view) {
    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Hide all views
    document.querySelectorAll('.view-content').forEach(v => {
        v.style.display = 'none';
    });
    
    // Show selected view
    const viewElement = document.getElementById(`${view}View`);
    if (viewElement) {
        viewElement.style.display = 'block';
    }
    
    // Update page title
    const titles = {
        overview: 'Dashboard Overview',
        events: 'Event Management',
        venues: 'Venue Management',
        resources: 'Resource Inventory',
        approvals: 'Pending Approvals'
    };
    
    const subtitles = {
        overview: "Welcome back! Here's what's happening today.",
        events: 'Manage and track all institutional events',
        venues: 'View and manage available venues',
        resources: 'Track resource inventory and availability',
        approvals: 'Review and approve pending event requests'
    };
    
    document.getElementById('pageTitle').textContent = titles[view] || 'Dashboard';
    document.getElementById('pageSubtitle').textContent = subtitles[view] || '';
    
    // Load view data
    loadViewData(view);
}

// Data Loading
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadRecentEvents(),
        loadVenues(),
        loadResources()
    ]);
    
    if (['HOD', 'Dean', 'Head'].includes(currentUser.role)) {
        await loadPendingApprovals();
    }
}

async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/dashboard/stats`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const stats = await response.json();
        
        document.getElementById('statTotalEvents').textContent = stats.events.total;
        document.getElementById('statPending').textContent = stats.events.pending;
        document.getElementById('statApproved').textContent = stats.events.approved;
        document.getElementById('statVenues').textContent = stats.venues.available;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadRecentEvents() {
    try {
        const response = await fetch(`${API_URL}/events`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const events = await response.json();
        const recentEvents = events.slice(0, 5);
        
        const container = document.getElementById('recentEventsList');
        container.innerHTML = recentEvents.length ? 
            recentEvents.map(event => createEventCard(event)).join('') :
            '<div class="empty-state"><p>No recent events</p></div>';
    } catch (error) {
        console.error('Failed to load events:', error);
    }
}

async function loadAllEvents() {
    try {
        const response = await fetch(`${API_URL}/events`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const events = await response.json();
        
        const container = document.getElementById('allEventsList');
        container.innerHTML = events.length ?
            events.map(event => createEventCard(event)).join('') :
            '<div class="empty-state"><p>No events found</p></div>';
    } catch (error) {
        console.error('Failed to load events:', error);
    }
}

async function loadVenues() {
    try {
        const response = await fetch(`${API_URL}/venues`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const venues = await response.json();
        
        const container = document.getElementById('venuesList');
        container.innerHTML = venues.length ?
            venues.map(venue => createVenueCard(venue)).join('') :
            '<div class="empty-state"><p>No venues available</p></div>';
    } catch (error) {
        console.error('Failed to load venues:', error);
    }
}

async function loadResources() {
    try {
        const response = await fetch(`${API_URL}/resources`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const resources = await response.json();
        
        const container = document.getElementById('resourcesList');
        container.innerHTML = resources.length ?
            resources.map(resource => createResourceCard(resource)).join('') :
            '<div class="empty-state"><p>No resources available</p></div>';
    } catch (error) {
        console.error('Failed to load resources:', error);
    }
}

async function loadPendingApprovals() {
    try {
        const response = await fetch(`${API_URL}/events`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const events = await response.json();
        
        // Filter events that need approval from current user
        const statusMap = {
            'HOD': 'HOD_Review',
            'Dean': 'Dean_Review',
            'Head': 'Head_Review'
        };
        
        const pendingEvents = events.filter(event => 
            event.status === statusMap[currentUser.role]
        );
        
        // Update badge
        const badge = document.getElementById('approvalsBadge');
        if (badge) {
            badge.textContent = pendingEvents.length;
            badge.style.display = pendingEvents.length > 0 ? 'block' : 'none';
        }
        
        const container = document.getElementById('approvalsList');
        if (container) {
            container.innerHTML = pendingEvents.length ?
                pendingEvents.map(event => createApprovalCard(event)).join('') :
                '<div class="empty-state"><p>No pending approvals</p></div>';
        }
    } catch (error) {
        console.error('Failed to load approvals:', error);
    }
}

function loadViewData(view) {
    switch(view) {
        case 'overview':
            loadStats();
            loadRecentEvents();
            break;
        case 'events':
            loadAllEvents();
            break;
        case 'venues':
            loadVenues();
            break;
        case 'resources':
            loadResources();
            break;
        case 'approvals':
            loadPendingApprovals();
            break;
    }
}

// Card Creation
function createEventCard(event) {
    const statusClass = event.status.toLowerCase().replace(/_/g, '_');
    const startDate = new Date(event.schedule_start).toLocaleString();
    const endDate = new Date(event.schedule_end).toLocaleString();
    
    return `
        <div class="event-card" onclick="showEventDetails('${event._id}')">
            <div class="event-header">
                <div>
                    <h4 class="event-title">${event.title}</h4>
                    <div class="event-meta">
                        <span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M11 2H3C2.44772 2 2 2.44772 2 3V11C2 11.5523 2.44772 12 3 12H11C11.5523 12 12 11.5523 12 11V3C12 2.44772 11.5523 2 11 2Z" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M2 5H12" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                            ${new Date(event.schedule_start).toLocaleDateString()}
                        </span>
                        <span>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M7 4V7L9 8" stroke="currentColor" stroke-width="1.5"/>
                            </svg>
                            ${event.participant_count} participants
                        </span>
                    </div>
                </div>
                <span class="status-badge status-${statusClass}">${event.status.replace(/_/g, ' ')}</span>
            </div>
            ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
            <div class="event-footer">
                <div class="event-info-item">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M2 11C2 9.34315 4.68629 8 8 8C11.3137 8 14 9.34315 14 11" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    ${event.coordinator_id.name}
                </div>
            </div>
        </div>
    `;
}

function createVenueCard(venue) {
    const availabilityClass = venue.availability_status.toLowerCase().replace(/ /g, '-');
    
    return `
        <div class="venue-card">
            <div class="venue-header">
                <h4 class="venue-name">${venue.name}</h4>
                <span class="availability-badge availability-${availabilityClass}">
                    ${venue.availability_status}
                </span>
            </div>
            <div class="venue-details">
                <div class="detail-item">
                    <span class="detail-label">Capacity:</span>
                    ${venue.capacity} people
                </div>
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    ${venue.type || 'General'}
                </div>
                ${venue.features && venue.features.length ? `
                    <div class="features-list">
                        ${venue.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function createResourceCard(resource) {
    const utilizationPercent = ((resource.total_quantity - resource.available_quantity) / resource.total_quantity * 100).toFixed(0);
    
    return `
        <div class="resource-card">
            <div class="resource-header">
                <h4 class="resource-name">${resource.resource_name}</h4>
                <span class="status-badge ${resource.available_quantity > 0 ? 'status-approved' : 'status-rejected'}">
                    ${resource.available_quantity > 0 ? 'Available' : 'Depleted'}
                </span>
            </div>
            <div class="resource-details">
                <div class="detail-item">
                    <span class="detail-label">Category:</span>
                    ${resource.category}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Available:</span>
                    ${resource.available_quantity} / ${resource.total_quantity} ${resource.unit || 'units'}
                </div>
                <div class="detail-item">
                    <span class="detail-label">Utilization:</span>
                    ${utilizationPercent}%
                </div>
            </div>
        </div>
    `;
}

function createApprovalCard(event) {
    const statusClass = event.status.toLowerCase().replace(/_/g, '_');
    
    return `
        <div class="approval-card">
            <div class="approval-header">
                <div>
                    <h4 class="event-title">${event.title}</h4>
                    <div class="event-meta">
                        <span>${new Date(event.schedule_start).toLocaleString()}</span>
                        <span>${event.participant_count} participants</span>
                        <span>By: ${event.coordinator_id.name}</span>
                    </div>
                </div>
                <span class="status-badge status-${statusClass}">${event.status.replace(/_/g, ' ')}</span>
            </div>
            ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
            <div class="approval-actions">
                <button class="btn btn-success" onclick="approveEvent('${event._id}'); event.stopPropagation();">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8L7 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Approve
                </button>
                <button class="btn btn-secondary" onclick="showEventDetails('${event._id}'); event.stopPropagation();">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M8 5V8L10 10" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                    View Details
                </button>
                <button class="btn btn-danger" onclick="rejectEvent('${event._id}'); event.stopPropagation();">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Reject
                </button>
            </div>
        </div>
    `;
}

// Event Operations
async function showCreateEvent() {
    try {
        // Load resources for selection
        const response = await fetch(`${API_URL}/resources`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const resources = await response.json();
        
        const resourceList = document.getElementById('resourceSelectionList');
        resourceList.innerHTML = resources.map(resource => `
            <div class="resource-item">
                <input type="checkbox" id="res_${resource._id}" value="${resource._id}">
                <div class="resource-item-info">
                    <div class="resource-item-name">${resource.resource_name}</div>
                    <div class="resource-item-meta">
                        ${resource.category} • Available: ${resource.available_quantity}
                    </div>
                </div>
                <input type="number" 
                    id="qty_${resource._id}" 
                    min="1" 
                    max="${resource.available_quantity}"
                    placeholder="Qty"
                    style="display: none;">
            </div>
        `).join('');
        
        // Setup quantity input visibility
        resources.forEach(resource => {
            const checkbox = document.getElementById(`res_${resource._id}`);
            const qtyInput = document.getElementById(`qty_${resource._id}`);
            
            checkbox.addEventListener('change', () => {
                qtyInput.style.display = checkbox.checked ? 'block' : 'none';
                if (!checkbox.checked) qtyInput.value = '';
            });
        });
        
        openModal('createEventModal');
    } catch (error) {
        showToast('Failed to load resources', 'error');
    }
}

async function handleCreateEvent(e) {
    e.preventDefault();
    
    // Collect selected resources
    const resources = [];
    const checkboxes = document.querySelectorAll('#resourceSelectionList input[type="checkbox"]:checked');
    
    checkboxes.forEach(checkbox => {
        const resourceId = checkbox.value;
        const quantity = parseInt(document.getElementById(`qty_${resourceId}`).value);
        
        if (quantity > 0) {
            resources.push({ resource_id: resourceId, quantity });
        }
    });
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        schedule_start: document.getElementById('eventStart').value,
        schedule_end: document.getElementById('eventEnd').value,
        participant_count: parseInt(document.getElementById('eventParticipants').value),
        venue_type_required: document.getElementById('eventVenueType').value,
        department_id: currentUser.department_id,
        school_id: currentUser.school_id,
        resources
    };
    
    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create event');
        }
        
        closeModal();
        showToast('Event created successfully!', 'success');
        refreshData();
        
        // Reset form
        document.getElementById('createEventForm').reset();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function showEventDetails(eventId) {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        const { event, resourceRequests, allocation, approvalLogs } = data;
        
        const statusClass = event.status.toLowerCase().replace(/_/g, '_');
        
        let detailsHTML = `
            <div class="event-details-content">
                <div class="detail-section">
                    <h4>Event Information</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="detail-label">Title:</span>
                            ${event.title}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Status:</span>
                            <span class="status-badge status-${statusClass}">${event.status.replace(/_/g, ' ')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Coordinator:</span>
                            ${event.coordinator_id.name}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Start:</span>
                            ${new Date(event.schedule_start).toLocaleString()}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">End:</span>
                            ${new Date(event.schedule_end).toLocaleString()}
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Participants:</span>
                            ${event.participant_count}
                        </div>
                    </div>
                    ${event.description ? `<p style="margin-top: 1rem;">${event.description}</p>` : ''}
                </div>
                
                <div class="detail-section">
                    <h4>Resource Requests</h4>
                    <div class="resources-list">
                        ${resourceRequests.map(r => `
                            <div class="resource-item">
                                <span>${r.resource_id.resource_name}</span>
                                <span>${r.quantity_requested} ${r.resource_id.unit || 'units'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${allocation ? `
                    <div class="detail-section">
                        <h4>Allocation Details</h4>
                        <div class="detail-grid">
                            ${allocation.venue_id ? `
                                <div class="detail-item">
                                    <span class="detail-label">Venue:</span>
                                    ${allocation.venue_id.name}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${approvalLogs.length > 0 ? `
                    <div class="detail-section">
                        <h4>Approval History</h4>
                        <div class="approval-timeline">
                            ${approvalLogs.map(log => `
                                <div class="timeline-item">
                                    <div class="timeline-marker ${log.decision.toLowerCase()}"></div>
                                    <div class="timeline-content">
                                        <div class="timeline-header">
                                            <strong>${log.approved_by.name}</strong> (${log.approved_by.role})
                                            <span class="timeline-date">${new Date(log.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div class="timeline-decision">
                                            <span class="status-badge status-${log.decision.toLowerCase()}">${log.decision}</span>
                                        </div>
                                        ${log.comments ? `<p class="timeline-comments">${log.comments}</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Add action buttons for coordinator
        if (event.coordinator_id._id === currentUser.id && event.status === 'Approved') {
            detailsHTML += `
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                    <button class="btn btn-success" onclick="completeEvent('${event._id}')">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8L7 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        Mark as Completed
                    </button>
                </div>
            `;
        }
        
        document.getElementById('eventDetailsContent').innerHTML = detailsHTML;
        openModal('eventDetailsModal');
    } catch (error) {
        showToast('Failed to load event details', 'error');
    }
}

async function approveEvent(eventId) {
    const comments = prompt('Optional comments:');
    
    try {
        const response = await fetch(`${API_URL}/events/${eventId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                decision: 'Approved',
                comments: comments || ''
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to approve event');
        }
        
        showToast('Event approved successfully!', 'success');
        refreshData();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function rejectEvent(eventId) {
    const reason = prompt('Rejection reason:');
    
    if (!reason) {
        showToast('Rejection reason is required', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/events/${eventId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                decision: 'Rejected',
                comments: reason
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to reject event');
        }
        
        showToast('Event rejected', 'success');
        refreshData();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function completeEvent(eventId) {
    if (!confirm('Mark this event as completed? This will release all allocated resources.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/events/${eventId}/complete`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to complete event');
        }
        
        closeModal();
        showToast('Event completed and resources released!', 'success');
        refreshData();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Utility Functions
function openModal(modalId) {
    document.getElementById('modalOverlay').classList.add('active');
    document.getElementById(modalId).classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

async function refreshData() {
    await loadDashboardData();
    
    // Refresh current view
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav) {
        const view = activeNav.dataset.view;
        loadViewData(view);
    }
}

function filterEvents() {
    const status = document.getElementById('eventStatusFilter').value;
    loadAllEvents();
}

function showAddVenue() {
    showToast('Venue management coming soon!', 'info');
}

function showAddResource() {
    showToast('Resource management coming soon!', 'info');
}

// Make functions globally available
window.showLogin = showLogin;
window.showRegister = showRegister;
window.logout = logout;
window.switchView = switchView;
window.showCreateEvent = showCreateEvent;
window.showEventDetails = showEventDetails;
window.approveEvent = approveEvent;
window.rejectEvent = rejectEvent;
window.completeEvent = completeEvent;
window.closeModal = closeModal;
window.refreshData = refreshData;
window.filterEvents = filterEvents;
window.showAddVenue = showAddVenue;
window.showAddResource = showAddResource;
