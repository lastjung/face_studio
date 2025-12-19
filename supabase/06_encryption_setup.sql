-- 06_encryption_setup.sql
-- Setup for Application-Level Encryption

-- 1. Add 'email' column to profiles (for encrypted storage)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- 2. DISABLE Automatic Profile Creation (Trigger)
-- We are moving profile creation to the Application Layer to enable encryption.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Note: Existing profiles will have NULL email. 
-- They will be populated (and encrypted) upon next login via 'ensureUserProfile'.
