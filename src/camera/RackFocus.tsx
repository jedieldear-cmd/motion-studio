import React from 'react';
import {AbsoluteFill} from 'remotion';
import {lerp, useProgress, type EffectTiming} from '../motion/core';

export type RackFocusProps = EffectTiming & {
	/** Plano de fundo (fica nítido ao final, se direction = 'to-background'). */
	background: React.ReactNode;
	/** Primeiro plano. */
	foreground: React.ReactNode;
	/** Desfoque máximo em px. */
	maxBlur?: number;
	direction?: 'to-background' | 'to-foreground';
	/** "Respiração" de lente: leve zoom durante a troca de foco. */
	breathing?: number;
};

/** 5. Rack Focus — troca de foco entre planos com desfoque e respiração de lente. */
export const RackFocus: React.FC<RackFocusProps> = ({
	background,
	foreground,
	maxBlur = 22,
	direction = 'to-background',
	breathing = 0.03,
	intensity = 1,
	...timing
}) => {
	const {progress} = useProgress({...timing, intensity}, 1.4);
	const p = direction === 'to-background' ? progress : 1 - progress;
	const blur = maxBlur * intensity;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill style={{filter: `blur(${lerp(blur, 0, p)}px)`, scale: String(1 + breathing * p)}}>{background}</AbsoluteFill>
			<AbsoluteFill style={{filter: `blur(${lerp(0, blur * 0.8, p)}px)`, scale: String(1 + breathing * (1 - p) + 0.02)}}>
				{foreground}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
