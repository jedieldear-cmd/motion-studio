/*
 * Gerador de storyboard: ROTEIRO (texto) → VideoSpec.
 * Puro TypeScript, sem dependências (roda no Node 22+ e no navegador).
 * Somente imports de TIPO, para o Node executar direto.
 *
 * Marcadores aceitos no roteiro (um bloco = parágrafo separado por linha em branco):
 *   # Título                 → cena de abertura
 *   MAPA: Local A | Local B  → cena de mapa com pins
 *   NUMERO: 128 km | rótulo  → contador
 *   - item / - item          → cartão de informação (lista)
 *   CTA: texto               → encerramento
 *   [midia: video/clip.mp4]  → força a mídia desta cena
 *   [camera: parallax]       → força o movimento de câmera
 * Sem marcador, o sistema escolhe pelo conteúdo (números → contador, etc.).
 */
import type {CameraMove, SceneSpec, VideoSpec} from './spec';

export type StoryboardOptions = {
	title?: string;
	theme?: VideoSpec['theme'];
	style?: VideoSpec['style'];
	format?: VideoSpec['format'];
	/** Duração real da narração (s). Se informada, as cenas são ajustadas a ela. */
	narrationSeconds?: number;
	narrationSrc?: string;
	musicSrc?: string;
	/** Mídias disponíveis (caminhos relativos a public/), usadas em rodízio. */
	media?: string[];
	/** Imagem de mapa (public/...). Sem ela, usa o mapa fictício de teste. */
	mapSrc?: string;
	/** Palavras por segundo da fala (pt-BR ≈ 2,6). */
	wordsPerSecond?: number;
	handle?: string;
};

const STYLE = {
	'viral-fast': {min: 1.4, max: 3.5, trans: 0.3, transitions: ['whip', 'glitch', 'motion-blur', 'cut'], cameras: ['whip', 'shake', 'zoom-in', 'speed-ramp']},
	cinematic: {min: 3, max: 6.5, trans: 0.8, transitions: ['cinematic-reveal', 'light-leak', 'motion-blur'], cameras: ['zoom-in', 'parallax', 'rack-focus', 'zoom-out']},
	documentary: {min: 3, max: 7, trans: 0.6, transitions: ['motion-blur', 'cinematic-reveal', 'light-leak'], cameras: ['zoom-in', 'zoom-out', 'parallax']},
} as const;

const words = (s: string) => s.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

/** Destaca a palavra mais "forte" com *asteriscos* (para o título). */
const emphasize = (text: string) => {
	const ws = words(text);
	if (ws.length < 2) return `*${text}*`;
	let best = 0;
	ws.forEach((w, i) => {
		if (w.replace(/\W/g, '').length > ws[best].replace(/\W/g, '').length) best = i;
	});
	ws[best] = `*${ws[best]}*`;
	return ws.join(' ');
};

/** Marca até 3 palavras-chave com [colchetes] (para WordHighlight). */
const markKeywords = (text: string) => {
	const ws = words(text);
	const ranked = ws
		.map((w, i) => ({i, len: w.replace(/[^\p{L}\p{N}]/gu, '').length}))
		.filter((x) => x.len >= 5)
		.sort((a, b) => b.len - a.len)
		.slice(0, 3)
		.map((x) => x.i);
	return ws.map((w, i) => (ranked.includes(i) ? w.replace(/^(.*?)([.,!?;:…]*)$/u, '[$1]$2') : w)).join(' ');
};

/** Texto curto para a tela (primeira frase, até `max` palavras). */
const headline = (text: string, max = 7) => {
	const first = text.split(/(?<=[.!?])\s/)[0];
	const ws = words(first);
	return ws.length > max ? `${ws.slice(0, max).join(' ')}…` : first;
};

const parseNumber = (text: string) => {
	const m = text.match(/(R\$\s?)?(\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?|\d+(?:[.,]\d+)?)\s*(%|km|mil|milhões|milhoes|bilhões|anos|h|x)?/i);
	if (!m) return null;
	const raw = m[2].replace(/[.\s](?=\d{3}\b)/g, '').replace(',', '.');
	const to = Number(raw);
	if (!Number.isFinite(to) || to < 2) return null;
	return {
		to,
		decimals: raw.includes('.') ? Math.min(2, raw.split('.')[1].length) : 0,
		prefix: m[1] ? 'R$ ' : undefined,
		suffix: m[3] ? (m[3] === '%' ? '%' : ` ${m[3]}`) : undefined,
	};
};

/** Divide blocos longos em frases para manter o ritmo. */
const splitBlocks = (script: string, maxWords: number) => {
	const blocks = script
		.replace(/\r/g, '')
		.split(/\n\s*\n/)
		.map((b) => b.trim())
		.filter(Boolean);
	const out: string[] = [];
	for (const b of blocks) {
		if (/^(#|MAPA:|NUMERO:|NÚMERO:|CTA:|-\s)/im.test(b) || words(b).length <= maxWords) {
			out.push(b);
			continue;
		}
		let cur = '';
		for (const sentence of b.split(/(?<=[.!?])\s+/)) {
			if (cur && words(cur + ' ' + sentence).length > maxWords) {
				out.push(cur);
				cur = sentence;
			} else cur = cur ? `${cur} ${sentence}` : sentence;
		}
		if (cur) out.push(cur);
	}
	return out;
};

export const buildStoryboard = (script: string, opts: StoryboardOptions = {}): {spec: VideoSpec; warnings: string[]} => {
	const style = opts.style ?? 'cinematic';
	const cfg = STYLE[style];
	const wps = opts.wordsPerSecond ?? 2.6;
	const media = opts.media ?? [];
	const warnings: string[] = [];
	const maxWords = style === 'viral-fast' ? 9 : 22;
	const blocks = splitBlocks(script, maxWords);
	let mediaIdx = 0;
	const nextMedia = () => (media.length ? media[mediaIdx++ % media.length] : undefined);

	const scenes: SceneSpec[] = blocks.map((rawBlock, i) => {
		let block = rawBlock;
		let forcedMedia: string | undefined;
		let forcedCamera: CameraMove | undefined;
		block = block.replace(/\[midia:\s*([^\]]+)\]/i, (_, p) => ((forcedMedia = p.trim()), '')).trim();
		block = block.replace(/\[camera:\s*([^\]]+)\]/i, (_, p) => ((forcedCamera = p.trim() as CameraMove), '')).trim();
		const camera: CameraMove = forcedCamera ?? (cfg.cameras[i % cfg.cameras.length] as CameraMove);
		const transition = i === 0 ? undefined : (cfg.transitions[(i - 1) % cfg.transitions.length] as SceneSpec['transition']);
		const base = {duration: 0, transition, camera};

		if (/^#\s*/.test(block)) {
			const t = block.replace(/^#\s*/, '').split('\n')[0];
			const rest = block.split('\n').slice(1).join(' ').trim();
			return {...base, kind: 'title', text: emphasize(t), subtitle: rest || undefined, narration: rest ? `${t}. ${rest}` : t, media: forcedMedia ?? nextMedia()};
		}
		if (/^MAPA:/i.test(block)) {
			const [line, ...restLines] = block.split('\n');
			const labels = line.replace(/^MAPA:\s*/i, '').split('|').map((s) => s.trim()).filter(Boolean);
			const narration = restLines.join(' ').trim() || labels.join(', ');
			const spots: [number, number][] = [[0.42, 0.47], [0.56, 0.56], [0.4, 0.65], [0.52, 0.42], [0.6, 0.66]];
			return {
				...base,
				kind: 'map',
				text: '',
				narration,
				map: {
					src: opts.mapSrc,
					target: [0.48, 0.55],
					label: labels.length === 1 ? labels[0] : undefined,
					pins: labels.length > 1 ? labels.map((l, k) => ({at: spots[k % spots.length], label: l})) : undefined,
					route: labels.length > 1 ? labels.map((_, k) => spots[k % spots.length]) : undefined,
					coordinates: opts.mapSrc ? undefined : 'MAPA ILUSTRATIVO',
				},
			};
		}
		if (/^N[UÚ]MERO:/i.test(block)) {
			const [line, ...restLines] = block.split('\n');
			const [num, label] = line.replace(/^N[UÚ]MERO:\s*/i, '').split('|').map((s) => s.trim());
			const n = parseNumber(num) ?? {to: Number(num) || 0, decimals: 0};
			return {...base, kind: 'stat', text: '', narration: restLines.join(' ').trim() || `${num} ${label ?? ''}`.trim(), stat: {...n, label}, media: forcedMedia};
		}
		if (/^CTA:/i.test(block)) {
			const t = block.replace(/^CTA:\s*/i, '');
			// título curto (até a 1ª vírgula/“com”) + o resto vira o botão
			const [head, ...tail] = t.replace(/[.!]$/, '').split(/,|\s+com\s+|\s+e\s+segue/i);
			const short = words(head).length <= 6 ? head : words(head).slice(0, 5).join(' ');
			return {...base, kind: 'outro', text: emphasize(short.trim()), subtitle: tail.join(' ').trim() ? undefined : undefined, narration: t, media: forcedMedia};
		}
		const lines = block.split('\n');
		const listLines = lines.filter((l) => /^\s*-\s+/.test(l));
		if (listLines.length >= 2) {
			const title = lines.find((l) => !/^\s*-\s+/.test(l))?.trim() || 'Resumo';
			const items = listLines.map((l) => l.replace(/^\s*-\s+/, '').trim());
			return {...base, kind: 'cards', text: title, items, narration: `${title}. ${items.join('. ')}.`, media: forcedMedia ?? nextMedia()};
		}
		const num = parseNumber(block);
		if (num && cfg === STYLE.documentary && words(block).length <= 14) {
			return {...base, kind: 'stat', text: headline(block, 5), narration: block, stat: {...num, label: undefined}};
		}
		const m = forcedMedia ?? nextMedia();
		// alterna mídia e destaque tipográfico para variar o ritmo
		if (!m || i % 3 === 2) {
			return {...base, kind: 'highlight', text: markKeywords(headline(block, 10)), narration: block, media: m};
		}
		return {...base, kind: 'media', text: headline(block, 6), narration: block, media: m};
	});

	// último bloco vira encerramento se ninguém marcou CTA
	if (!scenes.some((s) => s.kind === 'outro')) {
		scenes.push({kind: 'outro', duration: 0, transition: cfg.transitions[0] as SceneSpec['transition'], text: 'Segue para *mais*', narration: '', camera: 'zoom-out'});
	}

	// durações pela fala
	scenes.forEach((s) => {
		const spoken = words(s.narration ?? '').length / wps;
		s.duration = Math.min(cfg.max, Math.max(cfg.min, spoken + 0.6));
	});

	const effective = () => scenes.reduce((a, s) => a + s.duration, 0) - scenes.filter((s, i) => i > 0 && s.transition && s.transition !== 'cut' && s.transition !== 'light-leak').length * cfg.trans;

	if (opts.narrationSeconds) {
		const target = opts.narrationSeconds + 0.8;
		const factor = target / effective();
		scenes.forEach((s) => (s.duration = Math.round(s.duration * factor * 100) / 100));
	}
	scenes.forEach((s) => (s.duration = Math.round(s.duration * 100) / 100));

	const total = effective();
	if (total < 30) warnings.push(`Duração ${total.toFixed(1)} s (abaixo de 30 s). Adicione conteúdo ou use estilo cinematic/documentary.`);
	if (total > 60) warnings.push(`Duração ${total.toFixed(1)} s (acima de 60 s). Corte blocos ou use o estilo viral-fast.`);
	if (!media.length) warnings.push('Nenhuma mídia informada: as cenas usam o cenário de teste. Coloque arquivos em public/video ou public/assets.');

	const spec: VideoSpec = {
		title: opts.title ?? 'Novo vídeo',
		theme: opts.theme ?? 'gta6',
		style,
		format: opts.format ?? 'vertical',
		scenes,
		narrationSrc: opts.narrationSrc,
		musicSrc: opts.musicSrc,
		musicVolume: 0.35,
		captions: 'auto',
		intensity: 1,
		showSafeArea: false,
		handle: opts.handle,
	};
	return {spec, warnings};
};

/** Storyboard legível (Markdown) para revisão antes do render. */
export const storyboardMarkdown = (spec: VideoSpec) => {
	let t = 0;
	const trans = STYLE[spec.style].trans;
	const rows = spec.scenes.map((s, i) => {
		const overlap = i > 0 && s.transition && s.transition !== 'cut' && s.transition !== 'light-leak' ? trans : 0;
		t -= overlap;
		const start = t;
		t += s.duration;
		return `| ${i + 1} | ${start.toFixed(1)}–${t.toFixed(1)} s | ${s.kind} | ${s.camera ?? '-'} | ${s.transition ?? '-'} | ${(s.text || '').replace(/\n/g, ' ')} | ${s.narration ?? ''} | ${s.media ?? 'teste'} |`;
	});
	return [
		`# Storyboard — ${spec.title}`,
		'',
		`Tema: **${spec.theme}** · Estilo: **${spec.style}** · Formato: **${spec.format}** · Duração: **${t.toFixed(1)} s**`,
		'',
		'| # | Tempo | Cena | Câmera | Transição | Texto na tela | Narração | Mídia |',
		'|---|---|---|---|---|---|---|---|',
		...rows,
	].join('\n');
};
