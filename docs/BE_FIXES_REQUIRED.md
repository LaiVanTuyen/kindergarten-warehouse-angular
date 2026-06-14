# BE Fixes Required — phát hiện từ FE E2E test

> **Nguồn:** Test thực tế FE (Chrome + puppeteer) chạy trên working-tree mới (D1/D2/D3/SEC-4) trỏ vào BE `localhost:8080` (Flyway V21/V22 đã apply).
> **Liên quan:** [API_CONTRACT_V1.md](./API_CONTRACT_V1.md) · [DESIGN_REVIEW.md](./DESIGN_REVIEW.md) · Ngày: 2026-06-14
> **Quy ước:** 🔴 P0 chặn chức năng · 🟡 P1 cần cho môi trường thật · 🟢 xác nhận/giữ nguyên.

---

## 0. Tóm tắt

> **CẬP NHẬT 2026-06-14 (sau phản hồi BE):** BE-1 **KHÔNG phải lỗi BE** và **đã được giải quyết phía FE**. Giả thuyết "Xor handler" ban đầu **sai** — BE dùng `CsrfTokenRequestAttributeHandler` (raw) là đúng. Xem phần BE-1 đã sửa bên dưới. BE-2 đã có workaround (dev OTP log). Còn lại là 1 tối ưu CSRF tuỳ chọn + 2 lỗi nhỏ.

| # | Vấn đề | Mức | Trạng thái |
|---|---|---|---|
| BE-1 | CSRF 403 ở request ghi | ✅ Đã hiểu đúng | **Đã fix FE** (retry). BE **không bắt buộc sửa**; có 1 tối ưu tuỳ chọn (token ổn định). |
| BE-2 | SMTP chưa cấu hình | 🟡 P1 | BE đã thêm dev OTP log → test được không cần mail. Cần SMTP cho mail thật. |
| BE-3 | Endpoint/param FE gọi | 🟢 | Đã khớp (BE xác nhận). |
| BE-4 | `favorite` id sai trả 409 thay vì 404; sai method → 500 thay vì 405 | 🟢 nhỏ | Tuỳ BE (không chặn). |

> ✅ Đã verify chạy đúng (không cần sửa): login cấp cookie; mọi endpoint **đọc** (list users/resources/categories/topics/banners/audit-logs) trả **200**; pagination `sort=field,dir` (D2); `visibility` (D1) end-to-end; chống mật khẩu yếu (D3).

---

## BE-1 · CSRF 403 — ✅ ĐÃ FIX PHÍA FE (đính chính)

> **Đính chính:** Giả thuyết "BE dùng XorCsrfTokenRequestAttributeHandler" ở bản trước **SAI**. BE đã xác nhận dùng `CsrfTokenRequestAttributeHandler` (raw double-submit) — **đúng**. **KHÔNG áp Cách B / `SpaCsrfTokenRequestHandler`** (sẽ thừa và có thể làm hỏng luồng raw đang chạy tốt).

### Nguyên nhân thật (đo lại bằng curl)
1. `login` → cookie `XSRF-TOKEN=T1`; **ghi ngay với T1 → 200** (BE chấp nhận, không cần xoay). ✅
2. Nhưng **sau một GET, cookie `XSRF-TOKEN` bị rỗng/đổi** (đo: token sau GET = empty). Trên trình duyệt có nhiều GET giữa login và thao tác ghi đầu → request ghi đầu mang token **rỗng/cũ** → **403** (`{code:1012}`); BE phát token mới trong chính response 403 đó.

### Đã xử lý phía FE (không cần BE sửa)
- Đăng ký `csrfInterceptor` (trước đây có file nhưng **chưa đăng ký**) → gắn `X-XSRF-TOKEN` từ cookie cho mọi request.
- `csrfInterceptor` **retry 1 lần khi gặp 403 ở request ghi**: đọc lại cookie (đã được BE phát mới) và gửi lại. An toàn vì 403 = chưa thực thi → không double-write.
- Thứ tự interceptor `[auth, csrf]` để csrf nuốt 403 tạm thời trước khi auth kịp hiện toast.
- **Verify live:** `PATCH /banners/1/toggle` và `POST /auth/logout` đều **403 → retry → 200**; logout huỷ phiên thật.

### (Tuỳ chọn) Tối ưu phía BE — KHÔNG bắt buộc
Hiện mỗi thao tác ghi tốn **2 round-trip** (403 rồi retry) do cookie CSRF bị rỗng/đổi sau GET. Nếu BE giữ **token CSRF ổn định theo phiên** (không clear/rotate `XSRF-TOKEN` trên mỗi GET response) thì request ghi đầu sẽ 200 ngay, bỏ được retry. Đây là tối ưu hiệu năng/UX, không phải lỗi chặn.

> Câu hỏi cho BE: có chủ đích clear/rotate cookie `XSRF-TOKEN` sau mỗi request không? Nếu không, kiểm tra cấu hình `CookieCsrfTokenRepository`/filter nào đang xoá nó sau GET.

---

## BE-2 · SMTP chưa cấu hình 🟡 P1

- `MAIL_USERNAME` / `MAIL_PASSWORD` đang rỗng ⇒ luồng **register → verify-email OTP** và **reset mật khẩu** không gửi được mail.
- **Cần:** điền SMTP vào `.env` (vd Gmail App Password / Mailtrap cho dev) rồi restart `warehouse_app`.
- Tạm thời để test: admin tạo user trực tiếp (status `ACTIVE`) — nhưng chức năng OTP/verify chỉ phủ được khi có SMTP.

```dotenv
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...            # App Password, KHÔNG phải mật khẩu thường
MAIL_SMTP_AUTH=true
MAIL_SMTP_STARTTLS=true
```

---

## BE-3 · Xác nhận endpoint/param FE đang gọi (để luồng ghi chạy thông) 🟢

Sau khi sửa CSRF, FE sẽ gọi các endpoint dưới đây. Nhờ BE xác nhận tồn tại + nhận đúng param/payload (theo [API_CONTRACT_V1](./API_CONTRACT_V1.md)):

| Chức năng | FE gọi | Ghi chú |
|---|---|---|
| Portal duyệt công khai | `GET /resources?page&size&sort=field,dir&keyword&topicId&ageGroupId&categorySlugs&ageSlugs&types` | **permitAll**; lọc `visibility=PUBLIC + status=APPROVED + !deleted` ở server. (FE vừa chuyển từ `/admin/resources` sang đây để khách xem được.) |
| Tăng view | `POST /resources/{id}/view` | D2 (đổi từ PUT). |
| Toggle favorite | `POST /resources/{id}/favorite` | |
| Khôi phục resource | `PATCH /resources/{id}/restore` | D2. |
| Bulk xoá resource | `POST /resources/bulk-delete?hard=` body `{ "ids": [...] }` | D2/D2.5. |
| Bulk duyệt/từ chối | `PATCH /admin/resources/bulk-approve` `{ "ids": [...] }` · `bulk-reject` `{ "ids":[...], "reason":"" }` | field **`ids`** (không phải `resourceIds`). |
| Bulk khôi phục | `PATCH /resources/bulk-restore` `{ "ids": [...] }` | |
| Toggle banner | `PATCH /banners/{id}/toggle` | D2; trả Banner đã cập nhật (có `visibility`). |
| Tạo/sửa banner | `POST`/`PUT /banners` (multipart) field **`visibility`** (`PUBLIC`/`PRIVATE`) | D1 (bỏ `isActive`). |
| Tạo/sửa category/topic | `POST`/`PUT` body có **`visibility`** | D1. |
| Bulk category | `POST /categories/bulk-delete` `{ ids }` · `PATCH /categories/bulk-restore` `{ ids }` | |
| Khôi phục user | `PATCH /users/{id}/restore` | D2 (đổi từ PUT). |
| Comment | `POST /comments` `{ resourceId, content, rating }` · `GET /comments?resourceId=&page&size&sort=createdAt,desc` | endpoint **flat** + `@RequestBody`. |
| Download | `GET /resources/{id}/file` | Lỗi trả **JSON `ApiResponse`** (FE parse blob); owner/admin tải được file non-public; rate-limit `6009`. |

> ❓ Một điểm cần BE chốt rõ: **`block/unblock user`** — API_CONTRACT_V1 §2.4 không liệt kê. FE hiện để `PUT /users/{id}/block`. Nếu BE chuẩn hoá theo D2 (đổi-trạng-thái → PATCH) thì báo để FE đổi `PUT → PATCH`.

---

## Thứ tự đề xuất
1. **BE-1 (CSRF)** — ưu tiên cao nhất, mở khoá toàn bộ test ghi.
2. **BE-3** — rà nhanh checklist, sửa lệch nếu có.
3. **BE-2 (SMTP)** — khi cần phủ OTP/verify.

Sau khi BE deploy, báo FE để chạy lại bộ E2E (puppeteer) phủ nốt các luồng ghi và báo cáo kết quả.
