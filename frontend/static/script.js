const href = window.location.href.split('#')[0];
const qs   = href.includes('?') ? href.split('?')[1] : '';
const urlParams = new URLSearchParams(qs);

const fbStatus = urlParams.get("status");
const userId = urlParams.get("user_id");

document.getElementById("fbConnectBtn").addEventListener("click", () => {
    window.location.href = "/auth/facebook";
});

if (fbStatus === "connected" && userId) {
    document.getElementById("statusMessage").innerText = "FB connected";
    document.getElementById("fetchFbProfileBtn").style.display = "inline-block";
    document.getElementById("fetchFbPagesBtn").style.display = "inline-block";
    document.getElementById("postForm").style.display = "block";
    document.getElementById("imagePostForm").style.display = "block";
    document.getElementById("videoPostForm").style.display = "block";
}

document.getElementById("fetchFbProfileBtn").addEventListener("click", async () => {
    document.getElementById("statusMessage").innerText = "Loading FB profile...";
        try {
        const res = await fetch(`/facebook/profile?user_id=${userId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById("fbProfileOutput").innerText = JSON.stringify(data, null, 2);
        document.getElementById("statusMessage").innerText = "FB profile:";
    } catch (e) {
        document.getElementById("statusMessage").innerText = "FB profile error: " + e.message;
    }
});

document.getElementById("fetchFbPagesBtn").addEventListener("click", async () => {
    document.getElementById("statusMessage").innerText = "Loading FB pages...";
    try {
        const res = await fetch(`/facebook/pages?user_id=${userId}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById("fbPagesOutput").innerText = JSON.stringify(data, null, 2);
        document.getElementById("statusMessage").innerText = "FB pages:";

        const pageSelect = document.getElementById("pageSelect");
        const imagePageSelect = document.getElementById("imagePageSelect");
        const videoPageSelect = document.getElementById("videoPageSelect");
        pageSelect.innerHTML = '<option value="">Select a page</option>';
        imagePageSelect.innerHTML = '<option value="">Select a page</option>';
        videoPageSelect.innerHTML = '<option value="">Select a page</option>';
        data.data.forEach(page => {
            const option = document.createElement("option");
            option.value = page.id;
            option.textContent = page.name;
            
            pageSelect.appendChild(option.cloneNode(true));
            imagePageSelect.appendChild(option.cloneNode(true));
            videoPageSelect.appendChild(option.cloneNode(true));
        });
    } catch (e) {
        document.getElementById("statusMessage").innerText = "FB pages error: " + e.message;
    }
});

document.querySelectorAll('input[name="postType"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const scheduleWrapper = document.getElementById('scheduleTimeWrapper');
        if (this.value === 'scheduled') {
            scheduleWrapper.style.display = 'block';
            const minTime = new Date(Date.now() + 10 * 60 * 1000);
            const year = minTime.getFullYear();
            const month = String(minTime.getMonth() + 1).padStart(2, '0');
            const day = String(minTime.getDate()).padStart(2, '0');
            const hours = String(minTime.getHours()).padStart(2, '0');
            const minutes = String(minTime.getMinutes()).padStart(2, '0');
            const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            document.getElementById('scheduledTime').value = defaultTime;
        } else {
            scheduleWrapper.style.display = 'none';
        }
    });
});

document.getElementById("submitPost").addEventListener("click", async () => {
    const pageId = document.getElementById("pageSelect").value;
    const messageType = document.querySelector('input[name="messageType"]:checked').value;
    let message;
    
    if (messageType === 'ai') {
        message = document.getElementById('generatedMessage').value;
    } else {
        message = document.getElementById('postMessage').value;
    }
    
    if (!pageId) {
        alert("Select a page");
        return;
    }
    
    if (!message.trim()) {
        alert("Write a message");
        return;
    }
    
    let formData = new FormData();
    formData.append('message', message);
    
    let endpoint = `/facebook/pages/${pageId}/feed?user_id=${userId}`;
    
    const postType = document.querySelector('input[name="postType"]:checked').value;
    if (postType === 'scheduled') {
        const scheduledTime = document.getElementById("scheduledTime").value;
        if (!scheduledTime) {
            alert("Plan a scheduled time");
            return;
        }
        
        const scheduledTimestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);
        
        if (scheduledTimestamp < now + 600) {
            alert("At least 10min later");
            return;
        }
        
        if (scheduledTimestamp > now + 180 * 24 * 3600) {
            alert("At most 180 days before");
            return;
        }
        
        formData.append('scheduled_time', String(scheduledTimestamp));
    }
    
    document.getElementById("statusMessage").innerText = "Loading...";
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById("postResult").innerText = JSON.stringify(data, null, 2);
        document.getElementById("statusMessage").innerText = 
            postType === 'scheduled' ? "Post scheduled!" : "Post published!";
        
        document.getElementById("postMessage").value = "";
        if (postType === 'scheduled') {
            document.getElementById("scheduledTime").value = "";
            document.querySelector('input[value="now"]').checked = true;
            document.getElementById("scheduleTimeWrapper").style.display = 'none';
        }
    } catch (e) {
        document.getElementById("statusMessage").innerText = "Post error: " + e.message;
    }
});

document.querySelectorAll('input[name="imagePostType"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const scheduleWrapper = document.getElementById('imageScheduleTimeWrapper');
        if (this.value === 'scheduled') {
            scheduleWrapper.style.display = 'block';
            const minTime = new Date(Date.now() + 10 * 60 * 1000);
            const year = minTime.getFullYear();
            const month = String(minTime.getMonth() + 1).padStart(2, '0');
            const day = String(minTime.getDate()).padStart(2, '0');
            const hours = String(minTime.getHours()).padStart(2, '0');
            const minutes = String(minTime.getMinutes()).padStart(2, '0');
            const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            document.getElementById('imageScheduledTime').value = defaultTime;
        } else {
            scheduleWrapper.style.display = 'none';
        }
    });
});

document.getElementById("submitImagePost").addEventListener("click", async () => {
    const pageId = document.getElementById("imagePageSelect").value;
    const messageType = document.querySelector('input[name="imageMessageType"]:checked').value;
    let caption;
    
    if (messageType === 'ai') {
        caption = document.getElementById('generatedImageCaption').value;
    } else {
        caption = document.getElementById('imageCaption').value;
    }
    
    const imageFile = document.getElementById("imageUpload").files[0];
    
    if (!pageId) {
        alert("Select a page");
        return;
    }
    
    if (!imageFile) {
        alert("Select an image");
        return;
    }
    
    let formData = new FormData();
    formData.append('image', imageFile);
    if (caption && caption.trim()) {
        formData.append('caption', caption.trim());
    }
    
    let endpoint = `/facebook/pages/${pageId}/photos?user_id=${userId}`;
    
    const postType = document.querySelector('input[name="imagePostType"]:checked').value;
    if (postType === 'scheduled') {
        const scheduledTime = document.getElementById("imageScheduledTime").value;
        if (!scheduledTime) {
            alert("Plan a scheduled time");
            return;
        }
        
        const scheduledTimestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);
        
        if (scheduledTimestamp < now + 600) {
            alert("At least 10min later");
            return;
        }
        
        if (scheduledTimestamp > now + 180 * 24 * 3600) {
            alert("At most 180 days before");
            return;
        }
        
        formData.append('scheduled_time', String(scheduledTimestamp));
    }
    
    document.getElementById("statusMessage").innerText = "Uploading...";
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById("imagePostResult").innerText = JSON.stringify(data, null, 2);
        document.getElementById("statusMessage").innerText = 
            postType === 'scheduled' ? "Image scheduled!" : "Image uploaded!";
        
        document.getElementById("imageCaption").value = "";
        document.getElementById("imageUpload").value = "";
        if (postType === 'scheduled') {
            document.getElementById("imageScheduledTime").value = "";
            document.querySelector('input[value="now"]').checked = true;
            document.getElementById("imageScheduleTimeWrapper").style.display = 'none';
        }
    } catch (e) {
        document.getElementById("statusMessage").innerText = "Upload error: " + e.message;
    }
});

document.querySelectorAll('input[name="videoPostType"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const scheduleWrapper = document.getElementById('videoScheduleTimeWrapper');
        if (this.value === 'scheduled') {
            scheduleWrapper.style.display = 'block';
            const minTime = new Date(Date.now() + 10 * 60 * 1000);
            const year = minTime.getFullYear();
            const month = String(minTime.getMonth() + 1).padStart(2, '0');
            const day = String(minTime.getDate()).padStart(2, '0');
            const hours = String(minTime.getHours()).padStart(2, '0');
            const minutes = String(minTime.getMinutes()).padStart(2, '0');
            const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            document.getElementById('videoScheduledTime').value = defaultTime;
        } else {
            scheduleWrapper.style.display = 'none';
        }
    });
});

document.getElementById("submitVideoPost").addEventListener("click", async () => {
    const pageId = document.getElementById("videoPageSelect").value;
    const title = document.getElementById("videoTitle").value;
    const description = document.getElementById("videoDescription").value;
    const postType = document.querySelector('input[name="videoPostType"]:checked').value;
    const videoFile = document.getElementById("videoUpload").files[0];
    
    if (!pageId) {
        alert("Select a page");
        return;
    }
    
    if (!videoFile) {
        alert("Select a video file");
        return;
    }
    
    let formData = new FormData();
    formData.append('video', videoFile);
    if (title && title.trim()) {
        formData.append('title', title.trim());
    }
    if (description && description.trim()) {
        formData.append('description', description.trim());
    }
    
    let endpoint = `/facebook/pages/${pageId}/videos?user_id=${userId}`;
    
    if (postType === 'scheduled') {
        const scheduledTime = document.getElementById("videoScheduledTime").value;
        if (!scheduledTime) {
            alert("Set a scheduled time");
            return;
        }
        
        const scheduledTimestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
        const now = Math.floor(Date.now() / 1000);
        
        if (scheduledTimestamp < now + 600) {
            alert("At least 10 minutes later");
            return;
        }
        
        if (scheduledTimestamp > now + 180 * 24 * 3600) {
            alert("At most 180 days before");
            return;
        }
        
        formData.append('scheduled_time', scheduledTimestamp);
    }
    
    document.getElementById("statusMessage").innerText = "Uploading video...";
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById("videoPostResult").innerText = JSON.stringify(data, null, 2);
        document.getElementById("statusMessage").innerText = 
            postType === 'scheduled' ? "Video scheduled!" : "Video uploaded!";
        
        document.getElementById("videoTitle").value = "";
        document.getElementById("videoDescription").value = "";
        document.getElementById("videoUpload").value = "";
        if (postType === 'scheduled') {
            document.getElementById("videoScheduledTime").value = "";
            document.querySelector('input[value="now"]').checked = true;
            document.getElementById("videoScheduleTimeWrapper").style.display = 'none';
        }
    } catch (e) {
        document.getElementById("statusMessage").innerText = "Video upload error: " + e.message;
    }
});

document.querySelectorAll('input[name="messageType"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const manualInput = document.getElementById('manualInput');
        const aiInput = document.getElementById('aiInput');
        if (this.value === 'manual') {
            manualInput.style.display = 'block';
            aiInput.style.display = 'none';
        } else {
            manualInput.style.display = 'none';
            aiInput.style.display = 'block';
        }
    });
});

document.querySelectorAll('input[name="imageMessageType"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const manualInput = document.getElementById('imageManualInput');
        const aiInput = document.getElementById('imageAiInput');
        if (this.value === 'manual') {
            manualInput.style.display = 'block';
            aiInput.style.display = 'none';
        } else {
            manualInput.style.display = 'none';
            aiInput.style.display = 'block';
        }
    });
});

document.getElementById('generateCaption').addEventListener('click', async function() {
    const keyword = document.getElementById('keywordInput').value;
    if (!keyword) {
        alert('Please enter keywords.');
        return;
    }

    try {
        const response = await fetch('/generate-caption', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `keyword=${encodeURIComponent(keyword)}`
        });

        if (!response.ok) {
            throw new Error('Generation failed.');
        }

        const data = await response.json();
        const generatedText = `${data.caption}\n\n${data.hashtags}`;
        document.getElementById('generatedMessage').value = generatedText;
        document.getElementById('generatedContent').style.display = 'block';
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('regenerateBtn').addEventListener('click', async function() {
    const keyword = document.getElementById('keywordInput').value;
    if (!keyword) {
        alert('Please enter keywords.');
        return;
    }

    try {
        const response = await fetch('/generate-caption', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `keyword=${encodeURIComponent(keyword)}`
        });

        if (!response.ok) {
            throw new Error('Generation failed.');
        }

        const data = await response.json();
        const generatedText = `${data.caption}\n\n${data.hashtags}`;
        document.getElementById('generatedMessage').value = generatedText;
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('useGeneratedBtn').addEventListener('click', function() {
    const generatedText = document.getElementById('generatedMessage').value;
    document.getElementById('postMessage').value = generatedText;
    document.querySelector('input[name="messageType"][value="manual"]').checked = true;
    document.getElementById('manualInput').style.display = 'block';
    document.getElementById('aiInput').style.display = 'none';
});

document.getElementById('generateImageCaption').addEventListener('click', async function() {
    const keyword = document.getElementById('imageKeywordInput').value;
    if (!keyword) {
        alert('Please enter keywords.');
        return;
    }

    try {
        const response = await fetch('/generate-caption', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `keyword=${encodeURIComponent(keyword)}`
        });

        if (!response.ok) {
            throw new Error('Generation failed.');
        }

        const data = await response.json();
        const generatedText = `${data.caption}\n\n${data.hashtags}`;
        document.getElementById('generatedImageCaption').value = generatedText;
        document.getElementById('generatedImageContent').style.display = 'block';
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('regenerateImageBtn').addEventListener('click', async function() {
    const keyword = document.getElementById('imageKeywordInput').value;
    if (!keyword) {
        alert('Please enter keywords.');
        return;
    }

    try {
        const response = await fetch('/generate-caption', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `keyword=${encodeURIComponent(keyword)}`
        });

        if (!response.ok) {
            throw new Error('Generation failed.');
        }

        const data = await response.json();
        const generatedText = `${data.caption}\n\n${data.hashtags}`;
        document.getElementById('generatedImageCaption').value = generatedText;
    } catch (error) {
        alert(error.message);
    }
});

document.getElementById('useGeneratedImageBtn').addEventListener('click', function() {
    const generatedText = document.getElementById('generatedImageCaption').value;
    document.getElementById('imageCaption').value = generatedText;
    document.querySelector('input[name="imageMessageType"][value="manual"]').checked = true;
    document.getElementById('imageManualInput').style.display = 'block';
    document.getElementById('imageAiInput').style.display = 'none';
});
