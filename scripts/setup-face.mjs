// Chuẩn bị runtime nhận diện khuôn mặt (ĐH07): copy wasm của MediaPipe từ
// node_modules ra public/mediapipe/wasm để self-host (khỏi phụ thuộc CDN).
// Chạy: npm run setup:face   (sau khi npm install)
import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const SRC = "node_modules/@mediapipe/tasks-vision/wasm";
const DST = "public/mediapipe/wasm";

if (!existsSync(SRC)) {
  console.error(`✗ Không thấy ${SRC}. Chạy "npm install" trước đã.`);
  process.exit(1);
}
await mkdir(DST, { recursive: true });
await cp(SRC, DST, { recursive: true });
console.log(`✓ Đã copy wasm MediaPipe → ${DST}`);
console.log("→ Còn lại: thả face_embedding.onnx + face_landmarker.task vào public/models/ (xem public/models/README.md).");
