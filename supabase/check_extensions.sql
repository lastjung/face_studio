-- Check if pg_cron extension is available or enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Also checking existing tables is good practice as requested
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
