-- 1. Profiles 테이블에 크레딧 컬럼 추가
alter table public.profiles 
add column if not exists credits integer default 0;

-- [RESET] 기존 테이블 삭제 (다시 생성하기 위해)
drop table if exists public.refund_requests cascade;
drop table if exists public.credit_consumption cascade;
drop table if exists public.credit_transactions cascade;
drop table if exists public.credit_sources cascade;
drop table if exists public.pricing_plans cascade;
drop table if exists public.payment_history cascade;

-- 2. 요금제 테이블 (Pricing Plans Table)
create table if not exists public.pricing_plans (
    id uuid primary key default gen_random_uuid(),
    name text not null unique, -- 중복 방지를 위해 unique 추가
    credits integer not null, -- 제공 크레딧
    price integer not null, -- 가격 (KRW)
    description text, -- 요금제 설명
    is_active boolean default true, -- 판매 중 여부
    sort_order integer default 0, -- 정렬 순서
    created_at timestamptz default now()
);

-- 초기 요금제 데이터 입력 (Seed Pricing Plans)
insert into public.pricing_plans (name, credits, price, sort_order) values
('Starter', 10, 3900, 1),
('Basic', 30, 9800, 2),
('Pro', 60, 18800, 3)
on conflict (name) do nothing; -- unique 제약조건 덕분에 중복 입력 방지됨

-- 3. 크레딧 출처 테이블 (Credit Sources - FIFO Tracking)
-- 선입선출 차감을 위해 생성 시간(created_at) 순으로 정렬하여 사용
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'credit_source_status') then
        create type credit_source_status as enum ('active', 'pending_refund', 'refunded', 'exhausted');
    end if;
end $$;

create table if not exists public.credit_sources (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    plan_id uuid references public.pricing_plans(id),
    payment_id uuid, -- 결제 내역 ID (나중에 payment_history와 연결)
    initial_credits integer not null check (initial_credits >= 0), -- 구매 시 원본 크레딧
    remaining_credits integer not null check (remaining_credits >= 0), -- 현재 남은 크레딧
    status credit_source_status default 'active', -- 상태 (활성, 환불대기, 환불완료, 소진)
    expires_at timestamptz, -- 만료일 (옵션)
    created_at timestamptz default now()
);

-- FIFO 조회 성능 향상을 위한 인덱스 생성
create index if not exists idx_credit_sources_fifo 
on public.credit_sources (user_id, status, created_at, remaining_credits);

-- 4. 크레딧 거래 내역 (Credit Transactions - Ledger)
-- 모든 크레딧 증감(구매, 사용, 환불)에 대한 불변 로그
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'transaction_type') then
        create type transaction_type as enum ('purchase', 'usage', 'refund', 'bonus', 'admin_adjustment');
    end if;
end $$;

create table if not exists public.credit_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    amount integer not null, -- 양수(지급), 음수(차감)
    type transaction_type not null, -- 거래 유형
    description text, -- 상세 설명
    created_at timestamptz default now()
);

-- 5. 크레딧 소비 상세 (Credit Consumption - Usage Details)
-- 특정 '사용(usage)' 거래가 어떤 '출처(source)'에서 차감되었는지 기록 (N:N 관계 해소)
create table if not exists public.credit_consumption (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    source_id uuid references public.credit_sources(id) not null, -- 차감된 출처
    transaction_id uuid references public.credit_transactions(id) not null, -- 연결된 거래 내역
    amount_deducted integer not null check (amount_deducted > 0), -- 차감된 양 (항상 양수)
    image_id uuid references public.images(id), -- 생성된 이미지 ID (옵션)
    created_at timestamptz default now()
);

-- 6. 환불 요청 (Refund Requests)
-- 'pending_refund' 상태 로직을 지원하기 위한 테이블
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'refund_status') then
        create type refund_status as enum ('pending', 'approved', 'rejected');
    end if;
end $$;

create table if not exists public.refund_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    source_id uuid references public.credit_sources(id) not null, -- 환불 요청한 특정 구매건
    reason text, -- 요청 사유
    status refund_status default 'pending',
    admin_note text, -- 관리자 메모
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 7. 트리거 함수: profiles.credits 자동 동기화 (Sync Trigger)
-- credit_sources 테이블이 변경되면 profiles.credits를 자동으로 재계산하여 정합성 보장
create or replace function public.sync_profile_credits()
returns trigger as $$
begin
    update public.profiles
    set credits = (
        select coalesce(sum(remaining_credits), 0)
        from public.credit_sources
        where user_id = coalesce(new.user_id, old.user_id)
          and status = 'active' -- 'active' 상태인 크레딧만 합산 (환불대기/완료 제외)
          and remaining_credits > 0
    )
    where id = coalesce(new.user_id, old.user_id);
    return null;
end;
$$ language plpgsql security definer;

-- 트리거 부착 (Insert, Update, Delete 시 동작)
drop trigger if exists on_credit_source_change on public.credit_sources;
create trigger on_credit_source_change
after insert or update or delete on public.credit_sources
for each row execute function public.sync_profile_credits();


-- 8. 결제 내역 (Payment History - Simple)
create table if not exists public.payment_history (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    amount integer not null,
    currency text default 'KRW',
    status text, -- 'succeeded', 'failed'
    provider text, -- 'toss', 'test'
    created_at timestamptz default now()
);

-- RLS 정책 (Row Level Security) - 안전하게 정책 생성 (기존 정책 삭제 후 재생성)
-- 1. 요금제: 누구나 조회 가능
alter table public.pricing_plans enable row level security;
drop policy if exists "Public can view active plans" on public.pricing_plans;
create policy "Public can view active plans" on public.pricing_plans for select using (is_active = true);

-- 2. 크레딧 출처: 본인만 조회
alter table public.credit_sources enable row level security;
drop policy if exists "Users can view own sources" on public.credit_sources;
create policy "Users can view own sources" on public.credit_sources for select using (auth.uid() = user_id);

-- 3. 거래 내역: 본인만 조회
alter table public.credit_transactions enable row level security;
drop policy if exists "Users can view own transactions" on public.credit_transactions;
create policy "Users can view own transactions" on public.credit_transactions for select using (auth.uid() = user_id);

-- 4. 환불 요청: 본인만 조회 및 생성
alter table public.refund_requests enable row level security;
drop policy if exists "Users can view own refund requests" on public.refund_requests;
create policy "Users can view own refund requests" on public.refund_requests for select using (auth.uid() = user_id);

drop policy if exists "Users can create refund requests" on public.refund_requests;
create policy "Users can create refund requests" on public.refund_requests for insert with check (auth.uid() = user_id);

-- 5. 결제 내역: 본인만 조회
alter table public.payment_history enable row level security;
drop policy if exists "Users can view own payments" on public.payment_history;
create policy "Users can view own payments" on public.payment_history for select using (auth.uid() = user_id);

-- 6. 소비 내역: 본인만 조회 (스크린샷 보고 추가: UNRESTRICTED 해결)
alter table public.credit_consumption enable row level security;
drop policy if exists "Users can view own consumption" on public.credit_consumption;
create policy "Users can view own consumption" on public.credit_consumption for select using (auth.uid() = user_id);

-- 7. 이미지 테이블: 본인만 조회 (갤러리 노출 문제 해결)
alter table public.images enable row level security;
drop policy if exists "Users can view own images" on public.images;
create policy "Users can view own images" on public.images for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own images" on public.images;
create policy "Users can insert own images" on public.images for insert with check (auth.uid() = user_id);


