/*
 * CLI: roteiro (.txt) → public/projects/<nome>.json + out/<nome>-storyboard.md
 *
 *   npm run storyboard -- roteiros/meu-video.txt --style viral-fast --theme gta6
 *   opções: --name --title --style --theme --format --narration audio/voz.mp3
 *           --narration-seconds 42 --music audio/trilha.mp3 --map assets/mapa.jpg
 *           --handle @canal
 * Mídias: todos os arquivos em public/video e public/assets são usados em rodízio
 * (ou passe --media "video/a.mp4,assets/b.jpg").
 */
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, extname, join} from 'node:path';
import {buildStoryboard, storyboardMarkdown} from '../src/production/storyboard.ts';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--'));
const opt = (name: string) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 ? args[i + 1] : undefined;
};

if (!file || !existsSync(file)) {
	console.error('Uso: npm run storyboard -- <roteiro.txt> [--style viral-fast|cinematic|documentary] [--theme gta6|ai-tech|minimal]');
	process.exit(1);
}

const listMedia = () => {
	const out: string[] = [];
	for (const dir of ['video', 'assets']) {
		const p = join('public', dir);
		if (!existsSync(p)) continue;
		for (const f of readdirSync(p).sort()) if (/\.(mp4|mov|webm|png|jpe?g|webp)$/i.test(f)) out.push(`${dir}/${f}`);
	}
	return out;
};

/** Mede a narração com ffprobe (se instalado). */
const probeSeconds = (src: string) => {
	try {
		const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join('public', src)], {encoding: 'utf8'});
		return Number(out.trim()) || undefined;
	} catch {
		return undefined;
	}
};

const narrationSrc = opt('narration');
const narrationSeconds = opt('narration-seconds') ? Number(opt('narration-seconds')) : narrationSrc ? probeSeconds(narrationSrc) : undefined;
const name = opt('name') ?? basename(file, extname(file));

const {spec, warnings} = buildStoryboard(readFileSync(file, 'utf8'), {
	title: opt('title') ?? name,
	style: (opt('style') as never) ?? 'cinematic',
	theme: (opt('theme') as never) ?? 'gta6',
	format: (opt('format') as never) ?? 'vertical',
	narrationSrc,
	narrationSeconds,
	musicSrc: opt('music'),
	mapSrc: opt('map'),
	handle: opt('handle'),
	media: opt('media')?.split(',').map((s) => s.trim()) ?? listMedia(),
});

mkdirSync('public/projects', {recursive: true});
mkdirSync('out', {recursive: true});
writeFileSync(`public/projects/${name}.json`, JSON.stringify(spec, null, 2));
const md = storyboardMarkdown(spec);
writeFileSync(`out/${name}-storyboard.md`, md);

// --narrar: gera a voz (Piper) logo em seguida e ajusta as durações
if (args.includes('--narrar')) {
	const extra = ['--voz', opt('voz'), '--velocidade', opt('velocidade')].filter((_, i, a) => a[i % 2 === 0 ? i + 1 : i] !== undefined) as string[];
	execFileSync(process.execPath, ['scripts/narrate.ts', name, ...extra], {stdio: 'inherit'});
	const narrated = JSON.parse(readFileSync(`public/projects/${name}.json`, 'utf8'));
	writeFileSync(`out/${name}-storyboard.md`, storyboardMarkdown(narrated));
	console.log(storyboardMarkdown(narrated));
} else {
	console.log(md);
}
console.log('');
warnings.forEach((w) => console.log(`⚠ ${w}`));
console.log(`\n✔ public/projects/${name}.json`);
console.log(`✔ out/${name}-storyboard.md`);
console.log(`\nPrévia:  npm run studio  → composição "Projeto" → projectFile = "${name}.json"`);
console.log(`Render:  npx remotion render Projeto out/${name}.mp4 --props="{\\"projectFile\\":\\"${name}.json\\"}"`);
