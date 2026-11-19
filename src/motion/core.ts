import {Easing, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

/** Curvas de easing nomeadas, usadas por todos os efeitos. */
export const easingNames = [
	'linear',
	'smooth',
	'snappy',
	'cinematic',
	'expoOut',
	'backOut',
	'inOut',
] as const;
export type EasingName = (typeof easingNames)[number];
export const easingSchema = z.enum(easingNames);

export const getEasing = (name: EasingName = 'smooth'): ((t: number) => number) => {
	switch (name) {
		case 'linear':
			return Easing.linear;
		case 'smooth':
			return Easing.bezier(0.45, 0, 0.2, 1);
		case 'snappy':
			return Easing.bezier(0.2, 0.9, 0.1, 1);
		case 'cinematic':
			return Easing.bezier(0.65, 0, 0.35, 1);
		case 'expoOut':
			return Easing.bezier(0.16, 1, 0.3, 1);
		case 'backOut':
			return Easing.bezier(0.34, 1.56, 0.64, 1);
		case 'inOut':
			return Easing.inOut(Easing.cubic);
		default:
			return Easing.linear;
	}
};

/**
 * Parâmetros comuns a todos os efeitos. Tempos em SEGUNDOS
 * (convertidos para frames com o fps da composição).
 */
export type EffectTiming = {
	/** Momento de entrada, em segundos, relativo ao início da Sequence. */
	delay?: number;
	/** Duração da animação principal, em segundos. */
	duration?: number;
	/** Multiplicador de velocidade (2 = duas vezes mais rápido). */
	speed?: number;
	/** 0 a 2. 1 = padrão. */
	intensity?: number;
	easing?: EasingName;
};

export const clamp01 = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Converte timing (segundos) em frames considerando a velocidade. */
export const timingToFrames = (fps: number, t: EffectTiming, fallbackDuration = 1.2) => {
	const speed = t.speed ?? 1;
	const delay = Math.round((t.delay ?? 0) * fps);
	const duration = Math.max(1, Math.round(((t.duration ?? fallbackDuration) * fps) / speed));
	return {delay, duration};
};

/** Progresso 0..1 (com easing) de um efeito, controlado por frame. */
export const useProgress = (t: EffectTiming, fallbackDuration = 1.2) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {delay, duration} = timingToFrames(fps, t, fallbackDuration);
	const raw = interpolate(frame, [delay, delay + duration], [0, 1], clamp01);
	return {
		progress: getEasing(t.easing)(raw),
		raw,
		frame,
		fps,
		delay,
		duration,
		local: frame - delay,
	};
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ruído determinístico suave (value noise 1D) — seguro para render. */
export const smoothNoise = (seed: string, x: number) => {
	const i = Math.floor(x);
	const f = x - i;
	const a = random(`${seed}-${i}`) * 2 - 1;
	const b = random(`${seed}-${i + 1}`) * 2 - 1;
	const u = f * f * (3 - 2 * f);
	return a + (b - a) * u;
};

/** Converte segundos em frames. */
export const sec = (fps: number, s: number) => Math.round(s * fps);
