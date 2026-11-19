import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, getEasing, timingToFrames, type EffectTiming} from '../motion/core';
import {useSafeArea, useTheme} from '../themes/context';

export type CounterAnimationProps = EffectTiming & {
	from?: number;
	to: number;
	decimals?: number;
	prefix?: string;
	suffix?: string;
	label?: string;
	locale?: string;
	fontSize?: number;
	color?: string;
	accentColor?: string;
	/** Barra de progresso abaixo do número. */
	showBar?: boolean;
	vertical?: number;
};

/** 14. Counter Animation — número rolando com easing, formato local e barra de progresso. */
export const CounterAnimation: React.FC<CounterAnimationProps> = ({
	from = 0,
	to,
	decimals = 0,
	prefix = '',
	suffix = '',
	label,
	locale = 'pt-BR',
	fontSize = 210,
	color,
	accentColor,
	showBar = true,
	vertical = 0.42,
	intensity = 1,
	easing = 'expoOut',
	...timing
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const theme = useTheme();
	const sa = useSafeArea();
	const {delay, duration} = timingToFrames(fps, timing, 1.8);
	const p = getEasing(easing)(interpolate(frame, [delay, delay + duration], [0, 1], clamp01));
	const value = from + (to - from) * p;
	const formatted = value.toLocaleString(locale, {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
	const appear = interpolate(frame, [delay - 6, delay + 6], [0, 1], clamp01);
	const done = interpolate(frame, [delay + duration, delay + duration + 8], [0, 1], clamp01);
	const accent = accentColor ?? theme.colors.primary;
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
					textAlign: 'center',
					opacity: appear,
				}}
			>
				<div
					style={{
						fontFamily: theme.fonts.display,
						fontSize,
						lineHeight: 1,
						color: color ?? theme.colors.text,
						fontVariantNumeric: 'tabular-nums',
						scale: String(1 + 0.06 * intensity * Math.sin(done * Math.PI)),
						textShadow: `0 0 ${40 * intensity}px ${accent}aa, 0 10px 30px rgba(0,0,0,0.6)`,
					}}
				>
					<span style={{color: accent}}>{prefix}</span>
					{formatted}
					<span style={{color: accent, fontSize: fontSize * 0.55}}>{suffix}</span>
				</div>
				{showBar ? (
					<div style={{margin: '28px auto 0', width: '70%', height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.14)', overflow: 'hidden'}}>
						<div style={{width: `${p * 100}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${theme.colors.secondary}, ${accent})`}} />
					</div>
				) : null}
				{label ? (
					<div
						style={{
							marginTop: 26,
							fontFamily: theme.fonts.body,
							fontWeight: 600,
							fontSize: fontSize * 0.24,
							color: theme.colors.textMuted,
							letterSpacing: 3,
							textTransform: 'uppercase',
						}}
					>
						{label}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};
