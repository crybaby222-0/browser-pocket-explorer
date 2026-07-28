import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const GameShell = lazy(() => import("@/components/game/GameShell").then((m) => ({ default: m.GameShell })));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LITE — Jogo de Mundo Aberto 3D no Navegador" },
      {
        name: "description",
        content:
          "LITE é um jogo de mundo aberto 3D em HTML5 e WebGL: explore florestas, vilas, lagos e cavernas, faça missões, crie itens e enfrente chefes.",
      },
      { property: "og:title", content: "LITE — Jogo de Mundo Aberto 3D no Navegador" },
      {
        property: "og:description",
        content: "Explore um mundo contínuo e colorido direto do navegador, no celular ou no desktop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="h-dvh w-full overflow-hidden">
      <h1 className="sr-only">LITE — Jogo de mundo aberto 3D em HTML5</h1>
      <Suspense
        fallback={
          <div className="grid h-dvh place-items-center bg-background">
            <p className="fonte-display text-2xl font-black text-foreground">Carregando LITE...</p>
          </div>
        }
      >
        <GameShell />
      </Suspense>
    </main>
  );
}
