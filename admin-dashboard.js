document.addEventListener('DOMContentLoaded', () => {
    const app = window.FoodHubApp;
    const escapeHtml = app.escapeHtml || ((value) => String(value == null ? '' : value));
    const session = app.getSession();

    if (!session || session.role !== 'admin') {
        alert('Please sign in as an admin to access the dashboard.');
        window.location.href = 'LOGIN.html';
        return;
    }

    const contentGrid = document.querySelector('.content-grid');
    const profile = document.querySelector('.profile');
    const statsCards = document.querySelectorAll('.stats .card');
    const quickActions = document.querySelectorAll('.quick-actions .action');

    function getPendingVendors() {
        return app.getUsers().filter((user) => user.role === 'vendor' && user.approved !== true);
    }

    function getApprovedVendors() {
        return app.getUsers().filter((user) => user.role === 'vendor' && user.approved === true);
    }

    function renderStats() {
        const orders = app.getOrders();
        const totalOrders = orders.length;
        const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        const activeVendors = getApprovedVendors().length;
        const pendingRequests = getPendingVendors().length;

        const values = [
            totalOrders,
            `${revenue.toLocaleString()} F`,
            activeVendors,
            pendingRequests
        ];

        statsCards.forEach((card, index) => {
            const valueEl = card.querySelector('h2');
            const badgeEl = card.querySelector('.growth, .new');
            if (valueEl) {
                valueEl.textContent = values[index];
            }
            if (badgeEl && index === 3) {
                badgeEl.textContent = pendingRequests ? 'New' : 'None';
                badgeEl.className = pendingRequests ? 'new' : 'growth green';
            }
        });
    }

    function renderApplications() {
        const tableBody = document.querySelector('.table-card tbody');
        if (!tableBody) return;

        const pendingVendors = getPendingVendors();
        if (!pendingVendors.length) {
            tableBody.innerHTML = '<tr><td colspan="4">No pending vendor applications.</td></tr>';
            return;
        }

        tableBody.innerHTML = pendingVendors.map((vendor) => {
            const safeName = escapeHtml(vendor.name || 'Vendor').replace(/\s+/g, ' ');
            const safeEmail = escapeHtml(vendor.email || '');
            return `
                <tr data-id="${escapeHtml(vendor.id || '')}">
                    <td class="vendor">
                        <span class="vendor-icon">${escapeHtml((vendor.name || 'V').charAt(0).toUpperCase())}</span>
                        ${safeName}
                    </td>
                    <td>${safeEmail}</td>
                    <td>${new Date(vendor.created || Date.now()).toLocaleDateString()}</td>
                    <td class="actions">
                        <button class="approve">✓</button>
                        <button class="reject">✕</button>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.querySelectorAll('.approve').forEach((button) => {
            button.addEventListener('click', () => {
                const row = button.closest('tr');
                if (!row) return;
                const userId = row.dataset.id;
                approveVendor(userId);
            });
        });

        tableBody.querySelectorAll('.reject').forEach((button) => {
            button.addEventListener('click', () => {
                const row = button.closest('tr');
                if (!row) return;
                const userId = row.dataset.id;
                rejectVendor(userId);
            });
        });
    }

    function approveVendor(userId) {
        const users = app.getUsers();
        const user = users.find((entry) => entry.id === userId);
        if (!user) return;

        user.approved = true;
        user.role = 'vendor';
        user.status = 'approved';
        app.saveUsers(users);
        renderAll();
        alert(`Approved ${user.name || user.email}`);
    }

    function rejectVendor(userId) {
        const users = app.getUsers();
        const user = users.find((entry) => entry.id === userId);
        if (!user) return;

        user.approved = false;
        user.status = 'rejected';
        app.saveUsers(users);
        renderAll();
        alert(`Rejected ${user.name || user.email}`);
    }

    function renderTransactions() {
        if (!contentGrid) return;

        let card = document.querySelector('.transactions-card');
        if (!card) {
            card = document.createElement('div');
            card.className = 'table-card transactions-card';
            card.innerHTML = `
                <div class="table-header">
                    <h3>Recent Transactions</h3>
                    <span class="history">Live client ↔ vendor activity</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Client</th>
                            <th>Vendor</th>
                            <th>Total</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            `;
            contentGrid.appendChild(card);
        }

        const body = card.querySelector('tbody');
        if (!body) return;

        const orders = app.getOrders().slice(0, 8);
        if (!orders.length) {
            body.innerHTML = '<tr><td colspan="5">No transactions yet.</td></tr>';
            return;
        }

        body.innerHTML = orders.map((order) => `
            <tr>
                <td>${escapeHtml(order.id || '#0000')}</td>
                <td>${escapeHtml(order.customer || 'Guest')}</td>
                <td>${escapeHtml(order.vendor || 'FoodHub')}</td>
                <td>${(Number(order.total) || 0).toLocaleString()} F</td>
                <td>${escapeHtml(order.status || 'Pending')}</td>
            </tr>
        `).join('');
    }

    function renderAll() {
        renderStats();
        renderApplications();
        renderTransactions();
    }

    if (profile) {
        const adminTag = profile.querySelector('span');
        if (adminTag) {
            adminTag.textContent = session.name || 'Admin User';
        }

        if (!profile.querySelector('.logout-btn')) {
            const logoutButton = document.createElement('button');
            logoutButton.className = 'logout-btn';
            logoutButton.textContent = 'Log Out';
            logoutButton.addEventListener('click', () => {
                app.clearSession();
                window.location.href = 'LOGIN.html';
            });
            profile.appendChild(logoutButton);
        }
    }

    quickActions.forEach((action) => {
        action.addEventListener('click', () => {
            const label = action.textContent.trim().toLowerCase();
            if (label.includes('vendors') || label.includes('manage')) {
                window.location.href = 'VENDORs-request.html';
            } else if (label.includes('website')) {
                window.location.href = 'SITE-SETTING.HTML';
            } else if (label.includes('ads')) {
                window.location.href = 'ADDS-upload.html';
            }
        });
    });

    const historyLink = document.querySelector('.history');
    if (historyLink) {
        historyLink.style.cursor = 'pointer';
        historyLink.addEventListener('click', () => {
            window.location.href = 'VENDORs-request.html';
        });
    }

    window.adminDashboard = {
        renderAll,
        approveVendor,
        rejectVendor
    };

    renderAll();
});
