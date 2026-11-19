import {z} from 'zod';
import type {EasingName} from '../motion/core';

export const styleIds = ['viral-fast', 'cinematic', 'documentary'] as const;
export type StyleId = (typeof styleIds)[number];
export const styleIdSchema = z.enum(styleIds);

export type TransitionKind =
	| 'whip'
	| 'motion-blur'
	| 'glitch'
	| 'cinematic-reveal'
	| 'light-leak'
	| 'cut';
export type CaptionLook = 'punch' | 'elegant' | 'clean';

export type StylePreset = {
	id: StyleId;
	name: string;
	/** Faixa de duração de cena, em segundos. */
	sceneMin: number;
	sceneMax: number;
	/** Transições preferidas, em ordem de rotação. */
	transitions: TransitionKind[];
	transitionSeconds: number;
	cameraIntensity: number;
	shake: number;
	easing: EasingName;
	captionLook: CaptionLook;
	/** Palavras por "página" de legenda. */
	wordsPerCaption: number;
	/** Usa mapas/infográficos sempre que houver dados/locais. */
	preferInfographics: boolean;
};

export const stylePresets: Record<StyleId, StylePreset> = {
	'viral-fast': {
		id: 'viral-fast',
		name: 'VIRAL FAST',
		sceneMin: 1.4,
		sceneMax: 3.5,
		transitions: ['whip', 'glitch', 'motion-blur', 'cut'],
		transitionSeconds: 0.3,
		cameraIntensity: 1.4,
		shake: 0.6,
		easing: 'snappy',
		captionLook: 'punch',
		wordsPerCaption: 2,
		preferInfographics: false,
	},
	cinematic: {
		id: 'cinematic',
		name: 'CINEMATIC',
		sceneMin: 3,
		sceneMax: 6.5,
		transitions: ['cinematic-reveal', 'light-leak', 'motion-blur'],
		transitionSeconds: 0.8,
		cameraIntensity: 0.7,
		shake: 0.1,
		easing: 'cinematic',
		captionLook: 'elegant',
		wordsPerCaption: 4,
		preferInfographics: false,
	},
	documentary: {
		id: 'documentary',
		name: 'DOCUMENTARY',
		sceneMin: 3,
		sceneMax: 7,
		transitions: ['motion-blur', 'cinematic-reveal', 'light-leak'],
		transitionSeconds: 0.6,
		cameraIntensity: 0.6,
		shake: 0,
		easing: 'smooth',
		captionLook: 'clean',
		wordsPerCaption: 4,
		preferInfographics: true,
	},
};

export const getStyle = (id: StyleId | undefined): StylePreset => stylePresets[id ?? 'cinematic'];
