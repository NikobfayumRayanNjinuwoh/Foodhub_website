// Allow vendor to add items and hero ads (image/video) stored in localStorage
document.addEventListener('DOMContentLoaded', ()=>{
    const app = window.FoodHubApp;
    const session = app.getSession();
    if(!session || session.role !== 'vendor'){
        alert('Please sign in as a vendor to add items.');
        window.location.href = 'LOGIN.html';
        return;
    }

    const titleEl = document.getElementById('item-title');
    const priceEl = document.getElementById('item-price');
    const catEl = document.getElementById('item-category');
    const vendorEl = document.getElementById('item-vendor');
    const mediaEl = document.getElementById('media');
    const saveBtn = document.getElementById('save-item');

    saveBtn?.addEventListener('click', ()=>{
        const title = app.sanitizeText(titleEl?.value || '', '');
        const price = Number(priceEl?.value) || 0;
        const category = app.sanitizeText(catEl?.value || '', 'General');
        const vendor = app.sanitizeText(vendorEl?.value || '', 'Unknown Vendor');
        if(!title || !price){ alert('Please provide title and price'); return; }
        if(price <= 0 || price > 500000){ alert('Price must be between 1 and 500,000'); return; }

        const file = mediaEl?.files && mediaEl.files[0];
        if(file){
            const allowedTypes = ['image/jpeg','image/png','image/webp','image/jpg','video/mp4','video/webm'];
            const maxSize = 2 * 1024 * 1024;
            if(!allowedTypes.includes(file.type)){
                alert('Only JPG, PNG, WEBP, and MP4/WEBM files are allowed.');
                return;
            }
            if(file.size > maxSize){
                alert('File size must be 2MB or less.');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const data = reader.result; // base64
                const isVideo = file.type.startsWith('video/');
                const item = { id: Date.now(), title, price, category, vendor: session.name || vendor || 'Vendor', media: app.sanitizeMediaValue(data, ''), mediaType: isVideo? 'video':'image' };
                const items = app.getItems(); items.unshift(item); app.saveItems(items);
                // if vendor wants this to be a hero ad, also add to ads
                if(confirm('Make this a hero ad (show on homepage)?')){
                    const ads = app.getAds(); ads.unshift({ id: Date.now(), media: item.media, mediaType: isVideo? 'video':'image' }); app.saveAds(ads);
                }
                alert('Item saved'); window.location.href = 'VENDOR-DASHBOARD.html';
            };
            reader.onerror = () => {
                alert('Unable to read the selected file.');
            };
            reader.readAsDataURL(file);
        } else {
            const item = { id: Date.now(), title, price, category, vendor: session.name || vendor || 'Vendor' };
            const items = app.getItems(); items.unshift(item); app.saveItems(items);
            alert('Item saved'); window.location.href = 'VENDOR-DASHBOARD.html';
        }
    });
});
