#!/bin/sh
# Tải model nhận diện khuôn mặt (ĐH07) vào public/ lúc build — KHÔNG commit vào git
# (license InsightFace chỉ cho nghiên cứu/giáo dục + dung lượng lớn).
# File nào đã có sẵn đúng mã băm thì bỏ qua. Sai mã băm -> dừng build (không để app
# lặng lẽ rơi về model DEV).
#   sh scripts/fetch-face-models.sh      (chạy ở thư mục gốc FE, sau npm ci)
set -eu

MODELS=public/models
WASM=public/mediapipe/wasm
EMBED_SHA=9cc6e4a75f0e2bf0b1aed94578f144d15175f357bdc05e815e5c4a02b319eb4f
LMK_SHA=64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff
EMBED_ZIP=https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_s.zip
LMK_URL=https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

mkdir -p "$MODELS" "$WASM"

ok() { [ -f "$1" ] && [ "$(sha256sum "$1" | cut -d' ' -f1)" = "$2" ]; }

# 1) MobileFaceNet w600k_mbf (512-D) — nằm trong gói buffalo_s của InsightFace
if ok "$MODELS/face_embedding.onnx" "$EMBED_SHA"; then
  echo "[face-models] face_embedding.onnx: có sẵn"
else
  echo "[face-models] tải buffalo_s.zip (~128MB) để lấy w600k_mbf.onnx..."
  tmp=$(mktemp -d)
  wget -q -O "$tmp/b.zip" "$EMBED_ZIP"
  unzip -o -q "$tmp/b.zip" w600k_mbf.onnx -d "$tmp"
  mv "$tmp/w600k_mbf.onnx" "$MODELS/face_embedding.onnx"
  rm -rf "$tmp"
  ok "$MODELS/face_embedding.onnx" "$EMBED_SHA" || { echo "[face-models] SAI mã băm face_embedding.onnx"; exit 1; }
fi

# 2) MediaPipe FaceLandmarker
if ok "$MODELS/face_landmarker.task" "$LMK_SHA"; then
  echo "[face-models] face_landmarker.task: có sẵn"
else
  wget -q -O "$MODELS/face_landmarker.task" "$LMK_URL"
  ok "$MODELS/face_landmarker.task" "$LMK_SHA" || { echo "[face-models] SAI mã băm face_landmarker.task"; exit 1; }
fi

# 3) WASM MediaPipe — đúng phiên bản thư viện đã cài (node_modules)
cp -f node_modules/@mediapipe/tasks-vision/wasm/* "$WASM/"
echo "[face-models] xong: $(ls "$MODELS" "$WASM" | tr '\n' ' ')"
