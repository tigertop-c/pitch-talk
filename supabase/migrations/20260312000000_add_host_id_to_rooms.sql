-- Migration to add host_id to rooms table for Single Active Room policy
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS host_id TEXT;

-- Index for faster cleanup lookups
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON public.rooms(host_id);
