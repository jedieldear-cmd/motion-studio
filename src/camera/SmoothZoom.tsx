import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lerp, useProgress, type EffectTiming} from '../motion/core';

export type SmoothZoomProps = EffectTiming & {
	children: React.ReactNode;
	/** Escala inicial e final. intensity amplia a diferença. */
	from?: number;
	to?: number;
	/** Ponto focal do zoom (CSS transform-origin), ex.: "50% 40%". */
	origin?: string;
	/** Deslocamento extra durante o zoom (px), em [x, y]. */
	drift?: [number, number];
	/** Rotação sutil ao final, em graus. */
	rotate?: number;
};

/** 1. Smooth Zoom — push-in/pull-out suave estilo Ken Burns. */
export const SmoothZoom: React.FC<SmoothZoomProps> = ({
	children,
	from = 1,
	to = 1.18,
	origin = '50% 50%',
	drift = [0, 0],
	rotate = 0,
	intensity = 1,
	...timing
}) => {
	const {progress} = useProgress({...timing, intensity}, 3);
	const target = from + (to - from) * intensity;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					transformOrigin: origin,
					scale: String(lerp(from, target, progress)),
					translate: `${drift[0] * progress * intensity}px ${drift[1] * progress * intensity}px`,
					rotate: `${rotate * progress * intensity}deg`,
				}}
			>
				{children}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
