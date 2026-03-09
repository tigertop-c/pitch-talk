
-- Create room_predictions table
CREATE TABLE IF NOT EXISTS public.room_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    ball_id INTEGER NOT NULL,
    prediction TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(room_id, player_name, ball_id)
);
ALTER TABLE public.room_predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for predictions" ON public.room_predictions FOR ALL USING (true) WITH CHECK (true);

-- Create room_chats table
CREATE TABLE IF NOT EXISTS public.room_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    avatar TEXT NOT NULL DEFAULT '🏏',
    team TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.room_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for chats" ON public.room_chats FOR ALL USING (true) WITH CHECK (true);

-- Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE room_predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE room_chats;

-- Upsert prediction RPC
CREATE OR REPLACE FUNCTION public.upsert_room_prediction(
  p_room_id TEXT,
  p_player_name TEXT,
  p_ball_id INTEGER,
  p_prediction TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO room_predictions (room_id, player_name, ball_id, prediction)
  VALUES (p_room_id, p_player_name, p_ball_id, p_prediction)
  ON CONFLICT (room_id, player_name, ball_id) DO UPDATE SET prediction = p_prediction;
END;
$$;

-- Rooms timestamp trigger
CREATE OR REPLACE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
