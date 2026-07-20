// JS for CART.html - cart rendering, quantity, totals, payment selection, place order
document.addEventListener('DOMContentLoaded', () => {
    const app = window.FoodHubApp;

    // Redirect if not logged in
    const session = app.getSession();
    if (!session || (session.role && session.role.toLowerCase() !== 'customer')) {
        alert('Please log in to view your cart.');
        window.location.href = 'LOGIN.html';
        return;
    }

    const cartCountEl = document.querySelector('.cart-count');
    const itemsCountEl = document.querySelector('.items-count');
    const cartLeft = document.querySelector('.cart-left');
    const subtotalEl = document.querySelector('.summary-row:nth-of-type(1) span:last-child');
    const deliveryEl = document.querySelectorAll('.summary-row span:last-child')[1];
    const totalEl = document.querySelector('.summary-row.total span:last-child');
    const placeBtn = document.querySelector('.place-order');
    const continueEl = document.querySelector('.continue');

    const DELIVERY_FEE = 500;

    function format(n){ return n.toLocaleString() + ' F'; }

    function render(){
        const cart = app.getCart();
        // update cart count
        const totalQty = cart.reduce((s,i)=>s + (i.qty||1),0);
        if(cartCountEl) cartCountEl.textContent = totalQty;
        if(itemsCountEl){
            // set data-count for i18n substitution and default visible text
            itemsCountEl.setAttribute('data-count', totalQty);
            itemsCountEl.textContent = `${totalQty} items in your cart`;
        }

        // clear existing items except headings
        // Rebuild left column items
        const left = document.querySelector('.cart-left');
        if(!left) return;

        // remove existing rendered cart-item elements (keep the heading and items-count)
        const existing = left.querySelectorAll('.cart-item');
        existing.forEach(e=>e.remove());

        cart.forEach(item=>{
            const node = document.createElement('div'); node.className='cart-item';
            const safeImage = app.sanitizeMediaValue(item.image, 'images/placeholder.jpg');
            const safeTitle = app.escapeHtml(item.title || 'Item');
            const safeVendor = app.escapeHtml(item.vendor || 'FoodHub');
            const safeLabel = app.escapeHtml(item.title || 'item');
            node.innerHTML = `
                <img src="${safeImage}" alt="">
                <div class="item-details">
                    <h3>${safeTitle}</h3>
                    <p>by ${safeVendor}</p>
                    <div class="quantity">
                        <button class="dec">-</button>
                        <span class="qty">${item.qty||1}</span>
                        <button class="inc">+</button>
                    </div>
                </div>
                <div class="item-price">${format(item.price)}</div>
                <div class="item-actions">
                    <button class="remove-btn" aria-label="Remove ${safeLabel}">Remove</button>
                </div>
            `;
            left.appendChild(node);

            node.querySelector('.inc').addEventListener('click', ()=>{
                item.qty = (item.qty||1) + 1; app.saveCart(cart); render();
            });
            node.querySelector('.dec').addEventListener('click', ()=>{
                item.qty = (item.qty||1) - 1;
                if(item.qty <= 0){ const idx = cart.indexOf(item); if(idx>=0) cart.splice(idx,1); }
                app.saveCart(cart); render();
            });
            node.querySelector('.remove-btn')?.addEventListener('click', ()=>{
                const idx = cart.indexOf(item);
                if(idx >= 0){ cart.splice(idx,1); app.saveCart(cart); render(); }
            });
        });

        // totals
        const subtotal = cart.reduce((s,i)=> s + (i.price*(i.qty||1)), 0);
        if(subtotalEl) subtotalEl.textContent = format(subtotal);
        if(deliveryEl) deliveryEl.textContent = format(DELIVERY_FEE);
        if(totalEl) totalEl.textContent = format(subtotal + DELIVERY_FEE);
    }

    placeBtn?.addEventListener('click', ()=>{
        const cart = app.getCart();
        if(!cart.length){ alert('Your cart is empty'); return; }
        if(!session){ alert('Session expired. Please log in again.'); window.location.href = 'LOGIN.html'; return; }
        const payment = document.querySelector('input[name="payment-method"]:checked')?.value;
        if(!payment){ alert('Please select a payment method'); return; }

        const order = {
            id: '#' + (Date.now()%1000000),
            customer: session?.name || session?.email || 'Guest',
            customerEmail: session?.email || '',
            vendor: cart[0].vendor || 'FoodHub',
            items: cart.map(i => `${i.title} x${i.qty||1}`).join(', '),
            total: cart.reduce((s,i)=> s + (i.price*(i.qty||1)),0) + DELIVERY_FEE,
            paymentMethod: payment,
            status: 'Preparing',
            created: Date.now()
        };
        const orders = app.getOrders();
        orders.unshift(order);
        app.saveOrders(orders);

        app.saveCart([]);
        render();
        alert('Order placed — ' + order.id);
        window.location.href = 'INDEX.html';
    });

    // payment radio change -> toggle .selected class
    document.querySelectorAll('input[name="payment-method"]').forEach(radio=>{
        radio.addEventListener('change', ()=>{
            document.querySelectorAll('.payment').forEach(p=> p.classList.remove('selected'));
            const sel = document.querySelector('input[name="payment-method"]:checked');
            if(sel){
                const paymentEl = sel.closest('.payment');
                if(paymentEl) paymentEl.classList.add('selected');
            }
        });
    });

    continueEl?.addEventListener('click', ()=> window.location.href = 'BROWSE.html');

    render();
});
