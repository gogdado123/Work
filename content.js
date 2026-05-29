let lastImageUrl = null;

// ดักจับจังหวะคลิกขวา เพื่อหาว่ามีรูปรึเปล่า
document.addEventListener("contextmenu", (event) => {
    const element = event.target;
    lastImageUrl = null; // เคลียร์ของเก่าทิ้งก่อน

    if (element.tagName === "IMG") {
        lastImageUrl = element.src;
    } else {
        // ถ้าคลิกโดนแผ่นใส ให้ลองมุดไปหารูปข้างใน
        const img = element.querySelector('img') || (element.parentElement && element.parentElement.querySelector('img'));
        if (img) lastImageUrl = img.src;
    }
}, true);

// รอตอบคำถามจาก Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getImageUrl") {
        sendResponse({ url: lastImageUrl });
    }
});