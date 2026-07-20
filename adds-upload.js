// JS for ADDS-Upload.html
document.addEventListener('DOMContentLoaded', () => {
    const ADS_KEY = 'fh_ads_v1';

    const vendorNameInput = document.getElementById('vendor-name');
    const videoSourceInput = document.getElementById('video-source');
    const fileInput = document.getElementById('file-upload');
    const chooseFileBtn = document.querySelector('.choose-btn');
    const fileLabel = document.querySelector('.file-label');
    const submitBtn = document.querySelector('.submit-action-btn');

    chooseFileBtn?.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            if(fileLabel) fileLabel.textContent = fileInput.files[0].name;
            if(videoSourceInput) videoSourceInput.value = ''; // Clear URL if file is chosen
        } else {
            if(fileLabel) fileLabel.textContent = 'No file chosen';
        }
    });

    function getAds() { return JSON.parse(localStorage.getItem(ADS_KEY) || '[]'); }
    function saveAds(ads) { localStorage.setItem(ADS_KEY, JSON.stringify(ads)); }

    submitBtn?.addEventListener('click', () => {
        const vendorName = (vendorNameInput?.value || '').trim();
        const videoUrl = (videoSourceInput?.value || '').trim();
        const file = fileInput.files[0];

        if (!vendorName) {
            alert('Please enter a vendor name.');
            return;
        }

        if (!videoUrl && !file) {
            alert('Please provide a video source URL or upload a file.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        // Priority to uploaded file
        if (file) {
            const allowedTypes = ['image/jpeg','image/png','image/webp','image/jpg','video/mp4','video/webm'];
            const maxSize = 2 * 1024 * 1024;
            if(!allowedTypes.includes(file.type)){
                alert('Only JPG, PNG, WEBP, MP4, or WEBM files are allowed.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add to Ads Section';
                return;
            }
            if(file.size > maxSize){
                alert('File size must be 2MB or less.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add to Ads Section';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                const data = reader.result; // base64
                const isVideo = file.type.startsWith('video/');
                const newAd = { id: Date.now(), vendor: vendorName, media: data, mediaType: isVideo ? 'video' : 'image' };
                const ads = getAds();
                ads.unshift(newAd); // Add to the beginning
                saveAds(ads);
                alert('Advertisement added successfully!');
                window.location.href = 'ADMIN-DASH.html';
            };
            reader.onerror = () => {
                alert('Error reading file.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add to Ads Section';
            };
            reader.readAsDataURL(file);
        } else { // Use URL
            const isVideo = /\.(mp4|webm|mov)$/i.test(videoUrl);
            if(!/^https?:\/\//i.test(videoUrl) && !videoUrl.startsWith('data:')){
                alert('Only HTTP(S) or data URLs are allowed.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Add to Ads Section';
                return;
            }
            const newAd = { id: Date.now(), vendor: vendorName, media: videoUrl, mediaType: isVideo ? 'video' : 'image' };
            const ads = getAds();
            ads.unshift(newAd);
            saveAds(ads);
            alert('Advertisement added successfully!');
            window.location.href = 'ADMIN-DASH.html';
        }
    });
});