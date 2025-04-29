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
    pageSelect.innerHTML = '<option value="">Select a page</option>';
    data.data.forEach(page => {
      const option = document.createElement("option");
      option.value = page.id;
      option.textContent = page.name;
      pageSelect.appendChild(option);
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
    const message = document.getElementById("postMessage").value;
    const postType = document.querySelector('input[name="postType"]:checked').value;
    
    if (!pageId) {
        alert("Select a page");
        return;
    }
    
    if (!message.trim()) {
        alert("Write a message");
        return;
    }
    
    let endpoint = `/facebook/pages/${pageId}/feed?user_id=${userId}&message=${encodeURIComponent(message)}`;
    
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
        
        endpoint += `&scheduled_time=${scheduledTimestamp}`;
    }
    
    document.getElementById("statusMessage").innerText = "Loading...";
    try {
        const res = await fetch(endpoint, {
            method: 'POST'
        });
        
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        document.getElementById("postResult").innerText = JSON.stringify(data, null, 2);
        document.getElementById("statusMessage").innerText = 
            postType === 'scheduled' ? "Post scheduled!" : "Post publishied!";
        
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
