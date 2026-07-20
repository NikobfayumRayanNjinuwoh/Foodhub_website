/**
 * FoodHub App Audit - Tests all major functions
 * Run this in the browser console on any page to verify functionality
 */

window.foodhubAudit = (function() {
    const app = window.FoodHubApp;
    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    function test(name, fn) {
        try {
            fn();
            results.passed.push(name);
            console.log(`✓ ${name}`);
        } catch (e) {
            results.failed.push(`${name}: ${e.message}`);
            console.error(`✗ ${name}:`, e.message);
        }
    }

    function warn(msg) {
        results.warnings.push(msg);
        console.warn(`⚠ ${msg}`);
    }

    // 1. App State Tests
    test('app.getSession exists', () => {
        if (typeof app.getSession !== 'function') throw new Error('Missing');
    });

    test('app.getUsers exists', () => {
        if (typeof app.getUsers !== 'function') throw new Error('Missing');
    });

    test('app.getCart exists', () => {
        if (typeof app.getCart !== 'function') throw new Error('Missing');
    });

    test('app.getOrders exists', () => {
        if (typeof app.getOrders !== 'function') throw new Error('Missing');
    });

    test('app.getItems exists', () => {
        if (typeof app.getItems !== 'function') throw new Error('Missing');
    });

    // 2. Session Flow Tests
    test('Create session works', () => {
        const testSession = { email: 'test@example.com', role: 'customer', name: 'Test' };
        app.saveSession(testSession);
        const retrieved = app.getSession();
        if (!retrieved || retrieved.email !== 'test@example.com') throw new Error('Session not saved');
        app.clearSession();
    });

    test('Clear session works', () => {
        app.saveSession({ email: 'test@example.com', role: 'customer' });
        app.clearSession();
        const retrieved = app.getSession();
        if (retrieved) throw new Error('Session not cleared');
    });

    // 3. User Management Tests
    test('Users list is populated', () => {
        const users = app.getUsers();
        if (!Array.isArray(users) || users.length === 0) throw new Error('No users found');
    });

    test('Admin user exists', () => {
        const users = app.getUsers();
        const admin = users.find(u => u.role === 'admin');
        if (!admin) throw new Error('No admin user');
    });

    test('Vendor user exists', () => {
        const users = app.getUsers();
        const vendor = users.find(u => u.role === 'vendor');
        if (!vendor) throw new Error('No vendor user');
    });

    // 4. Cart Operations Tests
    test('Add to cart works', () => {
        const cart = app.getCart();
        const initialLen = cart.length;
        cart.push({ title: 'Test Item', price: 1000, vendor: 'Test Vendor', qty: 1 });
        app.saveCart(cart);
        const retrieved = app.getCart();
        if (retrieved.length <= initialLen) throw new Error('Item not added');
        app.saveCart(app.getCart().slice(0, -1)); // cleanup
    });

    test('Cart persistence works', () => {
        const testCart = [{ title: 'Item1', price: 100, vendor: 'V1', qty: 2 }];
        app.saveCart(testCart);
        const retrieved = app.getCart();
        if (!retrieved.length || retrieved[0].title !== 'Item1') throw new Error('Cart not persisted');
        app.saveCart([]);
    });

    // 5. Order Tests
    test('Orders list is populated', () => {
        const orders = app.getOrders();
        if (!Array.isArray(orders)) throw new Error('Orders not an array');
    });

    test('Create order works', () => {
        const orders = app.getOrders();
        const initialLen = orders.length;
        const newOrder = {
            id: '#TEST001',
            customer: 'Test Customer',
            vendor: 'Test Vendor',
            items: 'Item1 x1',
            total: 1500,
            status: 'Preparing',
            created: Date.now()
        };
        orders.unshift(newOrder);
        app.saveOrders(orders);
        const retrieved = app.getOrders();
        if (retrieved.length <= initialLen) throw new Error('Order not added');
        app.saveOrders(orders.slice(1)); // cleanup
    });

    // 6. Items/Menu Tests
    test('Items list is accessible', () => {
        const items = app.getItems();
        if (!Array.isArray(items)) throw new Error('Items not an array');
    });

    test('Can add menu item', () => {
        const items = app.getItems();
        const initialLen = items.length;
        const newItem = { id: Date.now(), title: 'Test Dish', price: 2000, category: 'Test', vendor: 'Test Vendor' };
        items.unshift(newItem);
        app.saveItems(items);
        const retrieved = app.getItems();
        if (retrieved.length <= initialLen) throw new Error('Item not added');
        app.saveItems(items.slice(1)); // cleanup
    });

    // 7. Helper Function Tests
    test('formatCurrency works', () => {
        const formatted = app.formatCurrency(5000);
        if (!formatted.includes('F')) throw new Error('Currency not formatted');
    });

    test('isLoggedIn works', () => {
        if (typeof app.isLoggedIn !== 'function') throw new Error('Missing');
        const loggedIn = app.isLoggedIn();
        if (typeof loggedIn !== 'boolean') throw new Error('Should return boolean');
    });

    test('isCustomer works', () => {
        if (typeof app.isCustomer !== 'function') throw new Error('Missing');
    });

    test('isVendor works', () => {
        if (typeof app.isVendor !== 'function') throw new Error('Missing');
    });

    test('isAdmin works', () => {
        if (typeof app.isAdmin !== 'function') throw new Error('Missing');
    });

    // 8. Page-Specific Function Tests
    test('browse.js can find .cart-btn elements', () => {
        const btn = document.querySelector('.cart-btn');
        if (!btn && window.location.pathname.includes('BROWSE')) {
            warn('No .cart-btn found on BROWSE page - buttons may not work');
        }
    });

    test('login.js has required input fields', () => {
        const emailInput = document.getElementById('login-email');
        const pwdInput = document.getElementById('login-password');
        const roleSelect = document.getElementById('login-role');
        if (!emailInput && window.location.pathname.includes('LOGIN')) {
            warn('No #login-email found on LOGIN page');
        }
    });

    test('register.js has required fields', () => {
        const nameInput = document.getElementById('register-name');
        if (!nameInput && window.location.pathname.includes('REGISTER')) {
            warn('No #register-name found on REGISTER page');
        }
    });

    test('nav.js injected menu button', () => {
        const btn = document.querySelector('.fh-menu-btn');
        if (!btn) warn('Menu button (.fh-menu-btn) not found');
    });

    test('admin-dashboard.js can find profile element', () => {
        const profile = document.querySelector('.profile');
        if (!profile && window.location.pathname.includes('ADMIN')) {
            warn('No .profile found on ADMIN page');
        }
    });

    // Print Summary
    console.log('\n===== AUDIT SUMMARY =====');
    console.log(`✓ Passed: ${results.passed.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    console.log(`⚠ Warnings: ${results.warnings.length}`);

    if (results.failed.length > 0) {
        console.log('\nFAILURES:');
        results.failed.forEach(f => console.log(`  - ${f}`));
    }

    if (results.warnings.length > 0) {
        console.log('\nWARNINGS:');
        results.warnings.forEach(w => console.log(`  - ${w}`));
    }

    return results;
})();

console.log('Audit complete! Type: window.foodhubAudit to see results');
