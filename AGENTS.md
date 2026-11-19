# AGENTS.md — Motion Studio

Instruções permanentes para qualquer agente (Claude Code, Codex, etc.) que trabalhe neste projeto.
Leia antes de editar. Responda ao usuário em **português do Brasil**.

## O que é

Estúdio de motion graphics em **Remotion 4 + React 19 + TypeScript** para vídeos curtos
(Instagram Reels, TikTok, YouTube Shorts) e, opcionalmente, horizontais (YouTube).
É **multi-nicho**: GTA VI é o primeiro tema (`gta6`), mas o mesmo motor serve para
apps de IA (`ai-tech`), conteúdo editorial (`minimal`) e qualquer nicho novo (crie um tema).

## Skills oficiais instaladas

Em `.agents/skills/` (e linkadas em `.claude/skills/`): remotion-best-practices (roteador),
remotion-create, remotion-markup, remotion-maps, remotion-captions, remotion-interactivity,
remotion-studio, remotion-render, remotion-multimedia, remotion-docs, remotion-saas,
remotion-license, remotion-upgrade. Atualize com `npx remotion skills update`.
**Carregue `remotion-best-practices` antes de qualquer trabalho de vídeo.**

## Arquitetura

```
src/
  motion/core.ts         easing nomeado, timing em segundos, ruído determinístico
  camera/                1–5   SmoothZoom, WhipPan, Parallax25D, CameraShake, RackFocus
  maps/                  6–10  MapStage (placa+câmera+projeção), MapEffects, MapLibreMap (real)
  captions/              11–15 KineticTypography, WordHighlight, AnimatedCaptions, CounterAnimation, InfoCard
  transitions/           16–20 presentations (motionBlurSlide, whipPan, glitch, cinematicReveal), LightLeak, SpeedRamp
  themes/                themes.ts (paletas/fontes), context.tsx (StudioProvider, useSafeArea), Scenery.tsx (cenários)
  presets/               styles.ts (VIRAL FAST / CINEMATIC / DOCUMENTARY), formats.ts (tamanhos + áreas seguras)
  scenes/                MediaLayer + cenas prontas (title, media, map, stat, cards, highlight, outro)
  production/            spec.ts (VideoSpec/zod), storyboard.ts (roteiro→cenas), Production.tsx (composição)
  gallery/               registry.ts (catálogo dos 20 efeitos) + EffectShowcase (prévia individual)
  demo/demoSpec.ts       demonstração de 30 s
  Root.tsx               registro de composições
public/  assets/ audio/ video/ projects/     (mídia de entrada e projetos .json)
roteiros/                roteiros .txt de exemplo
scripts/storyboard.ts    CLI roteiro → projeto
out/                     renders (mp4, stills, storyboards)
```

## Regras de qualidade (obrigatórias)

1. **Tudo determinístico e controlado por frame**: `useCurrentFrame()` + `interpolate()`/`spring()`.
   Nada de CSS `transition`/`animation`, `Math.random()` ou `Date.now()`. Use `random(seed)` do Remotion
   e `smoothNoise()` de `motion/core.ts`.
2. **Tempos em segundos na API dos componentes** (`delay`, `duration`), convertidos com o `fps` do
   `useVideoConfig()`. Todo efeito aceita: `delay`, `duration`, `speed`, `intensity`, `easing` e cores.
3. **Cores e fontes vêm do tema** (`useTheme()`), com override por prop. Nunca codifique cor de nicho
   dentro de um efeito genérico.
4. **Áreas seguras**: texto importante dentro de `useSafeArea()` (9:16 → topo 230, base 430, esquerda 70,
   direita 160 px). Legendas acima da margem inferior. Confira com `showSafeArea: true`.
5. **Legibilidade**: títulos ≥ 72 px, legendas ≥ 54 px em 1080×1920, sempre com sombra/contorno.
   Máximo de 2 elementos de texto disputando atenção ao mesmo tempo.
6. **Sem exageros**: transições de 0,3–0,9 s; uma transição chamativa (glitch/whip) a cada 2–3 cortes.
7. **Verdade**: não invente fatos, cenas de gameplay, mapas oficiais, datas ou anúncios sobre jogos.
   Mapas de teste são fictícios e devem ser rotulados ("MAPA DE TESTE"/"ILUSTRATIVO"). Use só trailers
   e músicas que o usuário tem direito de usar.
8. **Não publicar, apagar ou sobrescrever mídia do usuário** sem autorização explícita.
9. Antes de declarar pronto: `npm run typecheck`, render de stills (`npx remotion still ...`) e
   inspeção visual. Para entregas, render do MP4 e `ffprobe` (1080×1920, 30 fps, h264 + aac).

## Identidade visual GTA VI (`gta6` — "Vice Sunset")

Rosa sunset `#FF3E8A` · laranja quente `#FF8A3D` · roxo neon `#9B4DFF` · preto cinematográfico `#08060C` · branco.
Títulos em Anton caixa alta; corpo em Inter. Cenário tropical-urbano original (sol retrô, skyline,
palmeiras, água) gerado por código — **não** copie arte, logos ou mapas da Rockstar.

## Estilos

| Estilo | Cenas | Transições | Câmera | Legenda |
|---|---|---|---|---|
| VIRAL FAST | 1,4–3,5 s | whip, glitch, motion-blur, corte | whip, shake, speed-ramp | punch (2 palavras) |
| CINEMATIC | 3–6,5 s | cinematic-reveal, light-leak | zoom suave, parallax, rack focus | elegant (4) |
| DOCUMENTARY | 3–7 s | motion-blur, reveal | zoom, parallax | clean (4) + mapas/contadores |

## Fluxo de produção

1. Coloque mídias em `public/video` / `public/assets`, narração e trilha em `public/audio`.
2. Escreva o roteiro em `roteiros/<nome>.txt` (marcadores: `# título`, `MAPA: A | B`, `NUMERO: 128 km | rótulo`,
   `- itens`, `CTA:`, `[midia: video/x.mp4]`, `[camera: parallax]`).
3. `npm run storyboard -- roteiros/<nome>.txt --style viral-fast --theme gta6 --narrar`
   → gera `public/projects/<nome>.json`, `out/<nome>-storyboard.md` e, com `--narrar`, a voz de cada cena.
   (Voz gravada por você? Use `--narration audio/voz.mp3` em vez de `--narrar`.)
4. `npm run studio` → composição **Projeto** → `projectFile = <nome>.json`. Ajuste textos/cores/estilo no painel.
5. Render: `npx remotion render Projeto out/<nome>.mp4 --props="{\"projectFile\":\"<nome>.json\"}"`.

## Narração (Piper, local, pt-BR)

- `npm run narrate -- <projeto> [--voz pt_BR-faber-medium] [--velocidade 1.1]` gera
  `public/audio/<projeto>/cena-XX.wav` por cena, mede a duração real e ajusta `duration` de cada cena
  (fala + 0,25 s antes + 0,35 s depois + sobreposição da próxima transição). Grava `voice`/`voiceDuration` no JSON.
- As legendas usam a duração real de cada fala (sincronia por cena; dentro da frase, proporcional às palavras).
- Pronúncia: edite a lista `PRONUNCIA` em `scripts/narrate.ts` (ex.: "GTA VI" → "GTA seis").
- Outras vozes pt-BR do Piper: `pt_BR-cadu-medium`, `pt_BR-jeff-medium`.
- Instalação: `~/.mstools/piper-venv` (piper-tts) e vozes em `~/.mstools/piper-voices` — feito pelo `setup.ps1`.
- VoiceStudio (clonagem/descrição de voz) exige GPU ou ≥16 GB de RAM; numa máquina mais forte, gere o WAV
  nele e use `--narration` ou coloque em `voice` de cada cena.

## Máquina nova

`git clone <repo>` → `cd motion-studio` → `powershell -ExecutionPolicy Bypass -File .\setup.ps1` → `npm run studio`.
Depois abra o Claude Code nessa pasta: o `CLAUDE.md`/`AGENTS.md` e as skills do Remotion carregam sozinhos.

## Como adicionar um efeito

1. Crie o componente na pasta da categoria, aceitando `EffectTiming` (`motion/core.ts`) + cores com fallback no tema.
2. Use `useProgress()`/`timingToFrames()` para o tempo; nunca CSS animations.
3. Registre em `gallery/registry.ts` e adicione o `case` em `gallery/EffectShowcase.tsx` → aparece em
   **Efeitos/** e na **Galeria** do Studio automaticamente.
4. Se fizer sentido em produção, exponha-o em `scenes/Scenes.tsx` (`CameraMoveWrap` ou nova cena) e em `production/spec.ts`.
5. `npm run typecheck` + still render + inspeção visual.

## Como adicionar um nicho/tema

Adicione uma entrada em `themes/themes.ts` (`themeIds` + objeto `Theme`), escolha `backdrop`
(`sunset` | `grid` | `plain`) ou crie um novo cenário em `Scenery.tsx`. Pronto: todas as cenas e efeitos o usam.

## Ambiente (Windows)

- Node 26, FFmpeg 9 (winget), Python 3.13 (para as skills ig-*).
- Caminhos longos (>260 caracteres) quebram o Chrome headless: `remotion.config.ts` usa a cópia em
  `~/.remotion-browser` se existir. Se o projeto for movido para um caminho curto, isso é dispensável.
- Mapas reais (`MapLibreMap`) e Google Fonts precisam de internet no render.
