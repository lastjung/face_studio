-- 05_recent_features.sql
-- Consolidated migration script for recent features:
-- 1. Pricing Plan Discounts
-- 2. Soft Delete (User Withdrawal)
-- 3. Activity Logging
-- 4. Gallery Permissions Fix

-- ==========================================
-- 1. Pricing Plan Discounts
-- ==========================================
ALTER TABLE public.pricing_plans 
ADD COLUMN IF NOT EXISTS discounted_price integer,
ADD COLUMN IF NOT EXISTS discount_percentage integer;

COMMENT ON COLUMN public.pricing_plans.discounted_price IS 'Discounted price in KRW (Optional)';
COMMENT ON COLUMN public.pricing_plans.discount_percentage IS 'Discount percentage (Display only, calculated)';


-- ==========================================
-- 2. Soft Delete (User Withdrawal)
-- ==========================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Update RLS Policy for Public View (Hide deleted profiles)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone."
ON public.profiles FOR SELECT
USING ( deleted_at IS NULL );


-- ==========================================
-- 3. Activity Logging
-- ==========================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users NOT NULL,
    action_type text NOT NULL CHECK (action_type IN ('LOGIN', 'LOGOUT', 'PAGE_VISIT')),
    path text,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to prevent errors
DROP POLICY IF EXISTS "Users can insert own logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view own logs" ON public.activity_logs;

CREATE POLICY "Users can insert own logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

-- Enable pg_cron for auto-deletion (90 days)
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

SELECT cron.schedule(
    'delete_old_logs',
    '0 3 * * *',
    $$DELETE FROM public.activity_logs WHERE created_at < NOW() - INTERVAL '90 days'$$
);


-- ==========================================
-- 4. Gallery Permissions Fix
-- ==========================================
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Clean up potential conflicting policies
DROP POLICY IF EXISTS "Images are viewable by everyone" ON public.images;
DROP POLICY IF EXISTS "Public view" ON public.images;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.images;
DROP POLICY IF EXISTS "Users can view their own images" ON public.images;
DROP POLICY IF EXISTS "Users can insert their own images" ON public.images;
DROP POLICY IF EXISTS "Users can delete their own images" ON public.images;
DROP POLICY IF EXISTS "Give users access to own folder" ON public.images;

-- Define Strict Policies (Private)
CREATE POLICY "Users can view their own images"
ON public.images FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images"
ON public.images FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
ON public.images FOR DELETE
USING (auth.uid() = user_id);
