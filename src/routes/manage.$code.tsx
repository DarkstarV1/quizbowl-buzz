import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useGameState } from "@/hooks/use-game-state";
import type { Player, Team } from "@/lib/game";
import { Copy, Check, ArrowRight, ArrowLeftRight, ChevronUp, ChevronDown, Zap } from "lucide-react";

export const Route = createFileRoute("/manage/$code")({
  head: () => ({ meta: [{ title: "Manage Game — BuzzBowl" }] }),
  component: ManagePage,
});

function ManagePage() {
  const { code } = Route.useParams();
  const { game, teams, players, loading, notFound } = useGameState(code);
  const [copied, setCopied] = useState(false);
  const [bonusForTeam, setBonusForTeam] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);

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
  if (loading || !game) {
    return <main className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</main>;
  }

  const buzzed = players.find((p) => p.id === game.buzzed_player_id);
  const buzzedTeam = teams.find((t) => t.id === buzzed?.team_id);

  function joinUrl() {
    return `${window.location.origin}/join`;
  }

  async function copyCode() {
    await navigator.clipboard.writeText(game!.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function award(points: number) {
    if (!buzzed || !buzzedTeam) return;
    await supabase.from("players").update({ score: buzzed.score + points }).eq("id", buzzed.id);
    await supabase.from("teams").update({ score: buzzedTeam.score + points }).eq("id", buzzedTeam.id);

    if (points === 10 || points === 15) {
      setBonusForTeam(buzzedTeam.id);
      await supabase.from("games").update({ buzzed_player_id: null, buzz_locked: true }).eq("id", game!.id);
    } else {
      await supabase.from("games").update({ buzzed_player_id: null, buzz_locked: false }).eq("id", game!.id);
    }
  }

  async function applyBonus(points: number) {
    if (!bonusForTeam) return;
    const t = teams.find((x) => x.id === bonusForTeam);
    if (t && points > 0) {
      await supabase.from("teams").update({ score: t.score + points }).eq("id", t.id);
    }
    setBonusForTeam(null);
    await supabase.from("games").update({ buzz_locked: false, buzzed_player_id: null }).eq("id", game!.id);
  }

  async function nextQuestion() {
    setBonusForTeam(null);
    await supabase
      .from("games")
      .update({ current_question: game!.current_question + 1, buzzed_player_id: null, buzz_locked: false })
      .eq("id", game!.id);
  }

  async function clearBuzz() {
    await supabase.from("games").update({ buzzed_player_id: null, buzz_locked: false }).eq("id", game!.id);
  }

  async function movePlayer(player: Player, toTeamId: string | null, asSub: boolean) {
    await supabase
      .from("players")
      .update({ team_id: toTeamId, is_substitute: asSub })
      .eq("id", player.id);
  }

  async function renameTeam(team: Team, name: string) {
    await supabase.from("teams").update({ name }).eq("id", team.id);
    setEditingTeam(null);
  }

  const showBonus = bonusForTeam !== null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-accent">
      <header className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Home</Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Share code:</span>
          <button
            onClick={copyCode}
            className="font-mono text-2xl font-bold tracking-widest text-primary bg-card border-2 border-primary/20 px-4 py-1.5 rounded-lg flex items-center gap-2 hover:bg-accent"
          >
            {game.code}
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-4 h-4" />}
          </button>
          <span className="text-xs text-muted-foreground hidden sm:inline">at {joinUrl()}</span>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 mt-2">
        <div className="bg-card border rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Current question</div>
            <div className="text-3xl font-bold">#{game.current_question}</div>
          </div>
          <button
            onClick={nextQuestion}
            className="bg-primary text-primary-foreground rounded-lg px-5 py-2.5 font-semibold flex items-center gap-2 hover:opacity-90"
          >
            Next question <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-4">
        {showBonus ? (
          <div className="bg-card border-2 border-primary rounded-2xl p-5 shadow-md">
            <div className="text-sm text-muted-foreground">Bonus for</div>
            <div className="text-xl font-bold">{teams.find((t) => t.id === bonusForTeam)?.name}</div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {[0, 10, 20, 30].map((p) => (
                <button
                  key={p}
                  onClick={() => applyBonus(p)}
                  className="rounded-lg bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary font-semibold py-3 transition-colors"
                >
                  +{p}
                </button>
              ))}
            </div>
          </div>
        ) : buzzed ? (
          <div className="bg-buzz text-buzz-foreground rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Zap className="w-4 h-4" /> Buzzed in
            </div>
            <div className="text-2xl font-bold">
              {buzzed.name} <span className="opacity-80 text-base font-normal">· {buzzedTeam?.name}</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <ScoreBtn label="-5" onClick={() => award(-5)} variant="danger" />
              <ScoreBtn label="0" onClick={() => award(0)} variant="neutral" />
              <ScoreBtn label="+10" onClick={() => award(10)} variant="primary" />
              <ScoreBtn label="+15" onClick={() => award(15)} variant="primary" />
            </div>
            <button onClick={clearBuzz} className="mt-2 text-xs underline opacity-80 hover:opacity-100">
              clear buzz
            </button>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl p-5 shadow-sm text-center text-muted-foreground">
            Waiting for a buzz…
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-6 grid md:grid-cols-2 gap-4 pb-10">
        {teams.map((team) => {
          const teamPlayers = players.filter((p) => p.team_id === team.id);
          const active = teamPlayers.filter((p) => !p.is_substitute);
          const subs = teamPlayers.filter((p) => p.is_substitute);
          const otherTeam = teams.find((t) => t.id !== team.id);

          return (
            <div key={team.id} className="bg-card border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                {editingTeam === team.id ? (
                  <input
                    autoFocus
                    defaultValue={team.name}
                    onBlur={(e) => renameTeam(team, e.target.value || team.name)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") renameTeam(team, (e.target as HTMLInputElement).value || team.name);
                      if (e.key === "Escape") setEditingTeam(null);
                    }}
                    className="font-bold text-lg bg-background border rounded px-2 py-1"
                  />
                ) : (
                  <button onClick={() => setEditingTeam(team.id)} className="font-bold text-lg hover:text-primary">
                    {team.name}
                  </button>
                )}
                <div
                  className="text-3xl font-bold"
                  style={{ color: team.side === 1 ? "var(--team-1)" : "var(--team-2)" }}
                >
                  {team.score}
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Playing</div>
                {active.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-1">No active players</div>
                ) : (
                  <ul className="space-y-1">
                    {active.map((p) => (
                      <PlayerRow
                        key={p.id}
                        player={p}
                        otherTeam={otherTeam}
                        onBench={() => movePlayer(p, p.team_id, true)}
                        onSwap={() => otherTeam && movePlayer(p, otherTeam.id, p.is_substitute)}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 border-t pt-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Substitutes</div>
                {subs.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-1">No subs</div>
                ) : (
                  <ul className="space-y-1">
                    {subs.map((p) => (
                      <PlayerRow
                        key={p.id}
                        player={p}
                        otherTeam={otherTeam}
                        isSub
                        onBench={() => movePlayer(p, p.team_id, false)}
                        onSwap={() => otherTeam && movePlayer(p, otherTeam.id, p.is_substitute)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

function ScoreBtn({
  label,
  onClick,
  variant,
}: {
  label: string;
  onClick: () => void;
  variant: "primary" | "neutral" | "danger";
}) {
  const cls =
    variant === "primary"
      ? "bg-buzz-foreground text-buzz hover:opacity-90"
      : variant === "danger"
        ? "bg-destructive text-destructive-foreground hover:opacity-90"
        : "bg-buzz-foreground/30 text-buzz-foreground hover:bg-buzz-foreground/50";
  return (
    <button onClick={onClick} className={`rounded-lg font-bold text-lg py-3 ${cls}`}>
      {label}
    </button>
  );
}

function PlayerRow({
  player,
  otherTeam,
  isSub = false,
  onBench,
  onSwap,
}: {
  player: Player;
  otherTeam?: Team;
  isSub?: boolean;
  onBench: () => void;
  onSwap: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-2 bg-muted/50 hover:bg-muted rounded-lg px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{player.name}</div>
        <div className="text-xs text-muted-foreground">score {player.score}</div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onBench}
          title={isSub ? "Move to playing" : "Move to bench"}
          className="p-1.5 rounded hover:bg-background"
        >
          {isSub ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {otherTeam && (
          <button
            onClick={onSwap}
            title={`Move to ${otherTeam.name}`}
            className="p-1.5 rounded hover:bg-background"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </li>
  );
}
