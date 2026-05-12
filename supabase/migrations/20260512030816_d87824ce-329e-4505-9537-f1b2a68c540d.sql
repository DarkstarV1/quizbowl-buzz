
CREATE TABLE public.question_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL,
  question_number integer NOT NULL,
  player_id uuid,
  team_id uuid,
  points integer NOT NULL DEFAULT 0,
  bonus_points integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_events_game ON public.question_events(game_id, question_number);

ALTER TABLE public.question_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_question_events"
ON public.question_events
FOR ALL
TO public
USING (true)
WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.question_events;
