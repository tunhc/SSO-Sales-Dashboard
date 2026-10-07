# Tự cập nhật hourly (Power Automate → Supabase)

Mỗi giờ Power Automate gửi file `usa_amz_sso_hourly -- usa.xlsx` cho Edge Function `pull-hourly`
(project `jrajadhmnvvmytmufgjz`). Function tự nạp:

- `sales_hourly`: số theo giờ cho Live race (Prime Big Deal Days).
- `sales_daily`: tổng theo ngày cho các ngày chưa có file daily (file daily là số chốt, không bị ghi đè).
  Ngày trước `data_locks.lock_before` (01/09/2026) không bao giờ bị đụng tới.

File hourly cộng dồn cả tháng (dòng mới nhất ở trên), nên mỗi lần function chỉ đọc **2 ngày gần nhất**
(hôm nay + hôm qua) rồi dừng, để nằm trong giới hạn ~2 giây CPU của Edge Function. Các ngày cũ hơn đã được nạp ở những lần trước.
Đổi số ngày: header `x-days: N` hoặc secret `HOURLY_KEEP_DAYS` (0 = đọc cả file, chỉ dùng khi file nhỏ).

Kết quả mỗi lần chạy ghi vào bảng `ingest_runs` (ok / skipped / error). File không đổi so với lần trước thì bỏ qua.

## 1. Đặt secret (một lần)
Supabase → project **SSO Sales Dashboard** → Edge Functions → **Secrets** → Add:

| Name | Value |
|---|---|
| `PULL_SECRET` | một chuỗi ngẫu nhiên dài ≥ 32 ký tự (tự đặt, lưu lại để dán vào Power Automate) |

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` Supabase tự cấp, không cần đặt.

## 2. Tạo flow Power Automate
**Create → Scheduled cloud flow**, chạy mỗi `1` `Hour` (nên chọn phút :07 vì file hourly thường về trễ).

1. **SharePoint → Get file content using path** (hoặc *OneDrive for Business → Get file content using path*)
   - Site / File path: file `usa_amz_sso_hourly -- usa.xlsx` đang được cập nhật hằng giờ.
2. **HTTP** (HTTP premium connector)
   - Method: `POST`
   - URI: `https://jrajadhmnvvmytmufgjz.supabase.co/functions/v1/pull-hourly`
   - Headers:
     | Key | Value |
     |---|---|
     | `x-pull-secret` | giá trị `PULL_SECRET` ở bước 1 |
     | `x-file-name` | `usa_amz_sso_hourly` |
   - Body: chọn **File Content** của bước 1
     (biểu thức: `body('Get_file_content_using_path')?['$content']`).

Lưu → **Test → Manually**. Response đúng có dạng `{"ok":true, "hourRows": ..., "days": [...]}`.

Muốn thử mà không ghi gì: thêm header `x-dry-run: 1`. Muốn nạp lại dù file không đổi: `x-force: 1`.

## 3. Kiểm tra
Supabase → SQL Editor:
```sql
select ran_at, status, rows_loaded, round(gmv) gmv, days, message from ingest_runs order by ran_at desc limit 20;
```
Lỗi: xem Power Automate run history và Supabase → Edge Functions → pull-hourly → Logs.
