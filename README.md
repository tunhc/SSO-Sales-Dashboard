# SSO Sales Dashboard (tổng hợp các team)

Dashboard tổng của SSO US, clone từ `tusteam-salesperformance` (commit `ca81ca2`), chỉ giữ 3 tab và không có AI.
Mở `index.html` trực tiếp hoặc qua GitHub Pages (Settings → Pages → `main` / root).

| Tab | Nội dung |
|---|---|
| Tracking Target | Live race (nhóm theo Team / PIC / Product line), KPI target + gauge, **CM3 (actual, target, run-rate)**, **Team Progress**, PIC / Product Line progress, Daily trends, issue monitor, SKU breakdown |
| Sales Performance | Tiles YoY, trend, treemap, relationship (mức Team / PIC / PL / SKU), tồn kho vs nhu cầu, SKU breakdown |
| Product Performance | Kỳ phân tích, health chips, movers, biểu đồ CM3, bảng chi tiết |

Filter **Team → Leader → PIC** có ở cả 3 tab, lọc dây chuyền; các filter cũ (Main PL, Sub PL, Channel, Portfolio, ngày, Exclude SPT) giữ nguyên.

## Nguồn dữ liệu → Supabase (`jrajadhmnvvmytmufgjz`)

| Bảng | Lấy từ |
|---|---|
| `skus` | File Target HTML (SKU, team, channel, portfolio, MOC, labels, tồn kho AMZ/Y4A, RRP), PIC/leader từ `PIC team anh Dinh.xlsx` (Team Đồng Dinh) và `Yes4all follow up.xlsx` sheet `Tracking_0925` (Team Cẩm Tú) |
| `targets_monthly` | Final target units/GMV (`octStretch.finalUnits/finalGMV`) + Bottom Up Ads/Promo của tháng trong file Target HTML, kèm Stretch và CM3 target |
| `demand_forecast_monthly` | Bottom Up các tháng sau (Nov → May) |
| `sales_daily` | Các file `*daily.xlsx` (SKU × ngày) |
| `incoming_weekly` + tồn kho trong `skus` | `Yes4All US Inventory <ngày>.xlsx`, sheet `report` (`--inventory`) |
| `sales_hourly` | Live race (chưa có nguồn) |

Leader cả team (khi file PIC không có): `TEAM_LEADER` trong `ingest_sso.py` (Team Cẩm Tú → Quế Anh).

Schema: `supabase_schema_sso.sql`. Nạp data: `ingest_sso.py` (xem docstring). Script ghi các file `.sql` ra thư mục `--out`
(dán vào SQL Editor theo thứ tự 01 → 02 → 03 → 10_*) hoặc, nếu có biến môi trường `SUPABASE_SERVICE_KEY`, thêm `--push` để nạp thẳng.

**Không commit**: các file `.sql` sinh ra, file Excel/HTML nguồn, service_role key.

## CM3 (ước tính)
- CM3 base/unit = sell-in revenue + tất cả cost trong cost stack CM3 v7.7 (file Target HTML), **trừ** 3 dòng Promo 4%, Ads 7%, Amex — vì được thay bằng số thật.
- CM3 actual = Units × CM3 base − (Ads × 0.985 + Promo). SPT không trừ marketing.
- CM3 target = Target units × CM3 base − (Ads target × 0.985 + Promo target).
- Chỉ tính khi cost stack cùng lane với channel của SKU. CM3 % tính trên GMV của SKU có cost stack. Chưa gồm true-up CSA theo lane của file Target.

## Team / Leader
Lấy từ cột `team` / `leader` của `skus`; nếu trống thì tra `team_map.js` theo tên PIC.
