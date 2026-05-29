# Lens AI: Real-Time AI Image Detection Browser Extension

A Google Chrome Extension (Manifest V3) designed for real-time image classification to detect AI-generated images directly on the client side (Edge AI).

## 🚀 Key Features
* **100% Data Privacy:** Utilizes client-side inference so images never leave the user's device.
* **Zero Server Cost:** Powered entirely by the local machine's web browser using WebAssembly.
* **Real-Time Analysis:** Seamlessly integrates with the Chrome context menu (right-click) for instant deployment.

## ⚙️ Tech Stack & Architecture
* **Frontend/Extension:** JavaScript (ES6+), Chrome Extension API (Manifest V3)
* **Core Engine:** WebAssembly (WASM), ONNX Runtime, `transformers.js`
* **AI Model:** Pre-trained Vision Transformer (ViT) architecture optimized for image classification.

## 📂 System Workflow
1. User right-clicks an image and selects **"Lens Ai"**.
2. `background.js` extracts the image URL and safely transfers it to an isolated `offscreen.html` document.
3. The model running on `offscreen.js` cuts the image into 16x16 patches and analyzes pixel-level artifacts via Self-Attention.
4. Inference scores are sent back to the background worker to trigger a system pop-up notification with the final confidence level.

## 🛠️ Installation & Setup
1. Clone or download this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left corner and select this project folder.
