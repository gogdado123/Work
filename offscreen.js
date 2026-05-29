// 🌟 1. ประกาศตัวแปรเก็บสมอง AI ไว้บนสุดเลย เพื่อให้มันอยู่ยงคงกระพัน
let detector = null;

// 2. รอรับคำสั่งจากผู้จัดการ (Background)
chrome.runtime.onMessage.addListener((message) => {
    if (message.target === 'offscreen') {
        runAIProcessor(message.imageUrl);
    }
});

// 3. ตะโกนบอกว่าห้องแล็บพร้อมแล้ว!
chrome.runtime.sendMessage({ target: 'background', action: 'offscreen-ready' });

// 4. ฟังก์ชันเริ่มวิเคราะห์ (เวอร์ชันสมบูรณ์)
async function runAIProcessor(imageUrl) {
    let objectUrl = null; // ตัวแปรเก็บรูปภาพ (เดี๋ยวเราต้องลบมันทิ้งตอนจบ)

    try {
        console.log("📍 [Checkpoint 1] เริ่มต้น setup ห้องแล็บ...");
        const { pipeline, env } = await
        import ('./transformers.js');

        env.allowLocalModels = true;
        env.allowRemoteModels = false;
        env.backends.onnx.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/';
        env.backends.onnx.wasm.numThreads = 1;
        env.useBrowserCache = false;
        env.localModelPath = chrome.runtime.getURL('');

        // 🌟 เช็คก่อนว่ามีสมองหรือยัง? ถ้ายังไม่มีค่อยโหลด ถ้ามีแล้วใช้ของเดิม!
        if (!detector) {
            console.log("📍 [Checkpoint 2] กำลังโหลดสมอง AI ครั้งแรก... (อาจใช้เวลาหน่อย)");
            detector = await pipeline('image-classification', 'absolute_best_model', {
                quantized: false
            });
        } else {
            console.log("⚡ [Checkpoint 2] ใช้สมอง AI เดิมที่โหลดไว้แล้ว (เร็วปรี๊ด!)");
        }

        console.log("📍 [Checkpoint 3] โหลด AI สำเร็จ! กำลังดึงรูปภาพจากเว็บ: ", imageUrl);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);

        console.log("📍 [Checkpoint 4] ดึงรูปสำเร็จ! กำลังวิเคราะห์...");
        const output = await detector(objectUrl);

        console.log("📍 [Checkpoint 5] วิเคราะห์เสร็จสิ้น! ผลลัพธ์: ", output);

        chrome.runtime.sendMessage({
            target: 'background',
            action: 'detection-result',
            result: output[0]
        });

    } catch (error) {
        console.error("❌ Offscreen Error:", error);
        chrome.runtime.sendMessage({
            target: 'background',
            action: 'detection-error',
            error: error.message || String(error)
        });
    } finally {
        // 🧹 จุดสำคัญสุด! เคลียร์ขยะรูปภาพออกจากเมมโมรี่ ป้องกันแรมเต็ม (RangeError)
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            console.log("🧹 ล้างขยะหน่วยความจำเรียบร้อย พร้อมลุยรูปต่อไป!");
        }
    }
}