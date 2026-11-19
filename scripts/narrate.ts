/*
 * Narração local com Piper (pt-BR), cena por cena.
 *
 *   npm run narrate -- <projeto>            (ex.: exemplo-gta6 → public/projects/exemplo-gta6.json)
 *   opções: --voz pt_BR-faber-medium   --velocidade 1.0 (1.1 = mais rápido)
 *
 * Para cada cena com `narration`, gera public/audio/<projeto>/cena-XX.wav, mede a
 * duração real e ajusta a duração da cena para a fala caber (incluindo a
 * sobreposição da transição seguinte). As legendas passam a usar o tempo real.
 *
 * Requisitos (instalados uma vez por máquina — veja AGENTS.md):
 *   python -m venv ~/.mstools/piper-venv && ~/.mstools/piper-venv/Scripts/pip install piper-tts
 * Variáveis opcionais: PIPER_PYTHON (python do venv), PIPER_VOICES (pasta das vozes).
 */
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import type {VideoSpec} from '../src/production/spec.ts';

const args = process.argv.slice(2);
const opt = (n: string) => {
	const i = args.indexOf(`--${n}`);
	return i >= 0 ? args[i + 1] : undefined;
};
const name = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'))?.replace(/\.json$/, '');
if (!name) {
	console.error('Uso: npm run narrate -- <projeto> [--voz pt_BR-faber-medium] [--velocidade 1.0]');
	process.exit(1);
}

const isWin = process.platform === 'win32';
const PY = process.env.PIPER_PYTHON ?? join(homedir(), '.mstools', 'piper-venv', isWin ? 'Scripts/python.exe' : 'bin/python');
const VOICES = process.env.PIPER_VOICES ?? join(homedir(), '.mstools', 'piper-voices');
const voice = opt('voz') ?? 'pt_BR-faber-medium';
const speed = Number(opt('velocidade') ?? '1');

if (!existsSync(PY)) {
	console.error(`Piper não encontrado em ${PY}. Instale: python -m venv ~/.mstools/piper-venv && pip install piper-tts`);
	process.exit(1);
}
const model = join(VOICES, `${voice}.onnx`);
if (!existsSync(model)) {
	console.log(`Baixando voz ${voice}…`);
	mkdirSync(VOICES, {recursive: true});
	execFileSync(PY, ['-m', 'piper.download_voices', '--data-dir', VOICES, voice], {stdio: 'inherit'});
}

/** Ajustes de pronúncia (edite à vontade). */
const PRONUNCIA: [RegExp, string][] = [
	[/\bGTA\s*VI\b/gi, 'GTA seis'],
	[/\bGTA\s*6\b/gi, 'GTA seis'],
	[/\bIA\b/g, 'I.A.'],
	[/\bapp\b/gi, 'ép'],
	[/\bapps\b/gi, 'éps'],
	[/\bReels\b/g, 'Ríls'],
	[/\b2\.5D\b/gi, 'dois ponto cinco D'],
	[/\bvs\.?\b/gi, 'contra'],
];
const speakable = (t: string) => PRONUNCIA.reduce((s, [re, r]) => s.replace(re, r), t.replace(/[*[\]]/g, ''));

/** Duração de um WAV PCM lendo o cabeçalho (sem depender de ffprobe). */
const probe = (file: string) => {
	const b = readFileSync(file);
	let off = 12;
	let byteRate = 0;
	while (off + 8 <= b.length) {
		const id = b.toString('ascii', off, off + 4);
		const size = b.readUInt32LE(off + 4);
		if (id === 'fmt ') byteRate = b.readUInt32LE(off + 16);
		if (id === 'data') return byteRate ? Math.min(size, b.length - off - 8) / byteRate : 0;
		off += 8 + size + (size % 2);
	}
	throw new Error(`WAV inválido: ${file}`);
};

// mesmos valores de src/production/spec.ts
const TRANS = {'viral-fast': 0.3, cinematic: 0.8, documentary: 0.6} as const;
const LEAD = 0.25; // atraso da voz após o início da cena
const TAIL = 0.35; // respiro após a fala

const file = join('public', 'projects', `${name}.json`);
const spec = JSON.parse(readFileSync(file, 'utf8')) as VideoSpec;
const outDir = join('public', 'audio', name);
mkdirSync(outDir, {recursive: true});
const trans = TRANS[spec.style] ?? 0.6;

spec.scenes.forEach((scene, i) => {
	const text = scene.narration?.trim();
	if (!text) {
		delete scene.voice;
		delete scene.voiceDuration;
		return;
	}
	const rel = `audio/${name}/cena-${String(i + 1).padStart(2, '0')}.wav`;
	const out = join('public', rel);
	execFileSync(PY, ['-X', 'utf8', '-m', 'piper', '-m', model, '-f', out, '--length-scale', String(1 / speed), '--sentence-silence', '0.15'], {
		input: speakable(text),
		stdio: ['pipe', 'ignore', 'ignore'],
	});
	const dur = Math.round(probe(out) * 100) / 100;
	const next = spec.scenes[i + 1];
	const nextOverlap = next && next.transition && next.transition !== 'cut' && next.transition !== 'light-leak' ? trans : 0;
	scene.voice = rel;
	scene.voiceDuration = dur;
	scene.duration = Math.round(Math.max(scene.duration * 0.6, LEAD + dur + TAIL + nextOverlap) * 100) / 100;
	console.log(`cena ${i + 1}: ${dur.toFixed(2)} s de fala → cena ${scene.duration.toFixed(2)} s`);
});

writeFileSync(file, JSON.stringify(spec, null, 2));
const total = spec.scenes.reduce((a, s, i) => a + s.duration - (i > 0 && s.transition && s.transition !== 'cut' && s.transition !== 'light-leak' ? trans : 0), 0);
console.log(`\n✔ Narração gerada (${voice}). Duração total ≈ ${total.toFixed(1)} s`);
if (total > 60) console.log('⚠ Acima de 60 s: corte texto ou use --velocidade 1.1');
console.log(`Prévia: npm run studio → Projeto → projectFile = "${name}.json"`);
