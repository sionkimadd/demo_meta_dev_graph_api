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

document.getElementById("submitPost").addEventListener("click", async () => {
  const pageId = document.getElementById("pageSelect").value;
  const message = document.getElementById("postMessage").value;
  
  if (!pageId) {
    alert("Select a page");
    return;
  }
  
  if (!message.trim()) {
    alert("Enter a message");
    return;
  }
  
  document.getElementById("statusMessage").innerText = "Laoding FB post...";
  try {
    const res = await fetch(`/facebook/pages/${pageId}/feed?user_id=${userId}&message=${encodeURIComponent(message)}`, {
      method: 'POST'
    });
    
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("postResult").innerText = JSON.stringify(data, null, 2);
    document.getElementById("statusMessage").innerText = "Posted successfully!";
    document.getElementById("postMessage").value = "";
  } catch (e) {
    document.getElementById("statusMessage").innerText = "Post error: " + e.message;
  }
});
