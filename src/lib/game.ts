import { supabase } from "@/integrations/supabase/client";

export type Game = {
  id: string;
  code: string;
  current_question: number;
  buzzed_player_id: string | null;
  buzz_locked: boolean;
};
export type Team = { id: string; game_id: string; name: string; side: number; score: number };
export type Player = {
  id: string;
  game_id: string;
  team_id: string | null;
  name: string;
  score: number;
  is_substitute: boolean;
};

export function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function createGame() {
  const code = genCode();
  const { data: game, error } = await supabase
    .from("games")
    .insert({ code })
    .select()
    .single();
  if (error) throw error;
  await supabase.from("teams").insert([
    { game_id: game.id, name: "Team 1", side: 1 },
    { game_id: game.id, name: "Team 2", side: 2 },
  ]);
  return game;
}

export async function findGameByCode(code: string) {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}
