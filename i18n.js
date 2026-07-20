// Simple i18n for the static site. Supports 'en' and 'fr'.
document.addEventListener('DOMContentLoaded', ()=>{
    const LANG_KEY = 'fh_lang_v1';
    const supported = ['en','fr'];
    let current = localStorage.getItem(LANG_KEY) || 'en';

    // Base translations. You can register more via window.i18n.registerTranslations
    const translations = {
        en: {
            'nav.home':'Home', 'nav.browse':'Browse', 'nav.vendor':'Vendor', 'nav.login':'Log In', 'nav.signup':'Vendor Sign Up',
            'cart.your':'Your Cart', 'cart.items':'{n} items in your cart', 'order.subtotal':'Subtotal', 'order.delivery':'Delivery Fee', 'order.total':'Total', 'btn.place':'Place Order', 'btn.continue':'← Continue Shopping',
            'login.email':'Email', 'login.password':'Password', 'login.role':'Sign in as', 'register.create':'Create Account'
        },
        fr: {
            'nav.home':'Accueil', 'nav.browse':'Parcourir', 'nav.vendor':'Vendeur', 'nav.login':'Se connecter', 'nav.signup':'Inscription Vendeur',
            'cart.your':'Votre Panier', 'cart.items':'{n} articles dans votre panier', 'order.subtotal':'Sous-total', 'order.delivery':'Frais de livraison', 'order.total':'Total', 'btn.place':'Passer la commande', 'btn.continue':'← Continuer vos achats',
            'login.email':'Email', 'login.password':'Mot de passe', 'login.role':'Se connecter en tant que', 'register.create':'Créer un compte'
        }
    };

    function ensureSelector(){
        if(document.querySelector('#fh-lang-select')) return;
    const select = document.createElement('select'); select.id='fh-lang-select'; select.className='fh-lang-select'; select.setAttribute('aria-label','Select language');
        supported.forEach(l=>{ const o = document.createElement('option'); o.value=l; o.textContent = l.toUpperCase(); select.appendChild(o); });
        select.value = current;
        select.addEventListener('change', ()=> setLang(select.value));
        const target = document.querySelector('.nav-actions') || document.querySelector('.nav-right') || document.querySelector('.nav-left');
        if(target) target.appendChild(select);
    }

    function translateNode(node, lang){
        if(!node || node.nodeType !== Node.ELEMENT_NODE) return;
        // translate elements with data-i18n
        if(node.hasAttribute('data-i18n')){
            const key = node.getAttribute('data-i18n');
            const map = translations[lang] || translations['en'];
            let text = map[key] || node.textContent;
            if(text && text.includes('{n}')){
                const n = node.getAttribute('data-count') || node.dataset.count || '';
                text = text.replace('{n}', n);
            }
            node.textContent = text;
        }
        // translate placeholders
        if(node.hasAttribute('data-i18n-placeholder')){
            const key = node.getAttribute('data-i18n-placeholder');
            const map = translations[lang] || translations['en'];
            node.placeholder = map[key] || node.placeholder || '';
        }
    }

    function translateAll(lang){
        const map = translations[lang] || translations['en'];
        document.querySelectorAll('[data-i18n]').forEach(el=> translateNode(el, lang));
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el=> translateNode(el, lang));
        const sel = document.querySelector('#fh-lang-select'); if(sel) sel.value = lang;
    }

    function setLang(lang){ if(!supported.includes(lang)) lang = 'en'; current = lang; localStorage.setItem(LANG_KEY, lang); translateAll(lang); }

    // MutationObserver: translate new nodes added later (for content from backend)
    const mo = new MutationObserver((mutations)=>{
        mutations.forEach(m=>{
            m.addedNodes && m.addedNodes.forEach(n=>{
                if(n.nodeType !== Node.ELEMENT_NODE) return;
                if(n.hasAttribute && (n.hasAttribute('data-i18n') || n.querySelectorAll('[data-i18n]').length)){
                    // translate the node and its children
                    translateNode(n, current);
                    n.querySelectorAll('[data-i18n]').forEach(el=> translateNode(el, current));
                }
            });
        });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Public API: allow registering more translations and programmatic translate
    window.i18n = {
        current: () => current,
        setLang,
        registerTranslations: (lang, map) => { translations[lang] = Object.assign({}, translations[lang]||{}, map); },
        translateElement: (el) => translateNode(el, current)
    };

    ensureSelector(); translateAll(current);
});
