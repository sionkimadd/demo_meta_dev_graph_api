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
  document.getElementById("statusMessage").innerText = "Loading FB page...";
  try {
    const res = await fetch(`/facebook/pages?user_id=${userId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById("fbPagesOutput").innerText = JSON.stringify(data, null, 2);
    document.getElementById("statusMessage").innerText = "FB page:";
  } catch (e) {
    document.getElementById("statusMessage").innerText = "FB page error: " + e.message;
  }
});
