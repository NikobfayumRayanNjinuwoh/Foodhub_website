// JS for INDEX.html - update cart badge and simple CTA wiring
document.addEventListener('DOMContentLoaded', () => {
    const CART_KEY = 'fh_cart_v1';
    const cartBadge = document.querySelector('.cart-badge') || document.querySelector('.cart-badge');
    const app = window.FoodHubApp;

    const ADS_KEY = 'fh_ads_v1';

    function getCart() {
        try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e){ return []; }
    }

    function updateCartBadge() {
        const cart = getCart();
        const count = cart.reduce((s,i)=>s + (i.qty||1), 0);
        const badgeEls = document.querySelectorAll('.cart-badge, .cart .cart-badge, .cart-badge');
        badgeEls.forEach(el => el.textContent = count);
    }

    // Render hero ads (image or video) if any
    function renderHeroAds(){
        const ads = JSON.parse(localStorage.getItem(ADS_KEY) || '[]');
        if(!ads.length) return;
        const heroImage = document.querySelector('.hero-image');
        if(!heroImage) return;
        // use the first ad
        const ad = ads[0];
        const safeMedia = app.sanitizeMediaValue(ad.media, '');
        heroImage.innerHTML = '';
        if(ad.mediaType === 'video' && safeMedia){
            const v = document.createElement('video'); v.src = safeMedia; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true; v.style.maxWidth='100%';
            heroImage.appendChild(v);
        } else if(safeMedia) {
            const img = document.createElement('img'); img.src = safeMedia; img.alt = 'Hero Ad'; img.style.maxWidth='100%';
            heroImage.appendChild(img);
        }
        // keep existing delivery badge if present
        const badge = document.createElement('div'); badge.className='delivery-badge'; badge.innerHTML='🚚 Fast Delivery <br><span>Under 30 minutes</span>';
        heroImage.appendChild(badge);
    }

    renderHeroAds();

    // CTA buttons already link in HTML; just keep badge updated
    updateCartBadge();
});
