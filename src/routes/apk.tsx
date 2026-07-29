import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/apk")({
  head: () => ({
    meta: [
      { title: "LITE — Converter o jogo em APK Android" },
      {
        name: "description",
        content:
          "Tutorial passo a passo para transformar o jogo 3D LITE em um aplicativo APK Android usando Capacitor, sem Unity nem Unreal.",
      },
      { property: "og:title", content: "LITE — Converter o jogo em APK Android" },
      {
        property: "og:description",
        content: "Guia completo com Capacitor, Android Studio e assinatura do APK do jogo LITE.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ApkPage,
});

function Bloco({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border-2 border-hud-border bg-foreground/90 p-3 text-xs leading-relaxed text-background">
      <code>{children}</code>
    </pre>
  );
}

function ApkPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <Link to="/" className="text-sm font-bold underline">
          ← Voltar ao jogo
        </Link>
        <h1 className="fonte-display mt-2 text-3xl font-black">Transformar o LITE em APK Android</h1>
        <p className="mt-1 text-sm opacity-80">
          O jogo é 100% HTML5 + Three.js, então basta empacotá-lo com Capacitor. Você precisa de Node.js, Java JDK 17 e
          Android Studio instalados no seu computador.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">1. Exportar o projeto</h2>
        <p className="text-sm opacity-85">
          No Lovable, use <strong>GitHub → Export to GitHub</strong>, depois clone o repositório e instale as
          dependências.
        </p>
        <Bloco>{`git clone <url-do-seu-repositorio>
cd <pasta-do-projeto>
npm install`}</Bloco>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">2. Instalar o Capacitor</h2>
        <Bloco>{`npm install @capacitor/core @capacitor/android
npm install -D @capacitor/cli
npx cap init LITE app.lovable.lite --web-dir=dist`}</Bloco>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">3. Configurar o capacitor.config.ts</h2>
        <Bloco>{`import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.lite',
  appName: 'LITE',
  webDir: 'dist',
  android: { allowMixedContent: true },
};

export default config;`}</Bloco>
        <p className="text-sm opacity-85">
          Em <code>vite.config.ts</code>, defina <code>base: "./"</code> para os arquivos carregarem via{" "}
          <code>file://</code> dentro do app.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">4. Gerar o build e adicionar o Android</h2>
        <Bloco>{`npm run build
npx cap add android
npx cap sync android`}</Bloco>
        <p className="text-sm opacity-85">
          Sempre que mudar o jogo: <code>npm run build && npx cap sync android</code>.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">5. Ajustes recomendados para jogo</h2>
        <p className="text-sm opacity-85">
          Em <code>android/app/src/main/AndroidManifest.xml</code>, dentro da tag <code>&lt;activity&gt;</code>:
        </p>
        <Bloco>{`android:screenOrientation="sensorLandscape"
android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
android:hardwareAccelerated="true"`}</Bloco>
        <p className="text-sm opacity-85">
          Isso trava o jogo em modo paisagem (ideal para o joystick horizontal) e evita recarregar a cena ao girar o
          aparelho.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">6. Testar no celular</h2>
        <Bloco>{`npx cap open android   # abre o Android Studio
# ou, com o celular conectado via USB e depuração ativada:
npx cap run android`}</Bloco>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">7. Gerar o APK final</h2>
        <p className="text-sm opacity-85">APK de teste (debug):</p>
        <Bloco>{`cd android
./gradlew assembleDebug
# resultado: android/app/build/outputs/apk/debug/app-debug.apk`}</Bloco>
        <p className="text-sm opacity-85">APK assinado para distribuição:</p>
        <Bloco>{`keytool -genkey -v -keystore lite.keystore -alias lite -keyalg RSA -keysize 2048 -validity 10000
cd android
./gradlew assembleRelease
# depois assine em Android Studio: Build > Generate Signed Bundle / APK`}</Bloco>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-bold">Dicas de desempenho no celular</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-85">
          <li>Use qualidade "média" ou "baixa" nas configurações do jogo em aparelhos simples.</li>
          <li>Reduza a distância de renderização para 120–160.</li>
          <li>Ative o shader retrô: ele renderiza em resolução menor e melhora muito o FPS.</li>
          <li>Desative sombras se o FPS ficar abaixo de 30.</li>
        </ul>
      </section>
    </main>
  );
}
