import {z} from 'zod';

export const formatIds = ['vertical', 'horizontal', 'square'] as const;
export type FormatId = (typeof formatIds)[number];
export const formatIdSchema = z.enum(formatIds);

export const FPS = 30;

export const formats: Record<FormatId, {width: number; height: number; label: string}> = {
	vertical: {width: 1080, height: 1920, label: '9:16 Reels / TikTok / Shorts'},
	horizontal: {width: 1920, height: 1080, label: '16:9 YouTube'},
	square: {width: 1080, height: 1080, label: '1:1 Feed'},
};

/**
 * Áreas de segurança (px). No 9:16 a interface do TikTok/Reels/Shorts cobre
 * o topo (~220px), a base (~420px: descrição, nome, música) e a coluna de
 * botões à direita (~150px). Textos importantes ficam DENTRO dessas margens.
 */
export const safeAreas: Record<FormatId, {top: number; bottom: number; left: number; right: number}> = {
	vertical: {top: 230, bottom: 430, left: 70, right: 160},
	horizontal: {top: 70, bottom: 110, left: 110, right: 110},
	square: {top: 80, bottom: 120, left: 80, right: 80},
};

export const formatFromSize = (width: number, height: number): FormatId => {
	if (width === height) return 'square';
	return width > height ? 'horizontal' : 'vertical';
};
