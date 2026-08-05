# Font-size floor fix (2026-07-15)

## Vấn đề

User phản ánh chữ quá nhỏ ở nhiều trang. Audit toàn `src/` phát hiện ~68 giá trị `fontSize`/`font-size` rời rạc đang dùng (không có design token thống nhất), trong đó nhóm nhỏ nhất (< 11px) là nguyên nhân chính gây khó đọc.

## Hướng xử lý đã chọn

**Không** nâng đồng loạt toàn bộ font-size (rủi ro vỡ layout ở các badge/button/ô nhỏ đã canh khít theo cỡ chữ hiện tại). Chỉ nâng đúng phần **đang nhỏ hơn ngưỡng tối thiểu**, giữ nguyên mọi giá trị từ ngưỡng trở lên.

- **Ngưỡng (floor):** 11px hiệu dụng — quy đổi `0.7rem` (giả định root 16px) cho giá trị `rem`, `11px` cho giá trị `px`/số không đơn vị.
- **Luật:** `new = max(old, floor)`. Giá trị ≥ floor giữ nguyên 100%, không đụng tới.
- **Phạm vi match:** chỉ thay đúng property `fontSize:` (React inline style, camelCase) và `font-size:` (CSS-in-JS template string / `.css` / `*.styles.ts`) — không đụng bất kỳ property nào khác dù có chung giá trị số (width/padding/gap...).

## Cách thực hiện

Script Python quét toàn bộ `.ts`/`.tsx`/`.css` trong `src/`, regex-match riêng 2 property trên, tính giá trị px tương đương, thay thế nếu < 11px. Không chạm gì tới `em` (1 chỗ duy nhất, bỏ qua vì phụ thuộc font-size cha, không quy đổi an toàn được).

## Kết quả

- **275 lượt thay đổi** trên **43 file**.
- Toàn bộ giá trị cũ < floor được nâng lên đúng 1 trong 2 giá trị: `0.7rem` (nếu gốc là rem) hoặc `11px`/`11` (nếu gốc là px/số).
- Danh sách chi tiết từng thay đổi (file, dòng, giá trị cũ, giá trị mới): [`font-size-floor-fix-2026-07-15.tsv`](./font-size-floor-fix-2026-07-15.tsv).
- Đã `tsc -b --noEmit` + `eslint` toàn bộ file bị đụng sau khi sửa — sạch, không phát sinh lỗi mới (có vài lỗi lint tiền tồn tại ở file khác, xác nhận không liên quan tới dòng bị sửa — đối chiếu số dòng lỗi lint với danh sách thay đổi, không trùng).

## Cách revert

1. **Toàn bộ:** dùng file TSV trên — mỗi dòng là 1 cặp `(file, line, old, new)`, đảo `new` → `old` theo đúng số dòng để phục hồi chính xác. Lưu ý: nếu code ở dòng đó bị sửa tiếp sau lần fix này, số dòng có thể lệch — nên đối chiếu qua nội dung cột `old`/`new` thay vì tin tuyệt đối vào số dòng.
2. **Nếu commit đã tách riêng:** `git revert <commit>` hoặc `git diff <commit> -- <file>` rồi áp ngược.
3. **Từng file riêng lẻ:** tìm đúng chuỗi ở cột `new` trong file, đổi lại thành cột `old` tương ứng (TSV đã sort theo file).

## Việc chưa làm (ngoài phạm vi lần sửa này)

Gom 68 giá trị rời rạc về 1 bộ token chuẩn (vd `--font-xs/-sm/-base/-lg`) — cần thiết kế lại có chủ đích, không làm chung với fix khẩn cấp này để tránh trộn lẫn rủi ro.
