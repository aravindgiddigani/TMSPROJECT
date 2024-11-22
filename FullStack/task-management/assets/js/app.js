// API Base URL - adjust this to match your Django backend URL
const API_BASE_URL = 'http://localhost:8000/api';

// Register Form Handler
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            console.log('Sending registration data:', userData);
            const response = await fetch(`${API_BASE_URL}/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            console.log('Registration response:', data);

            if (response.ok) {
                alert('Registration successful! Please login.');
                window.location.href = 'index.html';
            } else {
                const errorMessage = data.error || data.message || Object.values(data)[0]?.[0] || 'Registration failed';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Registration failed. Please try again.');
        }
    });
}

// Login Form Handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        try {
            console.log('Sending login data:', loginData);
            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();
            console.log('Login response:', data);

            if (response.ok) {
                localStorage.setItem('user', JSON.stringify({
                    token: data.token,
                    user: data.user
                }));
                window.location.href = 'dashboard.html';
            } else {
                const errorMessage = data.message || data.error || 'Login failed';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Login failed. Please try again.');
        }
    });
}

// Dashboard Protection
if (window.location.href.includes('dashboard.html')) {
    const user = localStorage.getItem('user');
    if (!user) {
        window.location.href = 'index.html';
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return;

    const status = document.getElementById('statusFilter')?.value || 'all';
    const priority = document.getElementById('priorityFilter')?.value || 'all';
    const startDate = document.getElementById('startDate')?.value;
    const endDate = document.getElementById('endDate')?.value;

    try {
        let url = `${API_BASE_URL}/tasks/?status=${status}&priority=${priority}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const tasks = await response.json();
            updateDashboardStats(tasks);
            populateTaskTable(tasks);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update dashboard statistics
function updateDashboardStats(tasks) {
    if (!tasks) return;
    
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('completedTasks').textContent = 
        tasks.filter(task => task.status === 'completed').length;
    document.getElementById('inProgressTasks').textContent = 
        tasks.filter(task => task.status === 'in-progress').length;
}

// Populate task table
function populateTaskTable(tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        taskList.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${task.title}</td>
                <td>${task.status}</td>
                <td>${task.priority}</td>
                <td>${task.deadline}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editTask(${task.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

// Load dashboard data when on dashboard page
if (window.location.href.includes('dashboard.html')) {
    loadDashboardData();
}

// Task Form Handler
if (document.getElementById('taskForm')) {
    document.getElementById('taskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.token) {
            window.location.href = 'index.html';
            return;
        }

        const taskData = {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            status: document.getElementById('status').value,
            priority: document.getElementById('priority').value,
            deadline: document.getElementById('deadline').value
        };

        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('id');
        const isEditing = !!taskId;

        try {
            const url = isEditing ? `${API_BASE_URL}/tasks/${taskId}/` : `${API_BASE_URL}/tasks/`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`,
                },
                body: JSON.stringify(taskData)
            });

            const data = await response.json();
            console.log('Response:', response);
            console.log('Response data:', data);

            if (response.ok) {
                alert(isEditing ? 'Task updated successfully!' : 'Task created successfully!');
                window.location.href = 'dashboard.html';
            } else {
                const errorMessage = data.error || data.detail || 'Failed to save task';
                alert(errorMessage);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to save task. Please try again.');
        }
    });
}

// Add event listeners for filters
if (document.getElementById('statusFilter')) {
    document.getElementById('statusFilter').addEventListener('change', loadDashboardData);
}
if (document.getElementById('priorityFilter')) {
    document.getElementById('priorityFilter').addEventListener('change', loadDashboardData);
}
if (document.getElementById('startDate')) {
    document.getElementById('startDate').addEventListener('change', loadDashboardData);
}
if (document.getElementById('endDate')) {
    document.getElementById('endDate').addEventListener('change', loadDashboardData);
}

// Add these functions for editing and deleting tasks
async function editTask(taskId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return;

    // Redirect to task detail page with task ID
    window.location.href = `task-detail.html?id=${taskId}`;
}

async function deleteTask(taskId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return;

    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.ok) {
            alert('Task deleted successfully!');
            loadDashboardData(); // Refresh the task list
        } else {
            alert('Failed to delete task. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete task. Please try again.');
    }
    
}

function handleLogout() {
    // Clear any stored tokens/session data
    localStorage.removeItem('userToken');
    sessionStorage.clear();
    
    // Show logout notification using the existing toast
    const toast = new bootstrap.Toast(document.getElementById('toastNotification'));
    document.querySelector('.toast-body').textContent = 'Successfully logged out!';
    toast.show();
    
    // Redirect to index.html after a brief delay
    setTimeout(() => {
        // Using relative path to go up one directory level since index.html is in the root
        window.location.href = '/FullStack/task-management/pages/index.html';
    }, 1500);
}

// Sample task data (replace with your actual data source)
let tasks = [
    {
        id: 1,
        title: "Design UI mockups",
        status: "in-progress",
        priority: "high",
        deadline: "2024-03-30",
        assignedTo: "John Doe",
        createdAt: "2024-03-20"
    },
    // Add more sample tasks as needed
];

// Function to calculate due days
function calculateDueIn(deadline) {
    const today = new Date();
    const dueDate = new Date(deadline);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '<span class="badge bg-danger">Overdue</span>';
    if (diffDays === 0) return '<span class="badge bg-warning">Due today</span>';
    return `<span class="badge bg-info">${diffDays} days</span>`;
}

// Function to render tasks
function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.innerHTML = tasks.map(task => `
        <tr>
            <td>#${task.id}</td>
            <td>${task.title}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(task.status)}">${task.status}</span>
            </td>
            <td>
                <span class="badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
            </td>
            <td>${formatDate(task.deadline)}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${getAvatarUrl(task.assignedTo)}" class="avatar me-2" alt="${task.assignedTo}">
                    ${task.assignedTo}
                </div>
            </td>
            <td>${calculateDueIn(task.deadline)}</td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light" data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="#" onclick="editTask(${task.id})">
                                <i class="fas fa-edit me-2"></i>Edit
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" onclick="changeStatus(${task.id})">
                                <i class="fas fa-exchange-alt me-2"></i>Change Status
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" onclick="reassignTask(${task.id})">
                                <i class="fas fa-user-plus me-2"></i>Reassign
                            </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item text-danger" href="#" onclick="deleteTask(${task.id})">
                                <i class="fas fa-trash-alt me-2"></i>Delete
                            </a>
                        </li>
                    </ul>
                </div>
            </td>
        </tr>
    `).join('');
}

// Helper functions
function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-warning',
        'in-progress': 'bg-info',
        'completed': 'bg-success'
    };
    return classes[status] || 'bg-secondary';
}

function getPriorityBadgeClass(priority) {
    const classes = {
        'low': 'bg-success',
        'medium': 'bg-warning',
        'high': 'bg-danger'
    };
    return classes[priority] || 'bg-secondary';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getAvatarUrl(name) {
    // Generate avatar URL using initials (you can replace this with actual avatar images)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
}

// Action functions
function editTask(taskId) {
    // Implement edit functionality
    window.location.href = `task-detail.html?id=${taskId}`;
}

function changeStatus(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = prompt('Enter new status (pending/in-progress/completed):', task.status);
    if (newStatus && ['pending', 'in-progress', 'completed'].includes(newStatus)) {
        task.status = newStatus;
        renderTasks();
        showToast('Task status updated successfully!');
    }
}

function reassignTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newAssignee = prompt('Enter new assignee name:', task.assignedTo);
    if (newAssignee) {
        task.assignedTo = newAssignee;
        renderTasks();
        showToast('Task reassigned successfully!');
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(t => t.id !== taskId);
        renderTasks();
        showToast('Task deleted successfully!');
    }
}

function showToast(message) {
    const toast = new bootstrap.Toast(document.getElementById('toastNotification'));
    document.querySelector('.toast-body').textContent = message;
    toast.show();
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
});

// Event listeners for filters
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tasks
    renderTasks();
    updateTaskCounters();

    // Add event listeners for filters
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('priorityFilter').addEventListener('change', applyFilters);
    document.getElementById('startDate').addEventListener('change', applyFilters);
    document.getElementById('endDate').addEventListener('change', applyFilters);
    document.getElementById('taskSearch').addEventListener('input', applyFilters);
});

// Function to apply all filters
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const searchQuery = document.getElementById('taskSearch').value.toLowerCase();

    const filteredTasks = tasks.filter(task => {
        // Status filter
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

        // Date range filter
        if (startDate && new Date(task.deadline) < new Date(startDate)) return false;
        if (endDate && new Date(task.deadline) > new Date(endDate)) return false;

        // Search filter
        if (searchQuery) {
            const searchFields = [
                task.id.toString(),
                task.title.toLowerCase(),
                task.status.toLowerCase(),
                task.priority.toLowerCase(),
                task.assignedTo.toLowerCase()
            ];
            return searchFields.some(field => field.includes(searchQuery));
        }

        return true;
    });

    renderFilteredTasks(filteredTasks);
    updateTaskCounters(filteredTasks);
}

// Function to render filtered tasks
function renderFilteredTasks(filteredTasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    taskList.innerHTML = filteredTasks.map(task => `
        <tr>
            <td>#${task.id}</td>
            <td>${task.title}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(task.status)}">${task.status}</span>
            </td>
            <td>
                <span class="badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span>
            </td>
            <td>${formatDate(task.deadline)}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${getAvatarUrl(task.assignedTo)}" class="avatar me-2" alt="${task.assignedTo}">
                    ${task.assignedTo}
                </div>
            </td>
            <td>${calculateDueIn(task.deadline)}</td>
            <td>
                <div class="dropdown">
                    <button class="btn btn-sm btn-light" data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="#" onclick="editTask(${task.id})">
                                <i class="fas fa-edit me-2"></i>Edit
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" onclick="changeStatus(${task.id})">
                                <i class="fas fa-exchange-alt me-2"></i>Change Status
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" onclick="reassignTask(${task.id})">
                                <i class="fas fa-user-plus me-2"></i>Reassign
                            </a>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item text-danger" href="#" onclick="deleteTask(${task.id})">
                                <i class="fas fa-trash-alt me-2"></i>Delete
                            </a>
                        </li>
                    </ul>
                </div>
            </td>
        </tr>
    `).join('');
}

// Function to update task counters
function updateTaskCounters(filteredTasks) {
    document.getElementById('totalTasks').textContent = filteredTasks.length;
    document.getElementById('completedTasks').textContent = 
        filteredTasks.filter(task => task.status === 'completed').length;
    document.getElementById('inProgressTasks').textContent = 
        filteredTasks.filter(task => task.status === 'in-progress').length;
    document.getElementById('pendingTasks').textContent = 
        filteredTasks.filter(task => task.status === 'pending').length;
}

// Social login handler
function handleSocialLogin(platform) {
    const socialUrls = {
        google: 'https://accounts.google.com/o/oauth2/v2/auth',
        github: 'https://github.com/login',
        linkedin: 'https://www.linkedin.com/login'
    };

    // Show loading state
    const button = event.currentTarget;
    const icon = button.querySelector('i');
    const originalClass = icon.className;
    icon.className = 'fas fa-spinner fa-spin';
    button.disabled = true;

    // Simulate a brief loading state
    setTimeout(() => {
        // Reset button state
        icon.className = originalClass;
        button.disabled = false;
        
        // Redirect to the authentication page
        window.location.href = socialUrls[platform];
    }, 500);
}

// Add hover effect to social buttons
document.addEventListener('DOMContentLoaded', () => {
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = 'none';
        });
    });
});

// Handle forgot password form submission
document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
});

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    const successMessage = document.getElementById('successMessage');
    
    try {
        // Show loading state
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sending...';
        
        // Simulate API call (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Show success message
        successMessage.style.display = 'block';
        
        // Clear form
        e.target.reset();
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        // Handle error
        alert('Error sending reset link. Please try again.');
        
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = 'Send Reset Link <i class="fas fa-paper-plane ms-2"></i>';
    }
}

// Add these styles to your CSS
const styles = `
    .fade-in {
        animation: fadeIn 0.5s ease-in;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .input-group-custom {
        position: relative;
        margin-bottom: 1rem;
    }

    .input-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #6c757d;
    }

    .custom-input {
        padding-left: 2.5rem;
        border-radius: 0.5rem;
    }

    .alert {
        border-radius: 10px;
        padding: 1rem;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 500;
    }

    .btn-primary {
        background: var(--primary);
        border: none;
    }

    .btn-light {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
    }

    .btn-light:hover {
        background: #e9ecef;
    }
`;

// Task Management Functions
document.addEventListener('DOMContentLoaded', function() {
    const taskForm = document.getElementById('taskForm');
    if (taskForm) {
        taskForm.addEventListener('submit', handleTaskSubmit);
        loadExistingTasks(); // Load tasks when dashboard loads
    }
});

async function handleTaskSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creating...';

    try {
        // Gather form data
        const taskData = {
            id: Date.now(), // Simple ID generation
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            status: document.getElementById('status').value,
            priority: document.getElementById('priority').value,
            startDate: document.getElementById('startDate').value,
            deadline: document.getElementById('deadline').value,
            reminder: document.getElementById('reminder').value,
            tags: document.getElementById('taskTags').value.split(',').map(tag => tag.trim()),
            createdAt: new Date().toISOString(),
            attachments: [], // Handle file uploads separately if needed
        };

        // Get existing tasks or initialize empty array
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        
        // Add new task
        tasks.push(taskData);
        
        // Save to localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));

        // Show success message
        showNotification('Task created successfully!', 'success');

        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);

    } catch (error) {
        console.error('Error creating task:', error);
        showNotification('Failed to create task. Please try again.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save me-2"></i>Create Task';
    }
}

// Load and display tasks in dashboard
function loadExistingTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    // Update task counters
    updateTaskCounters(tasks);
    
    // Clear existing tasks
    taskList.innerHTML = '';
    
    // Add each task to the table
    tasks.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${task.id}</td>
            <td>${task.title}</td>
            <td><span class="badge ${getStatusBadgeClass(task.status)}">${task.status}</span></td>
            <td><span class="badge ${getPriorityBadgeClass(task.priority)}">${task.priority}</span></td>
            <td>${formatDate(task.deadline)}</td>
            <td>Unassigned</td>
            <td>${calculateDueIn(task.deadline)}</td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        taskList.appendChild(row);
    });
}

// Helper functions
function updateTaskCounters(tasks) {
    const totalTasks = document.getElementById('totalTasks');
    const completedTasks = document.getElementById('completedTasks');
    const inProgressTasks = document.getElementById('inProgressTasks');
    const pendingTasks = document.getElementById('pendingTasks');

    if (totalTasks) totalTasks.textContent = tasks.length;
    if (completedTasks) completedTasks.textContent = tasks.filter(t => t.status === 'completed').length;
    if (inProgressTasks) inProgressTasks.textContent = tasks.filter(t => t.status === 'in-progress').length;
    if (pendingTasks) pendingTasks.textContent = tasks.filter(t => t.status === 'pending').length;
}

function calculateDueIn(deadline) {
    const dueDate = new Date(deadline);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    return `${diffDays} days`;
}

function getStatusBadgeClass(status) {
    const classes = {
        'pending': 'bg-warning',
        'in-progress': 'bg-info',
        'completed': 'bg-success'
    };
    return classes[status] || 'bg-secondary';
}

function getPriorityBadgeClass(priority) {
    const classes = {
        'high': 'bg-danger',
        'medium': 'bg-warning',
        'low': 'bg-info'
    };
    return classes[priority] || 'bg-secondary';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '1050';
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} me-2"></i>
        ${message}
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
