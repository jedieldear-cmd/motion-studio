import React from 'react';
import {lightLeak} from '@remotion/effects/light-leak';
import {AbsoluteFill, interpolate, Solid, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01} from '../motion/core';
import {useTheme} from '../themes/context';

export type LightLeakProps = {
	seed?: number;
	/** Rotação de matiz (0–360). Padrão: do tema. */
	hueShift?: number;
	/** Opacidade final (intensidade). */
	intensity?: number;
	/** Modo de mistura. 'screen' clareia, como luz real. */
	blend?: React.CSSProperties['mixBlendMode'];
};

/**
 * 17. Light Leak — vazamento de luz orgânico (WebGL via @remotion/effects).
 * Use dentro de <TransitionSeries.Overlay> ou de uma <Sequence>: o progresso
 * vai de 0 a 1 ao longo da duração do container.
 */
export const LightLeak: React.FC<LightLeakProps> = ({seed = 0, hueShift, intensity = 1, blend = 'screen'}) => {
	const frame = useCurrentFrame();
	const {durationInFrames, width, height} = useVideoConfig();
	const theme = useTheme();
	return (
		<AbsoluteFill style={{mixBlendMode: blend, opacity: Math.min(1, intensity), pointerEvents: 'none'}}>
			<Solid
				width={width}
				height={height}
				effects={[
					lightLeak({
						seed,
						hueShift: hueShift ?? theme.lightLeakHue,
						progress: interpolate(frame, [0, durationInFrames - 1], [0, 1], clamp01),
					}),
				]}
			/>
		</AbsoluteFill>
	);
};
