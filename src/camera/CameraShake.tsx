import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, smoothNoise, timingToFrames, type EffectTiming} from '../motion/core';

export type CameraShakeProps = EffectTiming & {
	children: React.ReactNode;
	/** Amplitude máxima em px (multiplicada por intensity). */
	amplitude?: number;
	/** Rotação máxima em graus. */
	rotation?: number;
	/** Oscilações por segundo. */
	frequency?: number;
	/** 'handheld' = contínuo; 'impact' = pancada que decai. */
	mode?: 'handheld' | 'impact';
	seed?: string;
};

/** 4. Camera Shake — tremor orgânico (ruído determinístico), contínuo ou de impacto. */
export const CameraShake: React.FC<CameraShakeProps> = ({
	children,
	amplitude = 18,
	rotation = 0.6,
	frequency = 6,
	mode = 'handheld',
	seed = 'shake',
	intensity = 1,
	...timing
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {delay, duration} = timingToFrames(fps, timing, mode === 'impact' ? 0.6 : 999);
	const active = frame >= delay;
	const envelope =
		mode === 'impact'
			? interpolate(frame, [delay, delay + 2, delay + duration], [0, 1, 0], clamp01)
			: active
				? interpolate(frame, [delay, delay + 6], [0, 1], clamp01)
				: 0;
	const t = ((frame - delay) / fps) * frequency * (timing.speed ?? 1);
	const amp = amplitude * intensity * envelope;
	const x = smoothNoise(`${seed}x`, t) * amp;
	const y = smoothNoise(`${seed}y`, t + 31.7) * amp;
	const r = smoothNoise(`${seed}r`, t + 77.1) * rotation * intensity * envelope;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill style={{translate: `${x}px ${y}px`, rotate: `${r}deg`, scale: String(1 + 0.04 * Math.min(1, intensity) * envelope)}}>
				{children}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
