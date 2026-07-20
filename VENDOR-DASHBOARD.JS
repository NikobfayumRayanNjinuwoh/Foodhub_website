document.addEventListener('DOMContentLoaded', () => {
    const app = window.FoodHubApp;
    const escapeHtml = app.escapeHtml || ((value) => String(value == null ? '' : value));
    const ADD_PAGE = 'VENDOR-ADD-ITEM.html';
    const LOGIN_PAGE = 'LOGIN.html';
    const statuses = ['Preparing','Ready','Out for Delivery','Delivered','Cancelled'];

    const addBtn = document.querySelector('.add-btn');
    const logoutBtn = document.querySelector('.login-btn');
    const tbody = document.querySelector('.orders table tbody');
    const session = app.getSession();

    if(!session || session.role !== 'vendor'){
        alert('Please sign in as a vendor to access the dashboard.');
        window.location.href = LOGIN_PAGE;
        return;
    }

    const statCards = {
        totalOrders: document.querySelectorAll('.stat-card')[0]?.querySelector('.stat-value'),
        revenue: document.querySelectorAll('.stat-card')[1]?.querySelector('.stat-value'),
        activeItems: document.querySelectorAll('.stat-card')[2]?.querySelector('.stat-value'),
        avgPrep: document.querySelectorAll('.stat-card')[3]?.querySelector('.stat-value'),
    };

    function parseCurrencyToNumber(text) {
        if (!text) return 0;
        return Number(String(text).replace(/[^0-9.-]+/g, '')) || 0;
    }

    function getOrders() {
        return app.getOrders().filter(order => order.vendor === (session.name || session.email));
    }

    function saveOrders(orders) {
        const allOrders = app.getOrders();
        const otherOrders = allOrders.filter(order => order.vendor !== (session.name || session.email));
        app.saveOrders([...otherOrders, ...orders]);
    }

    let orders = getOrders();

    function renderOrders() {
        if(!tbody) return;
        tbody.innerHTML = '';
        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(order.id || '#0000')}</td>
                <td>${escapeHtml(order.customer || 'Guest')}</td>
                <td>${escapeHtml(order.items || '')}</td>
                <td>${(order.total || 0).toLocaleString()} F</td>
                <td><span class="status ${String(order.status).toLowerCase().replace(/\s+/g,'-')}">${escapeHtml(order.status || 'Pending')}</span></td>
            `;
            tbody.appendChild(tr);
        });
        attachStatusHandlers();
        updateStats();
    }

    function attachStatusHandlers() {
        const statusSpans = tbody.querySelectorAll('.status');
        statusSpans.forEach((span, index) => {
            span.style.cursor = 'pointer';
            span.title = 'Click to cycle status';
            span.addEventListener('click', () => {
                const order = orders[index];
                if (!order) return;
                const currentIndex = statuses.indexOf(order.status);
                const nextIndex = (currentIndex + 1) % statuses.length;
                order.status = statuses[nextIndex];
                saveOrders(orders);
                renderOrders();
            });
        });
    }

    function updateStats() {
        if (!statCards.totalOrders) return;
        statCards.totalOrders.textContent = orders.length;

        const revenue = orders.reduce((s,o) => s + (o.total || 0), 0);
        statCards.revenue.textContent = `${revenue.toLocaleString()} F`;

        const itemSet = new Set();
        orders.forEach(o => {
            const parts = String(o.items).split(',').map(p => p.trim());
            parts.forEach(p => {
                const name = p.replace(/\s*x\s*\d+$/i, '').trim();
                if (name) itemSet.add(name.toLowerCase());
            });
        });
        statCards.activeItems.textContent = itemSet.size;
        statCards.avgPrep.textContent = '22 min';
    }

    addBtn?.addEventListener('click', () => window.location.href = ADD_PAGE);
    logoutBtn?.addEventListener('click', () => {
        app.clearSession();
        window.location.href = LOGIN_PAGE;
    });

    window.vendorDashboard = { getOrders: () => orders, addOrder: (order) => { orders.unshift(order); saveOrders(orders); renderOrders(); } };

    renderOrders();
});