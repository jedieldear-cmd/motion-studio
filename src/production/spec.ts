import {z} from 'zod';
import {formatIdSchema} from '../presets/formats';
import {styleIdSchema} from '../presets/styles';
import {themeIdSchema} from '../themes/themes';

/*
 * Especificação de um vídeo (VideoSpec). É o "contrato" entre o
 * gerador de storyboard (scripts/storyboard.ts), o Studio e o render.
 * Sem dependências de React/Remotion: pode ser usado em Node.
 */

export const sceneKinds = ['title', 'media', 'map', 'stat', 'cards', 'highlight', 'outro'] as const;
export type SceneKind = (typeof sceneKinds)[number];

export const cameraMoves = ['zoom-in', 'zoom-out', 'parallax', 'shake', 'whip', 'rack-focus', 'speed-ramp', 'none'] as const;
export type CameraMove = (typeof cameraMoves)[number];

export const transitionKinds = ['whip', 'motion-blur', 'glitch', 'cinematic-reveal', 'light-leak', 'cut'] as const;

const point = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]);

export const sceneSchema = z.object({
	kind: z.enum(sceneKinds),
	/** Duração em segundos. */
	duration: z.number().min(0.5).max(30),
	/** Texto principal na tela. *asteriscos* = destaque; [colchetes] = marcador. */
	text: z.string().default(''),
	subtitle: z.string().optional(),
	/** O que é falado nesta cena (gera legendas). */
	narration: z.string().optional(),
	/** Áudio da narração desta cena (gerado por `npm run narrate`). */
	voice: z.string().optional(),
	/** Duração real da fala (s), usada para sincronizar legendas. */
	voiceDuration: z.number().optional(),
	/** Mídia: caminho em public/ (ex.: "video/gameplay-01.mp4") ou URL. */
	media: z.string().optional(),
	mediaTrimStart: z.number().min(0).optional(),
	camera: z.enum(cameraMoves).optional(),
	/** Transição de ENTRADA nesta cena. */
	transition: z.enum(transitionKinds).optional(),
	tag: z.string().optional(),
	icon: z.string().optional(),
	items: z.array(z.string()).optional(),
	stat: z
		.object({
			to: z.number(),
			from: z.number().optional(),
			decimals: z.number().int().min(0).max(3).optional(),
			prefix: z.string().optional(),
			suffix: z.string().optional(),
			label: z.string().optional(),
		})
		.optional(),
	map: z
		.object({
			/** Imagem do mapa (public/...). Sem src = mapa fictício de teste. */
			src: z.string().optional(),
			/** 'satellite' = mergulho com HUD; 'flyover' = sobrevoo inclinado. Padrão: pelo estilo. */
			mode: z.enum(['satellite', 'flyover']).optional(),
			target: point,
			label: z.string().optional(),
			coordinates: z.string().optional(),
			pins: z.array(z.object({at: point, label: z.string().optional()})).optional(),
			route: z.array(point).optional(),
			region: z.array(point).optional(),
		})
		.optional(),
});
export type SceneSpec = z.infer<typeof sceneSchema>;

export const videoSpecSchema = z.object({
	title: z.string().default('Novo vídeo'),
	theme: themeIdSchema.default('gta6'),
	style: styleIdSchema.default('cinematic'),
	format: formatIdSchema.default('vertical'),
	/** Cor de destaque opcional (sobrescreve o tema). */
	accentColor: z.string().optional(),
	scenes: z.array(sceneSchema).min(1),
	/** Narração (public/audio/...). */
	narrationSrc: z.string().optional(),
	/** Trilha licenciada (public/audio/...). */
	musicSrc: z.string().optional(),
	musicVolume: z.number().min(0).max(1).step(0.05).default(0.35),
	/** Efeitos sonoros (whoosh) nas transições. */
	sfxSrc: z.string().optional(),
	/** 'auto' = estimadas do texto; 'file' = Caption[] JSON (Whisper); 'none'. */
	captions: z.enum(['auto', 'file', 'none']).default('auto'),
	captionsFile: z.string().optional(),
	/** Intensidade global das animações (0–2). */
	intensity: z.number().min(0).max(2).step(0.05).default(1),
	showSafeArea: z.boolean().default(false),
	handle: z.string().optional(),
});
export type VideoSpec = z.infer<typeof videoSpecSchema>;

/** Duração (s) de cada transição de entrada, conforme o estilo. */
export const transitionSecondsFor = (style: VideoSpec['style']) =>
	style === 'viral-fast' ? 0.3 : style === 'cinematic' ? 0.8 : 0.6;

/** Layout temporal: início/fim de cada cena, considerando sobreposição das transições. */
export const layoutScenes = (spec: Pick<VideoSpec, 'scenes' | 'style'>, fps: number) => {
	const tf = Math.round(transitionSecondsFor(spec.style) * fps);
	let cursor = 0;
	const items = spec.scenes.map((s, i) => {
		const dur = Math.max(1, Math.round(s.duration * fps));
		const kind = s.transition ?? 'cut';
		// light-leak é overlay (não encurta); cut não tem sobreposição
		const overlap = i === 0 || kind === 'cut' || kind === 'light-leak' ? 0 : Math.min(tf, Math.floor(dur / 2));
		const start = cursor - overlap;
		cursor = start + dur;
		return {index: i, start, dur, overlap, transition: kind};
	});
	return {items, total: Math.max(1, cursor), transitionFrames: tf};
};
