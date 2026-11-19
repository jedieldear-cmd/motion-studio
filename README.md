# Motion Studio

Estúdio de motion graphics (Remotion + React + TypeScript) para Reels, TikTok e Shorts.
20 efeitos reutilizáveis, temas por nicho (GTA VI, AI Tech, Minimal), 3 estilos
(Viral Fast, Cinematic, Documentary), roteiro → storyboard automático e narração local em pt-BR.

## Começar (Windows)

```powershell
git clone <url-deste-repositorio>
cd motion-studio
powershell -ExecutionPolicy Bypass -File .\setup.ps1
npm run studio
```

## Produzir um vídeo

```powershell
npm run storyboard -- roteiros/exemplo-gta6.txt --style cinematic --theme gta6 --narrar
npx remotion render Projeto out/exemplo-gta6.mp4 --props="{\"projectFile\":\"exemplo-gta6.json\"}"
```

Guia completo, regras de qualidade e arquitetura: [AGENTS.md](AGENTS.md).
