-- Fix for Image Deletion Error
-- Problem: Deleting an image fails because 'credit_consumption' table references it.
-- Solution: Change Foreign Key to ON DELETE SET NULL to preserve credit history even if image is deleted.

ALTER TABLE public.credit_consumption
DROP CONSTRAINT IF EXISTS credit_consumption_image_id_fkey;

ALTER TABLE public.credit_consumption
ADD CONSTRAINT credit_consumption_image_id_fkey
FOREIGN KEY (image_id)
REFERENCES public.images(id)
ON DELETE SET NULL;
