document.addEventListener('DOMContentLoaded', ()=>{
    const pwdToggle = document.querySelector('.fa-eye.toggle') || document.querySelector('.toggle');
    const pwdInput = document.getElementById('register-password');
    const nameInput = document.getElementById('register-name');
    const emailInput = document.getElementById('register-email');
    const createBtn = document.querySelector('.create-btn');
    const app = window.FoodHubApp;

    function getSelectedRole(){ const sel = document.querySelector('input[name="register-role"]:checked'); return sel ? sel.value : 'customer'; }
    let selected = getSelectedRole();

    document.querySelectorAll('input[name="register-role"]').forEach(r => r.addEventListener('change', ()=>{
        selected = getSelectedRole();
        const heading = document.getElementById('register-heading');
        const btn = document.querySelector('.create-btn');
        if(heading) heading.textContent = selected === 'vendor' ? 'Create Vendor Account' : 'Create Account';
        if(btn) btn.textContent = selected === 'vendor' ? 'Create Vendor Account' : 'Create Account';
    }));

    pwdToggle?.addEventListener('click', ()=>{
        if(pwdInput.type === 'password'){ pwdInput.type = 'text'; pwdToggle.classList.add('open'); }
        else { pwdInput.type = 'password'; pwdToggle.classList.remove('open'); }
    });

    createBtn?.addEventListener('click', ()=>{
        const name = app.sanitizeText(nameInput?.value || '', '');
        const email = app.sanitizeText(emailInput?.value || '', '').toLowerCase();
        const pwd = app.sanitizeText(pwdInput?.value || '', '');
        const role = app.normalizeRole(selected === 'vendor' ? 'vendor' : 'customer');
        if(!name || !email || !pwd){ alert('Please fill name, email and password'); return; }
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ alert('Please enter a valid email address'); return; }
        if(pwd.length < 6){ alert('Password must be at least 6 characters'); return; }

        const users = app.getUsers();
        if(users.some(user => user.email.toLowerCase() === email.toLowerCase())){ alert('An account with this email already exists'); return; }

        const account = { id: Date.now().toString(), name, email, password: app.hashPassword(pwd), role, approved: role === 'vendor' ? false : true, created: Date.now() };
        users.push(account);
        app.saveUsers(users);
        app.saveSession({ email, name, role, created: Date.now() });

        if(role === 'vendor') window.location.href = 'VENDOR-DASHBOARD.html';
        else window.location.href = 'INDEX.html';
    });
});
