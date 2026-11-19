import React, {useId} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, getEasing, timingToFrames, type EffectTiming} from '../motion/core';

export type WhipDirection = 'left' | 'right' | 'up' | 'down';

/** Desfoque direcional real (blur só no eixo do movimento) via filtro SVG. */
export const DirectionalBlur: React.FC<{
	amount: number;
	axis: 'x' | 'y';
	children: React.ReactNode;
}> = ({amount, axis, children}) => {
	const id = useId().replace(/:/g, '');
	if (amount < 0.3) return <AbsoluteFill>{children}</AbsoluteFill>;
	return (
		<AbsoluteFill>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id={`dblur-${id}`} x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation={axis === 'x' ? `${amount} 0` : `0 ${amount}`} />
				</filter>
			</svg>
			<AbsoluteFill style={{filter: `url(#dblur-${id})`}}>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

export type WhipPanProps = EffectTiming & {
	children: React.ReactNode;
	direction?: WhipDirection;
	/** 'in' = conteúdo chega chicoteando; 'out' = sai chicoteando. */
	mode?: 'in' | 'out';
	/** Desfoque máximo em px. */
	maxBlur?: number;
};

const vec = (d: WhipDirection) =>
	({left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1]})[d] as [number, number];

/** 2. Whip Pan — movimento chicoteado com desfoque direcional proporcional à velocidade. */
export const WhipPan: React.FC<WhipPanProps> = ({
	children,
	direction = 'left',
	mode = 'in',
	maxBlur = 60,
	intensity = 1,
	easing = 'expoOut',
	...timing
}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {delay, duration} = timingToFrames(fps, timing, 0.45);
	const raw = interpolate(frame, [delay, delay + duration], [0, 1], clamp01);
	const ease = getEasing(mode === 'in' ? easing : 'inOut');
	const p = ease(raw);
	// velocidade aproximada (derivada numérica) para modular o blur
	const p2 = ease(Math.min(1, raw + 1 / duration));
	const velocity = Math.abs(p2 - p) * duration;
	const [vx, vy] = vec(direction);
	const travel = mode === 'in' ? 1 - p : -p;
	const dist = (vx !== 0 ? width : height) * travel * intensity;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill style={{translate: `${-vx * dist}px ${-vy * dist}px`}}>
				<DirectionalBlur amount={Math.min(maxBlur, velocity * maxBlur * intensity * 0.6)} axis={vx !== 0 ? 'x' : 'y'}>
					{children}
				</DirectionalBlur>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
