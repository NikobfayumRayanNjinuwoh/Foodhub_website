Security & Logic Report — FoodHub (snapshot: 2026-07-17)

Summary
- Performed a full frontend review and automated flow tests for the client-only FoodHub codebase.
- Implemented input sanitization, basic password hashing, media validation, and safer session normalization.
- Ran unit and flow tests that simulate register/login/add-item/add-to-cart/place-order; all passed locally.
- Started a local HTTP server and exercised primary pages (INDEX, LOGIN, BROWSE, CART, VENDOR pages).

Files changed (high level)
- `JS-files/app-state.js` — added `sanitizeText`, `escapeHtml`, `hashPassword`, `verifyPassword`, `sanitizeMediaValue`, normalized session and user handling, safe storage helpers.
- `JS-files/register.js` — added input validation, email regex, password hashing before storage, sanitized inputs.
- `JS-files/login.js` — uses `verifyPassword`, normalizes role and email, rejects invalid creds safely.
- `JS-files/browse.js`, `JS-files/cart.js`, `JS-files/vendor-add.js`, `JS-files/index.js`, `JS-files/admin-dashboard.js`, `JS-files/VENDOR-DASHBOARD.JS` — applied output encoding (`escapeHtml`) and media sanitization where rendering user-controlled content.
- Various test harnesses added in `tests/` and a small Node static server used for smoke checks.

Automated tests run
- `node tests/app-state.test.js` — verifies `escapeHtml`, `hashPassword`, `verifyPassword` utilities. Passed.
- `node tests/flows.test.js` — simulates user register/login, malicious item upload, cart/order flow, checks media sanitization and order persistence. Passed.
- HTTP smoke test: fetched main pages on `http://127.0.0.1:8000` — returned 200 for critical pages.

Remaining issues & recommended server-side mitigations (high priority)
1. Do not rely solely on client-side security. Move auth, user data, items, orders, and file uploads to a server-side API with proper authentication (bcrypt/argon2) and server-side validation.
2. Replace localStorage session with secure, HttpOnly cookie sessions on the server. LocalStorage is accessible to XSS and should not hold authentication tokens.
3. Use strong password hashing (bcrypt/argon2) server-side; current client-side hash is a weak FNV-style mix used only to avoid plaintext storage.
4. Validate and scan uploaded files server-side. Client-side file-type/size checks are convenience only. Store files outside webroot or use signed URLs.
5. Enforce CSP, secure headers (HSTS, X-Content-Type-Options, X-Frame-Options), and enable CORS correctly on the server.
6. Protect endpoints with rate-limiting, account lockouts, and logging/monitoring of suspicious activity.
7. Sanitize and validate all user inputs server-side, especially fields that will be rendered in HTML or used in database queries. Use parameterized DB queries to prevent injection.
8. Implement CSRF protection for any state-changing operations if cookies are used.

Medium/Lower priority recommendations
- Remove or reconcile duplicate JS files under `css/` folder (they appear unused but may confuse maintainers).
- Use a proper build step and consistent filenames (avoid uppercase `.JS` vs `.js`).
- Add automatic tests using a headless browser (Puppeteer) for E2E flows and accessibility checks.
- Add Content Security Policy to reduce XSS impact.

How to reproduce my local checks
1. Start the simple Node server (already used during testing):

```powershell
node -e "const http=require('http'); const fs=require('fs'); const path=require('path'); const root=process.cwd(); const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.gif':'image/gif','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm'}; http.createServer((req,res)=>{let reqPath=req.url==='/'?'/INDEX.html':req.url; reqPath=decodeURIComponent(reqPath.split('?')[0]); const safePath=path.normalize(reqPath).replace(/^\.+/, ''); const filePath=path.join(root, safePath); fs.readFile(filePath,(err,data)=>{ if(err||!fs.existsSync(filePath)){ res.writeHead(404,{'Content-Type':'text/plain'}); res.end('Not found'); return;} const ext=path.extname(filePath).toLowerCase(); res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'}); res.end(data);});}).listen(8000, '127.0.0.1', ()=>console.log('Serving on http://127.0.0.1:8000'))"
```

2. Run tests:

```powershell
node tests/app-state.test.js
node tests/flows.test.js
```

Final notes
- The codebase is now safer client-side and tested for the main flows. However, security requires server-side enforcement. The changes made are defensive and reduce XSS and unsanitized data exposure, but they are not a substitute for proper backend controls.

If you want, I can:
- Implement a minimal Node/Express backend with endpoints for auth, items, uploads (with bcrypt and file validation) and migrate localStorage to API calls; or
- Add Puppeteer E2E tests to fully automate browser flows; or
- Create a PR and commit these changes to git (if you want me to commit).


