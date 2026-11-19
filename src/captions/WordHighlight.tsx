import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, getEasing, type EffectTiming} from '../motion/core';
import {useSafeArea, useTheme} from '../themes/context';

export type WordHighlightProps = EffectTiming & {
	/** Palavras entre [colchetes] recebem o marcador. */
	text: string;
	fontSize?: number;
	color?: string;
	highlightColor?: string;
	/** Cor do texto sobre o marcador. */
	highlightTextColor?: string;
	/** 'marker' = faixa atrás; 'underline' = sublinhado; 'box' = caixa. */
	look?: 'marker' | 'underline' | 'box';
	/** Intervalo entre destaques (s). */
	stagger?: number;
	vertical?: number;
	fontFamily?: string;
};

/** 12. Word Highlight — frase com marcador animado varrendo as palavras-chave. */
export const WordHighlight: React.FC<WordHighlightProps> = ({
	text,
	fontSize = 78,
	color,
	highlightColor,
	highlightTextColor,
	look = 'marker',
	stagger = 0.5,
	vertical = 0.45,
	fontFamily,
	delay = 0,
	duration = 0.45,
	speed = 1,
	intensity = 1,
	easing = 'expoOut',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const theme = useTheme();
	const sa = useSafeArea();
	const tokens = text.split(/(\[[^\]]+\])/g).filter(Boolean);
	const appear = interpolate(frame, [delay * fps, (delay + 0.5) * fps], [0, 1], clamp01);
	let hl = 0;
	const hc = highlightColor ?? theme.colors.primary;
	const usableH = sa.height - sa.top - sa.bottom;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: sa.left,
					right: sa.right,
					top: sa.top + usableH * vertical,
					translate: `0px calc(-50% + ${(1 - appear) * 30}px)`,
					opacity: appear,
					fontFamily: fontFamily ?? theme.fonts.body,
					fontWeight: 800,
					fontSize,
					lineHeight: 1.35,
					textAlign: 'center',
					color: color ?? theme.colors.text,
				}}
			>
				{tokens.map((tok, i) => {
					const isHl = tok.startsWith('[');
					if (!isHl) return <span key={i}>{tok}</span>;
					const order = hl++;
					const start = (delay + 0.4 + (order * stagger) / speed) * fps;
					const p = getEasing(easing)(interpolate(frame, [start, start + (duration * fps) / speed], [0, 1], clamp01));
					const word = tok.slice(1, -1);
					return (
						<span key={i} style={{position: 'relative', display: 'inline-block', padding: '0 0.12em'}}>
							<span
								style={{
									position: 'absolute',
									left: 0,
									bottom: look === 'underline' ? '0.02em' : '0.08em',
									height: look === 'underline' ? '0.12em' : look === 'box' ? '1.1em' : '0.62em',
									width: `${p * 100}%`,
									background: look === 'box' ? 'transparent' : hc,
									border: look === 'box' ? `0.06em solid ${hc}` : undefined,
									borderRadius: '0.12em',
									rotate: look === 'marker' ? '-1.5deg' : '0deg',
									opacity: 0.95,
									scale: `1 ${1 + 0.06 * intensity * Math.sin(p * Math.PI)}`,
								}}
							/>
							<span
								style={{
									position: 'relative',
									color: look === 'marker' && p > 0.5 ? highlightTextColor ?? theme.colors.text : undefined,
									textShadow: p > 0.5 ? `0 0 18px ${hc}` : undefined,
								}}
							>
								{word}
							</span>
						</span>
					);
				})}
			</div>
		</AbsoluteFill>
	);
};
