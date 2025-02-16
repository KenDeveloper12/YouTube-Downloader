const downloadForm = document.getElementById('downloadForm');
const videoUrlInput = document.getElementById('videourl');
const submitButton = document.getElementById('submitButton');
const statusText = document.querySelector('.status');
const urlLink = document.querySelector('.url a');
const loadingDisplay = document.getElementById('loadingDisplay');

downloadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const videoUrl = videoUrlInput.value.trim();
    if (!videoUrl) {
        statusText.textContent = 'Mohon masukkan URL video';
        return;
    }

    try {
        loadingDisplay.style.display = 'flex';
        statusText.textContent = 'Memproses video...';
        document.getElementById('url').style.display = 'none';

        console.log('Sending request for URL:', videoUrl);

        const response = await fetch('/api/video-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: videoUrl })
        });

        const data = await response.json();
        console.log('Received response:', data);

        if (!data.success) {
            throw new Error(data.message || 'Terjadi kesalahan yang tidak diketahui');
        }

        const downloadUrl = `/api/download?url=${encodeURIComponent(videoUrl)}`;
        urlLink.href = downloadUrl;
        urlLink.textContent = data.data.title;
        
        statusText.textContent = 'Video siap diunduh!';
        document.getElementById('url').style.display = 'block';

    } catch (error) {
        console.error('Error details:', error);
        statusText.textContent = error.message || 'Terjadi kesalahan yang tidak diketahui';
        document.getElementById('url').style.display = 'none';
    } finally {
        loadingDisplay.style.display = 'none';
    }
});