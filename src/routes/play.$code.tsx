import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGameState } from "@/hooks/use-game-state";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/play/$code")({
  head: () => ({ meta: [{ title: "Play — BuzzBowl" }] }),
  component: PlayPage,
});

function PlayPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { game, teams, players, loading, notFound } = useGameState(code);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem(`bb_player_${code.toUpperCase()}`);
    if (!id) {
      navigate({ to: "/join" });
      return;
    }
    setPlayerId(id);
  }, [code, navigate]);

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Game not found</h1>
          <Link to="/" className="mt-2 inline-block text-primary">← Home</Link>
        </div>
      </main>
    );
  }
  if (loading || !game || !playerId) {
    return <main className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</main>;
  }

  const me = players.find((p) => p.id === playerId);
  const myTeam = teams.find((t) => t.id === me?.team_id);
  const otherTeam = teams.find((t) => t.id !== me?.team_id);

  async function buzz() {
    if (!game || !me) return;
    if (game.buzz_locked || game.buzzed_player_id) return;
    if (me.is_substitute) return;
    await supabase
      .from("games")
      .update({ buzzed_player_id: me.id, buzz_locked: true })
      .eq("id", game.id)
      .is("buzzed_player_id", null);
  }

  const buzzedPlayer = players.find((p) => p.id === game.buzzed_player_id);
  const someoneBuzzed = !!game.buzzed_player_id;
  const meBuzzed = game.buzzed_player_id === me?.id;
  const canBuzz = me && !me.is_substitute && !someoneBuzzed;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-accent">
      <header className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="font-mono text-sm">
          Room <span className="font-bold text-primary tracking-widest">{game.code}</span>
        </div>
        <div className="text-sm text-muted-foreground">Question <span className="font-bold text-foreground">#{game.current_question}</span></div>
      </header>

      <section className="max-w-4xl mx-auto px-4 grid grid-cols-2 gap-4">
        <ScoreCard label="Your team" name={myTeam?.name ?? "—"} score={myTeam?.score ?? 0} accent="team-1" />
        <ScoreCard label="Opponent" name={otherTeam?.name ?? "—"} score={otherTeam?.score ?? 0} accent="team-2" />
      </section>

      <section className="max-w-4xl mx-auto px-4 mt-8 flex flex-col items-center">
        <div className="text-sm text-muted-foreground mb-3">
          Playing as <span className="font-semibold text-foreground">{me?.name}</span>
          {me?.is_substitute && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted">substitute</span>}
        </div>

        <button
          onClick={buzz}
          disabled={!canBuzz}
          className={`relative w-72 h-72 sm:w-80 sm:h-80 rounded-full font-bold text-3xl transition-all ${
            someoneBuzzed
              ? meBuzzed
                ? "bg-buzz text-buzz-foreground scale-105"
                : "bg-muted text-muted-foreground"
              : canBuzz
                ? "bg-buzz text-buzz-foreground buzz-glow hover:scale-105 active:scale-95"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {someoneBuzzed ? (
            <div className="flex flex-col items-center">
              <Zap className="w-10 h-10 mb-2" />
              <span className="text-xl">{buzzedPlayer?.name}</span>
              <span className="text-sm font-normal opacity-80">buzzed in</span>
            </div>
          ) : me?.is_substitute ? (
            "On bench"
          ) : (
            "BUZZ"
          )}
        </button>

        <div className="mt-3 text-sm text-muted-foreground">
          Your score: <span className="font-semibold text-foreground">{me?.score ?? 0}</span>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 mt-10 grid grid-cols-2 gap-4 pb-10">
        {teams.map((t) => (
          <Roster key={t.id} team={t} players={players.filter((p) => p.team_id === t.id)} meId={me?.id} />
        ))}
      </section>
    </main>
  );
}

function ScoreCard({ label, name, score, accent }: { label: string; name: string; score: number; accent: string }) {
  return (
    <div className="bg-card border rounded-2xl p-5 shadow-sm">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-semibold truncate">{name}</div>
      <div className="mt-2 text-4xl font-bold" style={{ color: `var(--${accent})` }}>{score}</div>
    </div>
  );
}

function Roster({ team, players, meId }: { team: { name: string }; players: { id: string; name: string; score: number; is_substitute: boolean }[]; meId?: string }) {
  const active = players.filter((p) => !p.is_substitute);
  const subs = players.filter((p) => p.is_substitute);
  return (
    <div className="bg-card border rounded-2xl p-4">
      <div className="font-semibold text-sm mb-2">{team.name}</div>
      <ul className="space-y-1">
        {active.map((p) => (
          <li key={p.id} className={`flex justify-between text-sm py-1 px-2 rounded ${p.id === meId ? "bg-accent" : ""}`}>
            <span className="truncate">{p.name}</span>
            <span className="font-mono text-muted-foreground">{p.score}</span>
          </li>
        ))}
      </ul>
      {subs.length > 0 && (
        <>
          <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground border-t pt-2">Substitutes</div>
          <ul className="mt-1 space-y-1">
            {subs.map((p) => (
              <li key={p.id} className={`flex justify-between text-xs py-0.5 px-2 rounded text-muted-foreground ${p.id === meId ? "bg-accent" : ""}`}>
                <span className="truncate">{p.name}</span>
                <span className="font-mono">{p.score}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
