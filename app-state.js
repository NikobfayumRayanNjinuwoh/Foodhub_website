(function (global) {
    const STORAGE_KEYS = {
        session: 'fh_session_v1',
        users: 'fh_users_v1',
        orders: 'fh_orders_v1',
        cart: 'fh_cart_v1',
        items: 'fh_items_v1',
        ads: 'fh_ads_v1'
    };

    function safeParse(value, fallback) {
        try {
            return value ? JSON.parse(value) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function safeStringify(value) {
        try {
            return JSON.stringify(value);
        } catch (error) {
            return null;
        }
    }

    function getStorageValue(key, fallback) {
        return safeParse(localStorage.getItem(key), fallback);
    }

    function setStorageValue(key, value) {
        const payload = safeStringify(value);
        if (payload === null) return;
        try {
            localStorage.setItem(key, payload);
        } catch (error) {
            console.warn('Storage unavailable:', error);
        }
    }

    function sanitizeText(value, fallback = '') {
        const text = value == null ? '' : String(value).trim();
        return text || fallback;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeRole(role) {
        const value = sanitizeText(role, 'customer').toLowerCase();
        return ['customer', 'vendor', 'admin'].includes(value) ? value : 'customer';
    }

    function hashPassword(password) {
        const text = String(password || '');
        const salt = 'foodhub-2026';
        let hash = 2166136261;
        for (let index = 0; index < text.length; index += 1) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        for (let index = 0; index < salt.length; index += 1) {
            hash ^= salt.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return `fh$${(hash >>> 0).toString(16)}`;
    }

    function verifyPassword(inputPassword, storedPassword) {
        const inputValue = String(inputPassword || '');
        const storedValue = String(storedPassword || '');
        if (!storedValue) return false;
        if (storedValue.startsWith('fh$')) return hashPassword(inputValue) === storedValue;
        return inputValue === storedValue;
    }

    function sanitizeMediaValue(value, fallback = '') {
        const candidate = sanitizeText(value, '');
        if (!candidate) return fallback;
        if (/^data:image\//i.test(candidate) || /^data:video\//i.test(candidate) || /^https?:\/\//i.test(candidate)) {
            return candidate;
        }
        return fallback;
    }

    function normalizeUser(user) {
        const role = normalizeRole(user && user.role);
        const email = sanitizeText(user && user.email, '').toLowerCase();
        const password = user && user.password ? (String(user.password).startsWith('fh$') ? String(user.password) : hashPassword(String(user.password))) : '';
        const approved = role === 'vendor' ? Boolean(user && user.approved) : true;

        return {
            ...user,
            id: sanitizeText(user && user.id, `user-${Date.now()}`),
            name: sanitizeText(user && user.name, user && user.vendorName ? user.vendorName : 'User'),
            vendorName: sanitizeText(user && user.vendorName, ''),
            email,
            password,
            role,
            approved,
            created: Number(user && user.created) || Date.now()
        };
    }

    function getSession() {
        const session = getStorageValue(STORAGE_KEYS.session, null);
        if (!session) return null;
        return {
            ...session,
            email: sanitizeText(session.email, '').toLowerCase(),
            name: sanitizeText(session.name, 'User'),
            role: normalizeRole(session.role)
        };
    }

    function saveSession(session) {
        const safeSession = session ? {
            ...session,
            email: sanitizeText(session.email, '').toLowerCase(),
            name: sanitizeText(session.name, 'User'),
            role: normalizeRole(session.role)
        } : null;
        setStorageValue(STORAGE_KEYS.session, safeSession);
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_KEYS.session);
    }

    function getUsers() {
        const storedUsers = getStorageValue(STORAGE_KEYS.users, []);
        const users = Array.isArray(storedUsers) ? storedUsers.map(normalizeUser) : [];
        const shouldPersist = safeStringify(users) !== safeStringify(storedUsers);
        if (shouldPersist) setStorageValue(STORAGE_KEYS.users, users);
        return users;
    }

    function saveUsers(users) {
        const normalizedUsers = Array.isArray(users) ? users.map(normalizeUser) : [];
        setStorageValue(STORAGE_KEYS.users, normalizedUsers);
        return normalizedUsers;
    }

    function getCart() {
        return getStorageValue(STORAGE_KEYS.cart, []);
    }

    function saveCart(cart) {
        setStorageValue(STORAGE_KEYS.cart, cart);
    }

    function getItems() {
        return getStorageValue(STORAGE_KEYS.items, []);
    }

    function saveItems(items) {
        setStorageValue(STORAGE_KEYS.items, items);
    }

    function getOrders() {
        return getStorageValue(STORAGE_KEYS.orders, []);
    }

    function saveOrders(orders) {
        setStorageValue(STORAGE_KEYS.orders, orders);
    }

    function getAds() {
        return getStorageValue(STORAGE_KEYS.ads, []);
    }

    function saveAds(ads) {
        setStorageValue(STORAGE_KEYS.ads, ads);
    }

    function ensureDemoData() {
        const users = getUsers();
        if (!users.length) {
            saveUsers([
                {
                    id: 'admin-1',
                    name: 'Admin User',
                    email: 'admin@foodhub.com',
                    password: hashPassword('admin123'),
                    role: 'admin',
                    approved: true,
                    created: Date.now()
                },
                {
                    id: 'vendor-1',
                    name: "Mama's Kitchen",
                    email: 'vendor@foodhub.com',
                    password: hashPassword('vendor123'),
                    role: 'vendor',
                    vendorName: "Mama's Kitchen",
                    approved: true,
                    created: Date.now()
                }
            ]);
        }

        const items = getItems();
        if (!items.length) {
            saveItems([
                {
                    id: 1,
                    title: 'Jollof Rice & Chicken',
                    price: 3500,
                    category: 'Rice',
                    vendor: "Mama's Kitchen"
                },
                {
                    id: 2,
                    title: 'Grilled Tilapia',
                    price: 5000,
                    category: 'Grills',
                    vendor: 'Riverside Grills'
                }
            ]);
        }

        const orders = getOrders();
        if (!orders.length) {
            saveOrders([
                {
                    id: '#1001',
                    customer: 'Marie K.',
                    customerEmail: 'customer@example.com',
                    vendor: "Mama's Kitchen",
                    items: 'Jollof Rice x2',
                    total: 7000,
                    paymentMethod: 'mobile',
                    status: 'Preparing',
                    created: Date.now() - 86400000
                },
                {
                    id: '#1002',
                    customer: 'Paul E.',
                    customerEmail: 'customer@example.com',
                    vendor: 'Riverside Grills',
                    items: 'Grilled Tilapia',
                    total: 5000,
                    paymentMethod: 'cash',
                    status: 'Delivered',
                    created: Date.now() - 172800000
                }
            ]);
        }
    }

    function getCurrentUser() {
        const session = getSession();
        if (!session) return null;
        const users = getUsers();
        return users.find((user) => user.email === session.email) || session;
    }

    function formatCurrency(value) {
        return Number(value || 0).toLocaleString() + ' F';
    }

    ensureDemoData();

    global.FoodHubApp = {
        STORAGE_KEYS,
        getSession,
        saveSession,
        clearSession,
        getUsers,
        saveUsers,
        getCart,
        saveCart,
        getItems,
        saveItems,
        getOrders,
        saveOrders,
        getAds,
        saveAds,
        getCurrentUser,
        formatCurrency,
        ensureDemoData,
        sanitizeText,
        escapeHtml,
        normalizeRole,
        hashPassword,
        verifyPassword,
        sanitizeMediaValue,
        isLoggedIn: () => Boolean(getSession()),
        isCustomer: () => Boolean(getSession() && getSession().role === 'customer'),
        isVendor: () => Boolean(getSession() && getSession().role === 'vendor'),
        isAdmin: () => Boolean(getSession() && getSession().role === 'admin')
    };
})(window);
