// JS for BROWSE.html - search, category filter, add to cart
document.addEventListener('DOMContentLoaded', () => {
    const app = window.FoodHubApp;
    const escapeHtml = app.escapeHtml || ((value) => String(value == null ? '' : value));
    function updateCartBadge(){
        const cart = app.getCart();
        const count = cart.reduce((s,i)=>s + (i.qty||1), 0);
        document.querySelectorAll('.cart-count, .cart-badge').forEach(el => el.textContent = count);
    }

    // shared add-to-cart logic for a button
    function addToCartFromButton(btn){
        const session = app.getSession();
        if(!session || (session.role && session.role.toLowerCase() !== 'customer')){
            alert('Please log in or create an account to shop.');
            window.location.href = 'LOGIN.html';
            return;
        }

        const card = btn.closest('.card');
        if(!card) return;
        const titleEl = card.querySelector('h3');
        const title = app.sanitizeText(titleEl ? titleEl.textContent : (card.dataset.title || 'Item'), 'Item');
        const priceText = card.querySelector('.price')?.textContent || card.dataset.price || '';
        const price = Number(String(priceText).replace(/[^0-9.-]+/g,'')) || Number(card.dataset.price) || 0;
        const vendor = app.sanitizeText(card.querySelector('.vendor')?.textContent.replace(/^by\s*/i,'').trim() || card.dataset.vendor || '', 'FoodHub');

        const cart = app.getCart();
        const existing = cart.find(i => i.title === title && i.vendor === vendor && i.price === price);
        if(existing){ existing.qty = (existing.qty||1) + 1; } else { cart.push({ title, price, vendor, qty: 1, image: card.dataset.media || null }); }
        app.saveCart(cart);
        updateCartBadge();
        const original = btn.textContent;
        btn.textContent = 'Added';
        setTimeout(()=> btn.textContent = original || '🛒',800);
    }

    // bind existing buttons (for dynamic render) but also use delegation for all cards
    function bindAddToCart(container){
        container.querySelectorAll('.cart-btn').forEach(btn => btn.removeEventListener('click', addToCartFromButton));
        container.querySelectorAll('.cart-btn').forEach(btn => btn.addEventListener('click', ()=> addToCartFromButton(btn)));
    }

    // Category filter
    const cats = Array.from(document.querySelectorAll('.cat'));
    cats.forEach(btn => btn.addEventListener('click', () => {
        cats.forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.textContent.trim().replace(/[^\w]/g,'');
        const cards = Array.from(document.querySelectorAll('.food-grid .card'));
        if(/All/i.test(btn.textContent)){
            cards.forEach(c=>c.style.display='');
            return;
        }
        cards.forEach(c=>{
            const badge = c.querySelector('.badge')?.textContent||'';
            c.style.display = (badge.toLowerCase().includes(cat.toLowerCase())) ? '' : 'none';
        });
    }));

    // Search
    const search = document.querySelector('.search');
    search?.addEventListener('input', ()=>{
        const q = search.value.trim().toLowerCase();
        document.querySelectorAll('.food-grid .card').forEach(c=>{
            const title = c.querySelector('h3')?.textContent.toLowerCase()||'';
            const vendor = c.querySelector('.vendor')?.textContent.toLowerCase()||'';
            c.style.display = (title.includes(q) || vendor.includes(q)) ? '' : 'none';
        });
    });

    updateCartBadge();

    // event delegation on the grid so static cards work too
    const gridContainer = document.querySelector('.food-grid');
    if(gridContainer){
        gridContainer.addEventListener('click', (e)=>{
            const btn = e.target.closest('.cart-btn');
            if(btn && gridContainer.contains(btn)) addToCartFromButton(btn);
        });
    }

    // Render dynamic items saved by vendors
    function renderDynamicItems(){
        const items = app.getItems();
        const grid = document.querySelector('.food-grid');
        if(!grid || !items.length) return;
        // prepend dynamic items
        items.forEach(item => {
            const card = document.createElement('div'); card.className='card';
            card.dataset.price = item.price;
            card.dataset.vendor = item.vendor;
            if(item.media) card.dataset.media = item.media;
            const safeMedia = app.sanitizeMediaValue(item.media, '');
            const safeCategory = escapeHtml(item.category || '');
            const safeTitle = escapeHtml(item.title || 'Untitled Item');
            const safeVendor = escapeHtml(item.vendor || 'FoodHub');
            const safePrice = escapeHtml(item.price || 0);
            card.innerHTML = `
                ${safeCategory ? `<span class="badge">${safeCategory}</span>` : ''}
                ${safeMedia ? (item.mediaType === 'video' ? `<video src="${safeMedia}" muted loop playsinline></video>` : `<img src="${safeMedia}" alt="">`) : ''}
                <div class="card-body">
                    <div class="card-title-price">
                        <h3>${safeTitle}</h3>
                        <span class="price">${safePrice} F</span>
                    </div>
                    <p class="vendor">by ${safeVendor}</p>
                    <div class="card-meta">
                        <span>⭐ 0</span>
                        <span>⏱ 30 min</span>
                        <button class="cart-btn">🛒</button>
                    </div>
                </div>
            `;
            grid.insertBefore(card, grid.firstChild);
        });
        bindAddToCart(grid);
    }
    renderDynamicItems();
});
