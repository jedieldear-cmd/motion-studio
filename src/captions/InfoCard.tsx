import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, getEasing, timingToFrames, type EffectTiming} from '../motion/core';
import {useTheme} from '../themes/context';

export type InfoCardProps = EffectTiming & {
	title: string;
	/** Itens/linhas do cartão. */
	items?: string[];
	/** Emoji ou texto curto como ícone. */
	icon?: string;
	/** Etiqueta pequena acima do título (ex.: "CONFIRMADO", "RUMOR"). */
	tag?: string;
	accentColor?: string;
	/** Posição (px) do canto superior esquerdo. */
	x?: number;
	y?: number;
	width?: number;
	from?: 'left' | 'right' | 'bottom';
	/** Segundos entre itens. */
	stagger?: number;
	/** Momento (s, relativo ao início) em que o cartão sai. */
	exitAt?: number;
};

/** 15. Animated Info Cards — cartão de vidro com barra de destaque e itens escalonados. */
export const InfoCard: React.FC<InfoCardProps> = ({
	title,
	items = [],
	icon,
	tag,
	accentColor,
	x = 90,
	y = 600,
	width = 820,
	from = 'left',
	stagger = 0.18,
	exitAt,
	intensity = 1,
	easing = 'expoOut',
	...timing
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const theme = useTheme();
	const {delay} = timingToFrames(fps, timing, 0.8);
	const speed = timing.speed ?? 1;
	const local = (frame - delay) * speed;
	const sp = spring({frame: local, fps, config: {damping: 16, stiffness: 120}});
	const exit = exitAt !== undefined ? getEasing('inOut')(interpolate(frame, [(timing.delay ?? 0) * fps + exitAt * fps, (timing.delay ?? 0) * fps + exitAt * fps + 10], [0, 1], clamp01)) : 0;
	const accent = accentColor ?? theme.colors.primary;
	const offset = (1 - sp + exit) * 260 * intensity;
	const tr = from === 'left' ? `${-offset}px 0px` : from === 'right' ? `${offset}px 0px` : `0px ${offset}px`;
	const bar = getEasing(easing)(interpolate(local, [6, 22], [0, 1], clamp01));
	if (local < 0) return null;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width,
				translate: tr,
				opacity: interpolate(sp, [0, 0.4], [0, 1], clamp01) * (1 - exit),
				filter: `blur(${(1 - sp) * 10}px)`,
				padding: '36px 40px 36px 52px',
				borderRadius: theme.radius,
				background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))',
				border: '1.5px solid rgba(255,255,255,0.2)',
				backdropFilter: 'blur(18px)',
				boxShadow: `0 30px 80px rgba(0,0,0,0.45), 0 0 60px ${accent}22`,
				overflow: 'hidden',
				color: theme.colors.text,
				fontFamily: theme.fonts.body,
			}}
		>
			<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: `linear-gradient(180deg, ${accent}, ${theme.colors.secondary})`, scale: `1 ${bar}`, transformOrigin: 'top'}} />
			{tag ? (
				<div style={{display: 'inline-block', fontFamily: theme.fonts.mono, fontSize: 26, fontWeight: 700, letterSpacing: 3, color: theme.colors.bg, background: accent, padding: '6px 14px', borderRadius: 8, marginBottom: 18}}>
					{tag}
				</div>
			) : null}
			<div style={{display: 'flex', alignItems: 'center', gap: 22}}>
				{icon ? <div style={{fontSize: 64, lineHeight: 1}}>{icon}</div> : null}
				<div
					style={{
						fontFamily: theme.fonts.display,
						fontSize: 66,
						lineHeight: 1.05,
						textTransform: theme.uppercaseTitles ? 'uppercase' : 'none',
					}}
				>
					{title}
				</div>
			</div>
			{items.map((it, i) => {
				const ip = spring({frame: local - 10 - (i * stagger * fps) / speed, fps, config: {damping: 18}});
				return (
					<div
						key={i}
						style={{
							display: 'flex',
							gap: 16,
							alignItems: 'baseline',
							marginTop: 18,
							fontSize: 40,
							fontWeight: 600,
							color: theme.colors.textMuted,
							opacity: ip,
							translate: `${(1 - ip) * 40}px 0px`,
						}}
					>
						<span style={{color: accent, fontWeight: 800}}>▸</span>
						<span>{it}</span>
					</div>
				);
			})}
		</div>
	);
};
