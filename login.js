document.addEventListener('DOMContentLoaded', ()=>{
    const container = document.querySelector('.login-card') || document;
    const loginBtn = container.querySelector('.login-btn');
    const pwdToggle = container.querySelector('.eye') || document.querySelector('.eye');
    const emailInput = document.getElementById('login-email');
    const pwdInput = document.getElementById('login-password');
    const roleSelect = document.getElementById('login-role');
    const app = window.FoodHubApp;
    const params = new URLSearchParams(window.location.search);
    const requestedRole = params.get('role');

    if (requestedRole && roleSelect) {
        roleSelect.value = requestedRole;
    }

    pwdToggle?.addEventListener('click', ()=>{
        if(pwdInput.type === 'password'){ pwdInput.type = 'text'; pwdToggle.textContent = '🙈'; }
        else { pwdInput.type = 'password'; pwdToggle.textContent = '👁'; }
    });

    function doLogin(){
        const email = app.sanitizeText(emailInput?.value || '', '').toLowerCase();
        const pwd = app.sanitizeText(pwdInput?.value || '', '');
        const requestedRole = app.normalizeRole(roleSelect?.value || 'customer');
        if(!email || !pwd){ alert('Please enter email and password'); return; }

        const users = app.getUsers();
        const match = users.find(user => user.email.toLowerCase() === email.toLowerCase());
        if(!match || !app.verifyPassword(pwd, match.password)){
            alert('Invalid email/password.');
            return;
        }

        const effectiveRole = app.normalizeRole(match.role || requestedRole);
        const session = { email, role: effectiveRole, name: match.name || match.vendorName || 'User', created: Date.now() };
        app.saveSession(session);
        loginBtn.disabled = true; loginBtn.textContent = 'Signing in...';
        setTimeout(()=>{
            if(effectiveRole === 'vendor') window.location.href = 'VENDOR-DASHBOARD.html';
            else if(effectiveRole === 'admin') window.location.href = 'ADMIN-DASH.html';
            else window.location.href = 'INDEX.html';
        }, 250);
    }

    loginBtn?.addEventListener('click', doLogin);
    [emailInput, pwdInput].forEach(inp => inp && inp.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') doLogin(); }));
});
