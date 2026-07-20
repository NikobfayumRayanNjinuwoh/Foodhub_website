// Responsive navbar: inject a 'Menu' button that opens a slide-in sidebar on mobile
document.addEventListener('DOMContentLoaded', ()=>{
    const MOBILE_BREAK = 1024; // px (match CSS/CSS rule showing hamburger up to 1024)

    function createSidebar(navbar){
        // If sidebar already exists, reuse
        if(document.querySelector('.fh-sidebar')) return document.querySelector('.fh-sidebar');

        const sidebar = document.createElement('div'); sidebar.className = 'fh-sidebar';
        Object.assign(sidebar.style, {
            position: 'fixed', left: '-320px', top: '0', bottom: '0', width: '300px', maxWidth: '80%',
            background: '#fff', zIndex: 9999, boxShadow: '2px 0 12px rgba(0,0,0,0.15)', overflowY: 'auto',
            transition: 'left 0.28s ease', padding: '18px'
        });

        // close button
        const close = document.createElement('button'); close.className='fh-close'; close.textContent='✕';
        Object.assign(close.style, {position:'absolute', right:'10px', top:'8px', fontSize:'20px', border:'none', background:'transparent'});
        sidebar.appendChild(close);

        // container for nav content
        const content = document.createElement('div'); content.className = 'fh-sidebar-content';
        sidebar.appendChild(content);

        // overlay
        const overlay = document.createElement('div'); overlay.className = 'fh-overlay';
        Object.assign(overlay.style, {position:'fixed', inset:'0', background:'rgba(0,0,0,0.35)', zIndex:9998, opacity:0, transition:'opacity 0.25s ease', display:'none'});

        document.body.appendChild(sidebar);
        document.body.appendChild(overlay);

        function open(){ sidebar.style.left = '0'; overlay.style.display = 'block'; requestAnimationFrame(()=> overlay.style.opacity = '1'); document.body.style.overflow='hidden'; }
        function closeSidebar(){ sidebar.style.left = '-320px'; overlay.style.opacity = '0'; document.body.style.overflow=''; setTimeout(()=> overlay.style.display='none', 260); }

        close.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);

        return { sidebar, content, open, close: closeSidebar, overlay };
    }

    function initNav(){
        const nav = document.querySelector('.navbar'); if(!nav) return;

        // createMobileDropdown available to all handlers
        function createMobileDropdown(btn){
            // remove existing if any
            const existing = document.querySelector('.fh-mobile-dropdown');
            const existingOverlay = document.querySelector('.fh-mobile-overlay');
            if(existing){ existing.remove(); if(existingOverlay) existingOverlay.remove(); document.body.classList.remove('menu-open'); if(btn) { btn.setAttribute('aria-expanded','false'); btn.focus(); } return null; }

            const panel = document.createElement('div'); panel.className = 'fh-mobile-dropdown';
            // create overlay early so we can adjust its top when using sidebar-mode
            const overlay = document.createElement('div'); overlay.className='fh-mobile-overlay';
            Object.assign(overlay.style, {position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', zIndex:10000, opacity:0, transition:'opacity .25s ease'});
            // Use slide-in sidebar mode for tablets and phones so the menu doesn't cover the whole viewport
            const sidebarMode = window.innerWidth <= MOBILE_BREAK;
            if(sidebarMode){
                panel.classList.add('sidebar-mode');
                // compute top offset so the sidebar sits below the navbar (navbar may have different heights)
                const navHeight = (nav && nav.getBoundingClientRect && nav.getBoundingClientRect().height) || parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 56;
                const topOffset = Math.max(0, Math.round(navHeight + 6)); // add 6px gap
                // prefer a fixed pixel width with a responsive max-width so on very small devices
                // the sidebar shrinks instead of covering the full screen
                Object.assign(panel.style, {position:'fixed', left: '0px', top: topOffset + 'px', bottom: '0px', width: '320px', maxWidth: '85%', background:'#fff', boxShadow:'2px 0 18px rgba(0,0,0,0.12)', borderRadius:'0', zIndex:10001, overflow:'auto', padding:'18px'});
                // ensure overlay doesn't cover the navbar area visually (overlay z-index is lower than navbar)
                overlay.style.top = topOffset + 'px';
                overlay.style.bottom = '0';
            } else {
                const topPos = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 56;
                Object.assign(panel.style, {position:'fixed', left:0 + 'px', top: topPos + 'px', right: '0px', width: '100%', background:'#fff', boxShadow:'0 6px 18px rgba(0,0,0,0.12)', borderRadius:'8px', zIndex:10001, maxHeight:'72vh', overflow:'auto', padding:'10px'});
            }

            // (overlay already created above)

            // Build panel content by cloning existing nav sections so all links/actions are available
            const headerNav = nav.querySelector('.nav-center') || nav.querySelector('.nav-links') || nav.querySelector('nav') || nav;
            const actions = nav.querySelector('.nav-right');

            // header area (logo + close)
            const topBar = document.createElement('div'); topBar.className = 'fh-mobile-top';
            const logo = nav.querySelector('.logo') ? nav.querySelector('.logo').cloneNode(true) : null;
            if(logo){ topBar.appendChild(logo); }
            const closeBtn = document.createElement('button'); closeBtn.className='fh-close'; closeBtn.textContent='✕'; Object.assign(closeBtn.style, {marginLeft:'auto', fontSize:'20px', background:'transparent', border:'none', cursor:'pointer'});
            topBar.appendChild(closeBtn);
            panel.appendChild(topBar);

            // main nav clone
            if(headerNav){
                const navClone = headerNav.cloneNode(true);
                navClone.classList.add('fh-cloned-nav');
                panel.appendChild(navClone);
            }

            // actions clone (cart/login/signup)
            if(actions){
                const actionsClone = actions.cloneNode(true);
                actionsClone.classList.add('fh-cloned-actions');
                panel.appendChild(actionsClone);

                // Move the signup button under the Vendor link for better mobile layout
                try {
                    // find signup element inside cloned actions (could be <a><button class="signup-btn">..)</button></a>
                    const signupBtn = actionsClone.querySelector('.signup-btn');
                    let signupWrapper = null;
                    if(signupBtn){
                        // Prefer the anchor wrapper if present
                        signupWrapper = signupBtn.closest('a') || signupBtn.parentElement || signupBtn;
                    }

                    // find vendor link inside cloned nav
                    const navCloneEl = panel.querySelector('.fh-cloned-nav');
                    if(navCloneEl && signupWrapper){
                        const vendorLink = navCloneEl.querySelector('[data-i18n="nav.vendor"]') || Array.from(navCloneEl.querySelectorAll('a')).find(a=>/vendor/i.test((a.textContent||'').trim()));
                        // create a container for vendor + signup if vendor exists
                        if(vendorLink){
                            // move signup wrapper to be right after vendor link
                            vendorLink.insertAdjacentElement('afterend', signupWrapper);
                            // add helper class for styling
                            const wrap = document.createElement('div'); wrap.className = 'vendor-signup-mobile';
                            vendorLink.parentElement.insertBefore(wrap, signupWrapper);
                            wrap.appendChild(vendorLink);
                            wrap.appendChild(signupWrapper);
                        } else {
                            // fallback: put signup at top of cloned nav
                            navCloneEl.insertBefore(signupWrapper, navCloneEl.firstChild);
                            signupWrapper.classList.add('vendor-signup-mobile');
                        }
                    }
                } catch (e) { /* non-fatal */ }
            }

            document.body.appendChild(overlay);
            document.body.appendChild(panel);
            document.body.classList.add('menu-open');
            if(btn) btn.setAttribute('aria-expanded','true');
            requestAnimationFrame(()=>{ overlay.classList.add('visible'); if(panel.classList.contains('sidebar-mode')) panel.classList.add('open'); });

            // make dropdowns toggle inside cloned panel
            panel.querySelectorAll('.has-dropdown > a').forEach(a => {
                a.addEventListener('click', (e)=>{ e.preventDefault(); const parent = a.parentElement; parent.classList.toggle('open'); });
            });

            // ensure links in cloned actions have keyboard focus
            panel.querySelectorAll('a').forEach(a=> a.setAttribute('tabindex','0'));

            function remove(){
                document.body.classList.remove('menu-open');
                if(btn) { btn.setAttribute('aria-expanded','false'); }
                overlay.classList.remove('visible');
                if(panel.classList.contains('sidebar-mode')){ panel.classList.remove('open'); const onEnd = ()=>{ if(panel.parentNode) panel.remove(); if(overlay.parentNode) overlay.remove(); if(btn) btn.focus(); panel.removeEventListener('transitionend', onEnd); }; panel.addEventListener('transitionend', onEnd); setTimeout(()=>{ if(document.body.contains(panel)){ panel.remove(); overlay.remove(); if(btn) btn.focus(); } }, 420); }
                else { setTimeout(()=>{ if(overlay.parentNode) overlay.remove(); if(panel.parentNode) panel.remove(); if(btn) btn.focus(); }, 300); }
                document.removeEventListener('keydown', keyHandler);
            }
            function keyHandler(e){ if(e.key === 'Escape' || e.key === 'Esc'){ remove(); } }
            document.addEventListener('keydown', keyHandler);
            overlay.addEventListener('click', remove);
            closeBtn.addEventListener('click', remove);

            // Close panel when user clicks a navigation link so the new page can load
            panel.addEventListener('click', (e) => {
                const a = e.target.closest('a');
                if(!a) return;
                const href = a.getAttribute('href');
                // ignore anchors that are just JS handlers or hashes
                if(!href || href.startsWith('javascript:') || href.startsWith('#')) return;
                // allow data attribute to prevent auto-close if needed
                if(a.hasAttribute('data-no-close')) return;
                // close then let navigation proceed
                remove();
            });
            // focus first interactive element
            setTimeout(()=>{ const first = panel.querySelector('a,button'); if(first) first.focus(); }, 50);
            return { panel, overlay, remove };
        }

        // session-aware UI: show cart only to logged-in customers and update login/logout
        const SESSION_KEY = 'fh_session_v1';
        function getSession(){ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)); }catch(e){return null;} }
        const session = getSession();
        const isCustomer = session && session.role && (session.role.toLowerCase() === 'customer');
        // hide cart links when not a logged-in customer
        document.querySelectorAll('.cart-link, .cart, .cart-count, .cart-badge, a[href*="CART"]').forEach(el => {
            if(!isCustomer) el.style.display = 'none'; else el.style.display = '';
        });

        // replace login link/button with a logout action when session exists
        if(session){
            const loginEl = nav.querySelector('.login-btn');
            const logoutBtn = document.createElement('button'); logoutBtn.className = 'login-btn'; logoutBtn.textContent = 'Log Out';
            logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem(SESSION_KEY); window.location.href = 'LOGIN.html'; });
            if(loginEl){
                // preserve parent wrapper (anchor) if present
                const wrapper = loginEl.closest('a') || loginEl.parentElement;
                if(wrapper && wrapper.parentElement) wrapper.parentElement.replaceChild(logoutBtn, wrapper);
                else loginEl.parentElement.replaceChild(logoutBtn, loginEl);
            } else {
                const right = nav.querySelector('.nav-right'); if(right) right.appendChild(logoutBtn);
            }
        }

        // ensure a Menu button exists (or use existing one) and attach handler
        let btn = nav.querySelector('.fh-menu-btn');
        if(!btn){
            btn = document.createElement('button'); btn.className='fh-menu-btn';
            // hamburger SVG icon
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            btn.setAttribute('aria-label','Open menu');
            btn.setAttribute('title','Menu');
            Object.assign(btn.style, {fontSize:'16px', padding:'8px', marginRight:'8px', background:'transparent', border:'none', cursor:'pointer'});
            const holder = nav.querySelector('.nav-left') || nav.querySelector('.nav-actions') || nav;
            // insert at the left so it's visible on small screens
            holder.insertBefore(btn, holder.firstChild);
        }

        // ensure the button behaves like a button (prevents accidental form submit)
        try{ btn.setAttribute('type','button'); }catch(e){}

        // make the menu button reliably open the mobile panel across pages and devices
        function handleMenuClick(evBtn){
            // If a panel already exists, this will toggle/close it via createMobileDropdown
            createMobileDropdown(evBtn);
        }

        // attach click and keyboard handlers (idempotent)
        btn.addEventListener('click', ()=> handleMenuClick(btn));
        btn.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleMenuClick(btn); } });

        // Also support delegated clicks (in case other pages render the button differently)
        document.addEventListener('click', (e)=>{
            const d = e.target.closest && e.target.closest('.fh-menu-btn');
            if(d && d !== btn){ try{ d.setAttribute('type','button'); }catch(e){} handleMenuClick(d); }
        });

        // Desktop/tablet dropdown toggles: allow click to open .has-dropdown menus and close when clicking outside
        const dropdownAnchors = nav.querySelectorAll('.has-dropdown > a');
        dropdownAnchors.forEach(a=>{
            a.addEventListener('click', (e)=>{
                // toggle open class
                const parent = a.parentElement;
                parent.classList.toggle('open');
                e.preventDefault();
            });
            // keyboard support
            a.addEventListener('keydown', (e)=>{
                if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); a.click(); }
            });
        });

        // close dropdowns when clicking outside
        document.addEventListener('click', (e)=>{
            if(e.target.closest('.has-dropdown')) return; // clicked inside a dropdown
            nav.querySelectorAll('.has-dropdown.open').forEach(el=> el.classList.remove('open'));
        });
    }

    initNav();
    window.addEventListener('resize', ()=>{
        // remove sidebar display if not mobile
        if(window.innerWidth > MOBILE_BREAK){
            const s = document.querySelector('.fh-sidebar'); const o = document.querySelector('.fh-overlay');
            if(s) s.style.left = '-320px'; if(o) { o.style.opacity = '0'; setTimeout(()=> o.style.display='none',260); }
            document.body.style.overflow = '';
        }
    });
});
