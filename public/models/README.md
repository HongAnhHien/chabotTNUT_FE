# Model nhận diện khuôn mặt on-device (ĐH07 — điểm danh)

`src/lib/faceEngine.ts` tự động dùng model thật khi có **đủ 3 thứ** dưới đây trong `public/`.
Thiếu bất kỳ thứ nào → app **tự chạy model DEV** (không vỡ), chỉ kém chính xác.

## Cần thả vào

| File | Là gì | Lấy ở đâu |
|---|---|---|
| `public/models/face_embedding.onnx` | **MobileFaceNet 512-D** (ArcFace loss), input 112×112, output vector 512 | InsightFace model zoo / export ONNX từ bản PyTorch |
| `public/models/face_landmarker.task` | **MediaPipe FaceLandmarker** | https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task |
| `public/mediapipe/wasm/…` | Runtime WASM của MediaPipe | Chạy `npm run setup:face` (copy từ node_modules) |

## Các bước

```bash
npm install
npm run setup:face          # copy wasm MediaPipe vào public/mediapipe/wasm
# rồi tải 2 file model đặt vào public/models/:
#   face_embedding.onnx  (MobileFaceNet 512-D)
#   face_landmarker.task (MediaPipe)
npm run dev
```

Mở `/diem-danh/enroll`, xem Console:
- `Model ONNX + FaceLandmarker sẵn sàng → nhận diện THẬT` = đã chạy model thật.
- `Chưa có model thật, tạm dùng model DEV` = còn thiếu file.

## ⚠️ Giấy phép & pháp lý (bắt buộc trước khi dùng thật)
- Nhiều bản pretrained InsightFace là **non-commercial/nghiên cứu** → xác nhận license cho dùng nội bộ trường, hoặc tự huấn luyện/mua bản thương mại. Ghi vào hồ sơ **DPIA/NĐ13**.
- Model output phải **512 chiều** (khớp `FACE_DIM`). Input **NCHW (1,3,112,112)**, RGB, chuẩn hoá `(x−127.5)/128` — đã xử lý sẵn trong `faceEngine.ts`.
- Kiểm chứng lại **thứ tự 5 điểm mốc** (`LM_IDX` trong faceEngine) trên dữ liệu thật trước nghiệm thu.
- Sau khi có model: **tinh chỉnh ngưỡng τ + margin** trên tập nội bộ TNUT (đo FAR/FRR) — xem note `TICH-HOP-MODEL-ONNX-KHUON-MAT-DH07.md`.

> Các file `.onnx` / `.task` / wasm **không commit** vào repo (đã gitignore) — cấp qua kênh nội bộ, giữ license.
