-- ============================================================================
-- SSO SALES DASHBOARD — SUPABASE SCHEMA (project jrajadhmnvvmytmufgjz)
-- Lean version of the team dashboard schema (v1 + v2 + hourly): only what the
-- 3 tabs read. Anon key = read-only. Writes go through service_role / SQL
-- Editor / the bulk loader below.
-- ============================================================================
create extension if not exists pgcrypto;

-- 1) SKU master ---------------------------------------------------------------
create table if not exists skus (
  sku            text primary key,
  product_name   text,
  asin           text,
  team           text,            -- Team Cẩm Tú / Team Đồng Dinh / Spreetail (target file)
  leader         text,            -- leader by product line (PIC file)
  pic            text,
  sem_pic        text,
  main_pl        text,
  sub_pl         text,
  category       text,
  lifecycle      text,
  selling_type   text,
  asin_status    text,
  salable_y4a    numeric default 0,
  salable_amz    numeric default 0,
  inventory_as_of date,
  channel        text,
  portfolio      text,
  priority       text,
  moc            numeric,
  moc_band       text,
  rrp            numeric default 0,
  normal_asp     numeric,
  block_ads      text,
  labels         text,
  war_plan       text,
  po_treatment   text,
  cm3_unit_base  numeric,          -- CM3 per unit before Ads/Promo (cost stack)
  cm3_lane       text,
  cm3_source     text,
  updated_at     timestamptz not null default now()
);

-- 2) Monthly targets ------------------------------------------------------------
create table if not exists targets_monthly (
  id             bigint generated always as identity primary key,
  sku            text not null references skus(sku) on delete cascade,
  month          date not null,
  target_units   numeric default 0,
  target_gmv     numeric default 0,
  ads_target     numeric default 0,
  promo_target   numeric default 0,
  cm3_target     numeric,          -- planned CM3 $ (units × CM3 base − Ads × 0.985 − Promo)
  stretch_units  numeric,
  stretch_gmv    numeric,
  source         text,
  updated_at     timestamptz not null default now(),
  unique (sku, month)
);

-- 3) Daily sales ----------------------------------------------------------------
create table if not exists sales_daily (
  id                 bigint generated always as identity primary key,
  sku                text not null references skus(sku) on delete cascade,
  date               date not null,
  units              numeric default 0,
  gmv                numeric default 0,
  ads                numeric default 0,
  promo              numeric default 0,
  ads_gmv            numeric default 0,
  ads_units          numeric default 0,
  total_clicks       numeric default 0,
  total_impressions  numeric default 0,
  glance_views       numeric default 0,
  ordered_revenue    numeric default 0,
  ordered_nmv        numeric default 0,
  sp_spend           numeric default 0,
  sb_spend           numeric default 0,
  sd_spend           numeric default 0,
  dsp_spend          numeric default 0,
  aff_spend          numeric default 0,
  promo_deal         numeric default 0,
  promo_coupon       numeric default 0,
  promo_discount     numeric default 0,
  category           text,
  source_file        text,
  ingested_at        timestamptz not null default now(),
  unique (sku, date)
);
create index if not exists idx_sales_daily_date on sales_daily(date);
create index if not exists idx_sales_daily_sku_date on sales_daily(sku, date);

-- 4) Hourly sales (live race) -----------------------------------------------------
create table if not exists sales_hourly (
  sku          text not null,
  ts           timestamp not null,
  date         date not null,
  hour         smallint not null,
  units        numeric not null default 0,
  gmv          numeric not null default 0,
  ads          numeric not null default 0,
  promo        numeric not null default 0,
  ads_gmv      numeric not null default 0,
  clicks       numeric not null default 0,
  impressions  numeric not null default 0,
  glance_views numeric not null default 0,
  source_file  text,
  primary key (sku, ts)
);
create index if not exists idx_sales_hourly_date on sales_hourly(date);

-- 5) Inventory / incoming / demand / notes (optional feeds) ------------------------
create table if not exists data_locks (
  table_name   text primary key,
  lock_before  date not null,
  note         text,
  updated_at   timestamptz not null default now()
);
insert into data_locks (table_name, lock_before, note)
values ('sales_daily', '2026-09-01', 'Final monthly data through Aug-2026')
on conflict (table_name) do nothing;

create table if not exists incoming_weekly (
  sku            text not null references skus(sku) on delete cascade,
  week_start     date not null,
  qty_y4a        numeric default 0,
  qty_amz        numeric default 0,
  snapshot_date  date not null,
  primary key (sku, week_start, snapshot_date)
);
create table if not exists demand_forecast_monthly (
  sku            text not null references skus(sku) on delete cascade,
  month          date not null,
  units          numeric default 0,
  gmv            numeric default 0,
  source         text,
  updated_at     timestamptz not null default now(),
  primary key (sku, month)
);
create table if not exists weekly_reviews (      -- PIC notes feed the Issue monitor (read only here)
  id             uuid primary key default gen_random_uuid(),
  week_start     date not null,
  main_pl        text not null,
  owner          text,
  status         text,
  issue_text     text,
  action_text    text,
  updated_at     timestamptz not null default now(),
  unique (week_start, main_pl)
);

-- 6) Aggregate RPCs ------------------------------------------------------------------
create or replace function sales_by_sku(p_from date, p_to date)
returns table (sku text, days int, units numeric, gmv numeric, ads numeric, promo numeric, ads_gmv numeric, ads_units numeric,
               clicks numeric, impressions numeric, glance_views numeric, ordered_revenue numeric,
               sp_spend numeric, sb_spend numeric, sd_spend numeric, dsp_spend numeric,
               promo_deal numeric, promo_coupon numeric, promo_discount numeric, gv_units numeric)
language sql stable as $$
  select sku, count(*)::int, sum(units), sum(gmv), sum(ads), sum(promo), sum(ads_gmv), sum(ads_units),
         sum(total_clicks), sum(total_impressions), sum(glance_views), sum(ordered_revenue),
         sum(sp_spend), sum(sb_spend), sum(sd_spend), sum(dsp_spend),
         sum(promo_deal), sum(promo_coupon), sum(promo_discount),
         coalesce(sum(units) filter (where glance_views > 0), 0)
  from sales_daily where date between p_from and p_to group by sku
$$;

create or replace function sales_trend(p_from date, p_to date, p_grain text default 'month', p_skus text[] default null)
returns table (period date, units numeric, gmv numeric, ads numeric, promo numeric, ads_gmv numeric, ads_units numeric,
               clicks numeric, impressions numeric, glance_views numeric, ordered_revenue numeric,
               sp_spend numeric, sb_spend numeric, sd_spend numeric, dsp_spend numeric, gv_units numeric)
language sql stable as $$
  select case p_grain when 'day' then date
                      when 'week' then date - extract(dow from date)::int
                      else date_trunc('month', date)::date end as period,
         sum(units), sum(gmv), sum(ads), sum(promo), sum(ads_gmv), sum(ads_units),
         sum(total_clicks), sum(total_impressions), sum(glance_views), sum(ordered_revenue),
         sum(sp_spend), sum(sb_spend), sum(sd_spend), sum(dsp_spend),
         coalesce(sum(units) filter (where glance_views > 0), 0)
  from sales_daily
  where date between p_from and p_to and (p_skus is null or sku = any(p_skus))
  group by 1 order by 1
$$;

create or replace function sales_date_bounds()
returns table (min_date date, max_date date, lock_before date)
language sql stable as $$
  select min(date), max(date), (select lock_before from data_locks where table_name = 'sales_daily') from sales_daily
$$;

-- 7) Row Level Security: anon = read only ------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['skus','targets_monthly','sales_daily','sales_hourly','data_locks','incoming_weekly',
                           'demand_forecast_monthly','weekly_reviews'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "public read %1$s" on %1$I', t);
    execute format('create policy "public read %1$s" on %1$I for select using (true)', t);
  end loop;
end $$;

grant execute on function sales_by_sku(date, date) to anon, authenticated;
grant execute on function sales_trend(date, date, text, text[]) to anon, authenticated;
grant execute on function sales_date_bounds() to anon, authenticated;
