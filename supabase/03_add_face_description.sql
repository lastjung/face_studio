-- Add face_description and final_prompt columns to images table
-- You can run this entire block safely even if you already added one of them.

alter table public.images 
add column if not exists face_description text;

alter table public.images 
add column if not exists final_prompt text;
