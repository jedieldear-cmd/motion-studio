import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, getEasing, type EffectTiming} from '../motion/core';
import {useSafeArea, useTheme} from '../themes/context';

export type KineticMode = 'rise' | 'pop' | 'slide' | 'blur' | 'stack';

export type KineticTypographyProps = EffectTiming & {
	/** Linhas separadas por \n. Palavras entre *asteriscos* recebem a cor de destaque. */
	text: string;
	mode?: KineticMode;
	fontSize?: number;
	/** Intervalo entre palavras, em segundos. */
	stagger?: number;
	color?: string;
	accentColor?: string;
	align?: 'left' | 'center' | 'right';
	/** Posição vertical do bloco (0 = topo da área segura, 1 = base). */
	vertical?: number;
	fontFamily?: string;
	uppercase?: boolean;
	/** Saída (segundos após a entrada) — opcional. */
	exitAt?: number;
};

type Word = {text: string; accent: boolean; line: number; index: number};

export const parseWords = (text: string): Word[] => {
	const out: Word[] = [];
	let index = 0;
	text.split('\n').forEach((line, li) => {
		line
			.split(/\s+/)
			.filter(Boolean)
			.forEach((w) => {
				const accent = /^\*.*\*$/.test(w) || /^\*/.test(w);
				out.push({text: w.replace(/\*/g, ''), accent, line: li, index: index++});
			});
	});
	return out;
};

const WordView: React.FC<{
	word: Word;
	start: number;
	mode: KineticMode;
	fontSize: number;
	color: string;
	accentColor: string;
	intensity: number;
	easing: EffectTiming['easing'];
	exitFrame?: number;
}> = ({word, start, mode, fontSize, color, accentColor, intensity, easing, exitFrame}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const local = frame - start;
	const sp = spring({frame: local, fps, config: {damping: 14, stiffness: 160, mass: 0.6}});
	const lin = getEasing(easing)(interpolate(local, [0, 10], [0, 1], clamp01));
	const exit = exitFrame !== undefined ? interpolate(frame, [exitFrame, exitFrame + 8], [0, 1], clamp01) : 0;
	let style: React.CSSProperties = {};
	switch (mode) {
		case 'rise':
			style = {translate: `0px ${(1 - sp) * fontSize * 0.9 * intensity}px`, opacity: lin};
			break;
		case 'pop':
			style = {scale: String(interpolate(sp, [0, 1], [0.2, 1])), opacity: lin, rotate: `${(1 - sp) * -8 * intensity}deg`};
			break;
		case 'slide':
			style = {translate: `${(1 - sp) * -fontSize * 1.5 * intensity}px 0px`, opacity: lin};
			break;
		case 'blur':
			style = {filter: `blur(${(1 - lin) * 18 * intensity}px)`, opacity: lin, scale: String(1.15 - 0.15 * lin)};
			break;
		case 'stack':
			style = {scale: String(interpolate(sp, [0, 1], [2.4 * intensity + 0.01, 1])), opacity: lin};
			break;
	}
	return (
		<span
			style={{
				display: 'inline-block',
				marginRight: fontSize * 0.22,
				color: word.accent ? accentColor : color,
				textShadow: word.accent ? `0 0 ${fontSize * 0.35}px ${accentColor}88` : '0 6px 24px rgba(0,0,0,0.55)',
				...style,
				opacity: (style.opacity as number) * (1 - exit),
				clipPath: undefined,
			}}
		>
			{word.text}
		</span>
	);
};

/** 11. Kinetic Typography — palavras animadas em sequência (rise, pop, slide, blur, stack). */
export const KineticTypography: React.FC<KineticTypographyProps> = ({
	text,
	mode = 'rise',
	fontSize = 120,
	stagger = 0.09,
	color,
	accentColor,
	align = 'center',
	vertical = 0.45,
	fontFamily,
	uppercase,
	delay = 0,
	speed = 1,
	intensity = 1,
	easing = 'expoOut',
	exitAt,
}) => {
	const theme = useTheme();
	const sa = useSafeArea();
	const {fps} = useVideoConfig();
	const words = parseWords(text);
	const lines = Array.from(new Set(words.map((w) => w.line)));
	const usableH = sa.height - sa.top - sa.bottom;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: sa.left,
					right: sa.right,
					top: sa.top + usableH * vertical,
					translate: '0 -50%',
					textAlign: align,
					fontFamily: fontFamily ?? theme.fonts.display,
					fontSize,
					lineHeight: 1.02,
					textTransform: uppercase ?? theme.uppercaseTitles ? 'uppercase' : 'none',
					letterSpacing: theme.uppercaseTitles ? 1 : -1,
					fontWeight: 800,
				}}
			>
				{lines.map((li) => (
					<div key={li}>
						{words
							.filter((w) => w.line === li)
							.map((w) => (
								<WordView
									key={w.index}
									word={w}
									start={Math.round((delay + (w.index * stagger) / speed) * fps)}
									mode={mode}
									fontSize={fontSize}
									color={color ?? theme.colors.text}
									accentColor={accentColor ?? theme.colors.primary}
									intensity={intensity}
									easing={easing}
									exitFrame={exitAt !== undefined ? Math.round((delay + exitAt) * fps) : undefined}
								/>
							))}
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};
