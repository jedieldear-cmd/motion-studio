import {z} from 'zod';
import {fonts} from './fonts';

export type Theme = {
	id: ThemeId;
	name: string;
	colors: {
		primary: string;
		secondary: string;
		accent: string;
		bg: string;
		bgAlt: string;
		text: string;
		textMuted: string;
	};
	/** Gradiente principal (do topo para a base). */
	gradient: string[];
	fonts: {display: string; body: string; mono: string};
	/** Caixa alta nos títulos. */
	uppercaseTitles: boolean;
	radius: number;
	/** Tipo de cenário de fundo procedural. */
	backdrop: 'sunset' | 'grid' | 'plain';
	/** hueShift do light leak (0 = amarelo/laranja). */
	lightLeakHue: number;
};

export const themeIds = ['gta6', 'ai-tech', 'minimal'] as const;
export type ThemeId = (typeof themeIds)[number];
export const themeIdSchema = z.enum(themeIds);

export const themes: Record<ThemeId, Theme> = {
	/** Vice Sunset — atmosfera tropical, urbana e cinematográfica (nicho GTA VI). */
	gta6: {
		id: 'gta6',
		name: 'Vice Sunset (GTA VI)',
		colors: {
			primary: '#FF3E8A', // rosa sunset
			secondary: '#FF8A3D', // laranja quente
			accent: '#9B4DFF', // roxo neon
			bg: '#08060C', // preto cinematográfico
			bgAlt: '#1A0F24',
			text: '#FFFFFF',
			textMuted: 'rgba(255,255,255,0.74)',
		},
		gradient: ['#1B0A2E', '#5A1660', '#C42D7A', '#FF8A3D'],
		fonts: {display: fonts.anton, body: fonts.inter, mono: fonts.mono},
		uppercaseTitles: true,
		radius: 28,
		backdrop: 'sunset',
		lightLeakHue: 0,
	},
	/** Tecnologia / apps de IA — escuro, ciano, violeta e lima. */
	'ai-tech': {
		id: 'ai-tech',
		name: 'AI Tech',
		colors: {
			primary: '#00E5FF',
			secondary: '#7C5CFF',
			accent: '#B6FF3B',
			bg: '#05070D',
			bgAlt: '#0D1324',
			text: '#F5F8FF',
			textMuted: 'rgba(225,235,255,0.72)',
		},
		gradient: ['#05070D', '#0B1122', '#161B44', '#2E237A'],
		fonts: {display: fonts.grotesk, body: fonts.inter, mono: fonts.mono},
		uppercaseTitles: false,
		radius: 22,
		backdrop: 'grid',
		lightLeakHue: 190,
	},
	/** Neutro editorial — base para qualquer nicho. */
	minimal: {
		id: 'minimal',
		name: 'Minimal Editorial',
		colors: {
			primary: '#FF4D2E',
			secondary: '#FFC530',
			accent: '#FFFFFF',
			bg: '#0E0E0E',
			bgAlt: '#1C1C1C',
			text: '#FFFFFF',
			textMuted: 'rgba(255,255,255,0.72)',
		},
		gradient: ['#0E0E0E', '#151515', '#1E1E1E', '#2A2A2A'],
		fonts: {display: fonts.playfair, body: fonts.inter, mono: fonts.mono},
		uppercaseTitles: false,
		radius: 16,
		backdrop: 'plain',
		lightLeakHue: 20,
	},
};

export const getTheme = (id: ThemeId | undefined): Theme => themes[id ?? 'gta6'] ?? themes.gta6;
