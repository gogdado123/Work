let pendingImageUrl = null;
let creatingOffscreen;
const NOTIFY_ID = "verilens-status";

// 🌟 1. ฟังก์ชันท่าไม้ตาย: บังคับเด้งแจ้งเตือนใหม่ทุกครั้ง!
function forceShowNotification(title, message, iconUrl = "https://cdn-icons-png.flaticon.com/512/868/868910.png") {
    // สั่งลบของเก่าทิ้งก่อน แล้วค่อยสร้างใหม่ในเสี้ยววินาที
    chrome.notifications.clear(NOTIFY_ID, () => {
        chrome.notifications.create(NOTIFY_ID, {
            type: "basic",
            iconUrl: iconUrl,
            title: title,
            message: message
        });
    });
}

async function setupOffscreen() {
    const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (contexts.length > 0) return;

    if (creatingOffscreen) {
        await creatingOffscreen;
        return;
    }

    creatingOffscreen = chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['WORKERS'],
        justification: 'Run AI model safely'
    });
    await creatingOffscreen;
    creatingOffscreen = null;
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "detect-ai",
        title: "Lens Ai",
        contexts: ["all"]
    });
});

chrome.contextMenus.onClicked.addListener(async(info, tab) => {
    if (info.menuItemId === "detect-ai") {

        let targetUrl = info.srcUrl;

        if (!targetUrl) {
            try {
                const response = await chrome.tabs.sendMessage(tab.id, { action: "getImageUrl" });
                if (response && response.url) targetUrl = response.url;
            } catch (e) {}
        }

        if (targetUrl) {
            // 🌟 2. ใช้ฟังก์ชันใหม่ เรียกแจ้งเตือน "กำลังประมวลผล"
            forceShowNotification("Lens Ai", "Analyzing image...");

            const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });

            if (contexts.length > 0) {
                chrome.runtime.sendMessage({ target: 'offscreen', imageUrl: targetUrl })
                    .catch(err => console.log("ส่งพลาด:", err));
            } else {
                pendingImageUrl = targetUrl;
                await setupOffscreen();
            }
        } else {
            // 🌟 3. แจ้งเตือน Error กรณีหารูปไม่เจอ (เปลี่ยนเป็นภาษาอังกฤษ)
            forceShowNotification("Lens Ai Error", "Unable to extract image or invalid click target.", "https://cdn-icons-png.flaticon.com/512/564/564619.png");
        }
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.target === 'background') {

        if (message.action === 'offscreen-ready') {
            if (pendingImageUrl) {
                chrome.runtime.sendMessage({ target: 'offscreen', imageUrl: pendingImageUrl });
                pendingImageUrl = null;
            }
        } else if (message.action === 'detection-result') {
            const label = message.result.label;
            const confidence = (message.result.score * 100).toFixed(2);

            // แปลภาษาให้ดูโปรขึ้น
            let displayLabel = label === "artificial" ? "AI-Generated" :
                label === "human" ? "Authentic Image" : label;

            // 🌟 4. ใช้ฟังก์ชันใหม่ แจ้งเตือน "ผลลัพธ์"
            forceShowNotification("Analysis Complete", `Result: ${displayLabel}\n(Confidence: ${confidence}%)`);
        } else if (message.action === 'detection-error') {
            // 🌟 5. แจ้งเตือน Error ของระบบ AI
            forceShowNotification("Analysis Failed", message.error, "https://cdn-icons-png.flaticon.com/512/564/564619.png");
        }
    }
});