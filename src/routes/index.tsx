import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BuzzBowl — Quizbowl Buzzer App" },
      { name: "description", content: "Run live quizbowl matches with real-time buzzing, team scoring, and bonus rounds." },
      { property: "og:title", content: "BuzzBowl — Quizbowl Buzzer App" },
      { property: "og:description", content: "Run live quizbowl matches with real-time buzzing, team scoring, and bonus rounds." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-background to-accent">
      <div className="w-full max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
          <Zap className="w-4 h-4" /> Live quizbowl scoring
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-foreground">
          BuzzBowl
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-md mx-auto">
          The fastest way to run a quizbowl match. Buzz in, score teams, and manage rosters in real time.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <Link
            to="/create"
            className="group rounded-2xl bg-primary text-primary-foreground p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <div className="text-2xl font-semibold">Create a Game</div>
            <div className="mt-1 text-primary-foreground/80 text-sm">Host a match and invite players</div>
          </Link>
          <Link
            to="/join"
            className="group rounded-2xl bg-card border-2 border-border p-8 shadow-sm hover:shadow-md hover:border-primary transition-all hover:-translate-y-0.5"
          >
            <div className="text-2xl font-semibold text-foreground">Join a Game</div>
            <div className="mt-1 text-muted-foreground text-sm">Enter a room code to play</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
