import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {lerp, useProgress, type EffectTiming} from '../motion/core';

export type ParallaxLayer = {
	/** 0 = infinitamente longe (parado), 1 = primeiro plano. */
	depth: number;
	/** Conteúdo da camada. Use `src` para imagens recortadas (PNG). */
	content?: React.ReactNode;
	src?: string;
	/** Desfoque de profundidade em px. */
	blur?: number;
};

export type Parallax25DProps = EffectTiming & {
	layers: ParallaxLayer[];
	/** Deslocamento total da câmera (px) no primeiro plano. */
	move?: [number, number];
	/** Zoom extra no primeiro plano (dolly). */
	dolly?: number;
};

/**
 * 3. Parallax 2.5D — camadas em profundidades diferentes se movem com
 * velocidades diferentes (e dolly-in proporcional), criando volume.
 */
export const Parallax25D: React.FC<Parallax25DProps> = ({
	layers,
	move = [-160, -40],
	dolly = 0.12,
	intensity = 1,
	...timing
}) => {
	const {progress} = useProgress({...timing, intensity}, 4);
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			{layers.map((layer, i) => {
				const d = layer.depth * intensity;
				const x = move[0] * d * (progress - 0.5) * 2;
				const y = move[1] * d * (progress - 0.5) * 2;
				const s = 1.08 + lerp(0, dolly, progress) * d + d * 0.04;
				return (
					<AbsoluteFill
						key={i}
						style={{
							translate: `${x}px ${y}px`,
							scale: String(s),
							filter: layer.blur ? `blur(${layer.blur}px)` : undefined,
						}}
					>
						{layer.src ? (
							<Img src={layer.src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
						) : (
							layer.content
						)}
					</AbsoluteFill>
				);
			})}
		</AbsoluteFill>
	);
};
