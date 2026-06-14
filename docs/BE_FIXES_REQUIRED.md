# BE Action Items — tổng hợp từ FE E2E test

> **Nguồn:** Test thực tế FE (Chrome + puppeteer + curl) trên working-tree mới (D1/D2/D3/SEC-4), BE `localhost:8080` (Flyway V21/V22, MySQL/Redis/MinIO docker).
> **Đã verify live (đọc + ghi):** login/logout, CRUD category/topic/user, block, banner toggle, **upload→duyệt→từ chối resource, bình luận+rating, tăng view** — đều 2xx.
> **Liên quan:** [API_CONTRACT_V1.md](./API_CONTRACT_V1.md) · [DESIGN_REVIEW.md](./DESIGN_REVIEW.md) · Cập nhật: 2026-06-15
> **Mức:** 🔴 P0 chặn · 🟡 P1 nên sửa · 🟢 nhỏ/tuỳ chọn · ✅ đã xong.

---

## 0. Tóm tắt

| # | Việc | Mức |
|---|---|---|
| **BE-8** | **Tải file → 500** (`GET /resources/{id}/file` & `PUT /{id}/download`) | 🔴 **P0** |
| BE-2 | `POST/PUT /categories` nhận JSON → **500 (9999)** (nên 415/400) | 🟡 P1 |
| BE-9 | **Bulk payload chưa theo contract `{ids}`** (BE dùng `resourceIds`/mảng thô) | 🟡 P1 |
| BE-6 | SMTP chưa cấu hình (đã có dev-OTP-log để test) | 🟡 P1 |
| BE-3 | `favorite` id sai → **409** (nên **404**) | 🟢 |
| BE-4 | Sai HTTP method → **500** (nên **405**) | 🟢 |
| BE-5 | CSRF token bị clear sau GET → mỗi write 2 round-trip (tối ưu) | 🟢 |
| ✅ | CSRF 403 (FE đã xử lý); `block`→PATCH; endpoint/param contract; luồng resource | đã xong |

---

## BE-8 · Tải file → 500 🔴 P0

Resource PUBLIC + APPROVED (của chính admin) nhưng **không tải được**:
```
GET  /api/v1/resources/{id}/file      -> 500  {"code":9999,"message":"Failed to download file"}
PUT  /api/v1/resources/{id}/download  -> 500  {"code":9999,"message":"An unexpected error occurred"}
```
**Phân tích:** upload (ghi vào MinIO) **thành công 201**, nhưng đọc/stream tệp về **500**. Nghi BE dùng MinIO endpoint **`minio:9000`** (host nội bộ docker) trong khi BE chạy trên host máy → `getObject` không kết nối được. (FE đã bắt lỗi → toast; nhưng **tính năng tải về không dùng được**.)
**Đề nghị:** dùng host MinIO reachable cho luồng đọc (vd `localhost:9000` khi chạy ngoài docker); trả `code` rõ (vd `8002 STORAGE_ERROR`) thay vì 9999. Kiểm tra cả endpoint counter `PUT /{id}/download`.

---

## BE-2 · `POST/PUT /categories` JSON → 500 (nên 415/400) 🟡 P1

```bash
# JSON -> 500 (unhandled)
POST /api/v1/categories  (Content-Type: application/json)  =>  500 {"code":9999}
# multipart/form-data -> 201 OK
POST /api/v1/categories  (-F name=.. -F icon=.. -F visibility=..)  =>  201
```
Endpoint chỉ nhận **multipart/form-data** (hỗ trợ upload icon). **FE đã sửa để gửi multipart** → hết chặn. Nhưng BE ném exception chưa bắt khi sai content-type.
**Đề nghị:** trả **415 Unsupported Media Type** (hoặc 400) có `code` rõ, không phải 500/9999 (thêm handler `HttpMediaTypeNotSupportedException`).

---

## BE-9 · Bulk payload không khớp contract `{ids}` 🟡 P1

[API_CONTRACT_V1 §2.5](./API_CONTRACT_V1.md) nói mọi bulk dùng `{ "ids": [...] }`. **Thực tế BE (đo bằng curl):**

| Endpoint | BE chấp nhận | Gửi `{ids}`? |
|---|---|---|
| `PATCH /admin/resources/bulk-approve` | `{ "resourceIds": [...] }` → 200 | ❌ 400 |
| `PATCH /admin/resources/bulk-reject` | `{ "resourceIds": [...], "reason": "" }` → 200 | ❌ 400 |
| `POST /resources/bulk-delete` | **mảng thô** `[...]` → 200 | ❌ 400 |
| `PATCH /resources/bulk-restore` | **mảng thô** `[...]` → 200 | ❌ 400 |
| `POST /categories/bulk-delete` | **mảng thô** `[...]` → 200 | ❌ 400 |
| `PATCH /categories/bulk-restore` | **mảng thô** `[...]` → 200 | ❌ 400 |

**FE đã chỉnh khớp BE thật** (gửi `resourceIds` / mảng thô) → bulk chạy 200.
**Đề nghị chốt 1 trong 2:** (a) BE migrate sang `{ids}` đồng bộ theo contract (báo FE đổi lại), hoặc (b) **cập nhật API_CONTRACT_V1 §2.5** đúng thực tế. Hiện FE theo (b).

---

## BE-6 · SMTP cho mail thật 🟡 P1

`MAIL_USERNAME`/`MAIL_PASSWORD` rỗng. BE đã thêm **dev-OTP-log** (`target/app-run.log`, info) → test verify-email/reset không cần mail. Cần SMTP cho mail thật:
```dotenv
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...   # App Password / Mailtrap
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
```

---

## BE-3 · `favorite` id sai → 409 (nên 404) 🟢
`POST /resources/{id}/favorite` với id không tồn tại trả **409** thay vì **404 RESOURCE_NOT_FOUND** → kiểm tra tồn tại trước.

## BE-4 · Sai HTTP method → 500 (nên 405) 🟢
Gọi sai method (vd PUT vào route giờ là PATCH) → **500**. Thêm handler `HttpRequestMethodNotSupportedException` → 405.

## BE-5 · (Tuỳ chọn) CSRF token ổn định theo phiên 🟢
Cookie `XSRF-TOKEN` **bị rỗng/đổi sau mỗi GET** → request ghi đầu trên trình duyệt mang token cũ → 403, BE phát token mới trong response 403. **FE đã retry 1 lần** → write OK (chi phí 2 round-trip). Tối ưu: giữ token ổn định (không clear/rotate sau GET) để bỏ retry.

---

## ✅ Đã xong / không cần làm
- **CSRF (BE-1):** BE dùng `CsrfTokenRequestAttributeHandler` (raw) là **đúng**; 403 do FE thiếu header + token xoay → **FE đã sửa** (đăng ký `csrfInterceptor` + retry). Bỏ giả thuyết "Xor handler" (sai).
- **`block/unblock`:** BE đã đổi PUT→PATCH; FE đồng bộ.
- **Contract endpoints/param khớp:** sort=field,dir; restore/view/toggle method; comment flat; visibility (D1); public `GET /resources`; password (D3).
- **Luồng resource verify live:** upload 201 · approve/reject 200 · comment 201 · view 200. (Admin/Super-Admin upload **auto-APPROVE**; teacher upload → PENDING.)

---

## Ưu tiên đề xuất
1. **BE-8** (tải file 500) — 🔴 P0, chặn tính năng download/SEC-4.
2. **BE-9** (chốt format bulk: BE↔contract) + **BE-2** (415 thay 500) — gom với BE-4/BE-3 (dọn GlobalExceptionHandler/validation).
3. **BE-6** (SMTP) khi cần mail thật.
4. **BE-5** (CSRF token ổn định) — tối ưu, làm khi rảnh.

> Sau khi BE sửa **BE-8**, báo FE để chạy lại E2E phủ download + rate-limit (SEC-4 `6009`).
