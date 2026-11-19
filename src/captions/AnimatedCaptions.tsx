import React from 'react';
import type {Caption} from '@remotion/captions';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01} from '../motion/core';
import type {CaptionLook} from '../presets/styles';
import {useSafeArea, useStudio} from '../themes/context';

export type {Caption};

/**
 * Gera legendas ESTIMADAS (palavra a palavra) a partir do texto quando
 * ainda não existe transcrição. Para sincronia exata com a narração,
 * substitua por Caption[] vindo do Whisper (formato @remotion/captions).
 */
export const estimateCaptions = (text: string, startMs: number, durationMs: number): Caption[] => {
	const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
	if (words.length === 0) return [];
	// peso por palavra: sílabas aproximadas + pausa em pontuação
	const weights = words.map((w) => Math.max(1, w.replace(/[^\p{L}\p{N}]/gu, '').length / 3) + (/[.,!?;:]$/.test(w) ? 1.2 : 0));
	const total = weights.reduce((a, b) => a + b, 0);
	let t = startMs;
	return words.map((w, i) => {
		const d = (weights[i] / total) * durationMs;
		const c: Caption = {text: (i === 0 ? '' : ' ') + w, startMs: Math.round(t), endMs: Math.round(t + d), timestampMs: Math.round(t + d / 2), confidence: null};
		t += d;
		return c;
	});
};

type Page = {startMs: number; endMs: number; tokens: Caption[]};

export const paginate = (captions: Caption[], wordsPerPage: number): Page[] => {
	const pages: Page[] = [];
	let cur: Caption[] = [];
	const flush = () => {
		if (!cur.length) return;
		// primeira palavra da página sem espaço inicial
		const tokens = cur.map((t, i) => (i === 0 ? {...t, text: t.text.trimStart()} : t.text.startsWith(' ') ? t : {...t, text: ` ${t.text}`}));
		pages.push({startMs: tokens[0].startMs, endMs: tokens[tokens.length - 1].endMs, tokens});
		cur = [];
	};
	captions.forEach((c, i) => {
		const prev = captions[i - 1];
		// quebra: limite de palavras, fim de frase ou pausa (ex.: troca de cena)
		if (cur.length >= wordsPerPage || (prev && (/[.!?…]$/.test(prev.text.trim()) || c.startMs - prev.endMs > 250))) flush();
		cur.push(c);
	});
	flush();
	for (let i = 0; i < pages.length - 1; i++) {
		// mantém a página visível até a próxima (sem buracos curtos)
		if (pages[i + 1].startMs - pages[i].endMs < 400) pages[i].endMs = pages[i + 1].startMs;
	}
	return pages;
};

export type AnimatedCaptionsProps = {
	captions: Caption[];
	look?: CaptionLook;
	wordsPerPage?: number;
	fontSize?: number;
	color?: string;
	activeColor?: string;
	/** Distância extra acima da área segura inferior (px). */
	offsetY?: number;
	intensity?: number;
};

/** 13. Animated Captions — legendas sincronizadas palavra a palavra (punch / elegant / clean). */
export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({captions, look, wordsPerPage, fontSize, color, activeColor, offsetY = 0, intensity = 1}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {theme, style} = useStudio();
	const sa = useSafeArea();
	const lk = look ?? style.captionLook;
	const ms = (frame / fps) * 1000;
	const pages = paginate(captions, wordsPerPage ?? style.wordsPerCaption);
	const page = pages.find((p) => ms >= p.startMs && ms < p.endMs);
	if (!page) return null;
	const pageFrame = frame - Math.round((page.startMs / 1000) * fps);
	const pop = spring({frame: pageFrame, fps, config: {damping: 12, stiffness: 220, mass: 0.5}});
	const fs = fontSize ?? (lk === 'punch' ? 92 : lk === 'elegant' ? 60 : 54);
	const accent = activeColor ?? (lk === 'elegant' ? theme.colors.secondary : theme.colors.primary);
	const base = color ?? theme.colors.text;

	const containerStyle: React.CSSProperties = {
		position: 'absolute',
		left: sa.left,
		right: sa.right,
		bottom: sa.bottom + 20 + offsetY,
		display: 'flex',
		justifyContent: 'center',
	};

	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={containerStyle}>
				<div
					style={{
						textAlign: 'center',
						maxWidth: '100%',
						fontFamily: lk === 'punch' ? theme.fonts.display : theme.fonts.body,
						fontWeight: lk === 'punch' ? 400 : 800,
						fontSize: fs,
						lineHeight: 1.12,
						textTransform: lk === 'punch' ? 'uppercase' : 'none',
						letterSpacing: lk === 'punch' ? 1 : 0,
						padding: lk === 'clean' ? '18px 28px' : 0,
						borderRadius: lk === 'clean' ? 22 : 0,
						background: lk === 'clean' ? 'rgba(8,8,12,0.72)' : 'transparent',
						scale: String(lk === 'punch' ? interpolate(pop, [0, 1], [1 - 0.25 * intensity, 1]) : 1),
						opacity: interpolate(pageFrame, [0, 3], [0, 1], clamp01),
						translate: lk === 'elegant' ? `0px ${(1 - pop) * 16}px` : undefined,
					}}
				>
					{page.tokens.map((tok, i) => {
						const active = ms >= tok.startMs && ms < tok.endMs;
						const spoken = ms >= tok.startMs;
						const tf = frame - Math.round((tok.startMs / 1000) * fps);
						const tokPop = spring({frame: tf, fps, config: {damping: 10, stiffness: 260, mass: 0.4}});
						return (
							<span
								key={i}
								style={{
									whiteSpace: 'pre',
									display: 'inline-block',
									color: active ? accent : base,
									opacity: lk === 'elegant' ? (spoken ? 1 : 0.5) : 1,
									scale: String(lk === 'punch' && active ? 1 + 0.12 * intensity * tokPop : 1),
									WebkitTextStroke: lk === 'punch' ? `${fs * 0.07}px #000` : undefined,
									paintOrder: 'stroke fill',
									textShadow: lk === 'punch' ? `0 ${fs * 0.06}px 0 rgba(0,0,0,0.9)` : '0 2px 3px rgba(0,0,0,0.95), 0 4px 22px rgba(0,0,0,0.85)',
									background: lk === 'clean' && active ? `${accent}33` : undefined,
									borderRadius: 10,
								}}
							>
								{tok.text}
							</span>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
