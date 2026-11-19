import React from 'react';
import {AbsoluteFill, Freeze, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, getEasing, type EasingName} from '../motion/core';

export type SpeedKey = {
	/** Tempo de SAÍDA (segundos) no qual a velocidade vale `speed`. */
	at: number;
	/** 1 = normal, 0.25 = câmera lenta, 3 = acelerado. */
	speed: number;
};

export type SpeedRampProps = {
	children: React.ReactNode;
	ramp?: SpeedKey[];
	easing?: EasingName;
	/** Zoom/desfoque proporcional à velocidade (sensação de impacto). */
	intensity?: number;
};

/** Velocidade instantânea no frame de saída `f`. */
const speedAt = (f: number, fps: number, ramp: SpeedKey[], easing: EasingName) => {
	const t = f / fps;
	if (t <= ramp[0].at) return ramp[0].speed;
	const last = ramp[ramp.length - 1];
	if (t >= last.at) return last.speed;
	let i = 0;
	while (i < ramp.length - 2 && t > ramp[i + 1].at) i++;
	const p = getEasing(easing)(interpolate(t, [ramp[i].at, ramp[i + 1].at], [0, 1], clamp01));
	return ramp[i].speed + (ramp[i + 1].speed - ramp[i].speed) * p;
};

/** Frame de origem = integral da velocidade até o frame de saída. */
export const remapFrame = (frame: number, fps: number, ramp: SpeedKey[], easing: EasingName = 'inOut') => {
	let src = 0;
	for (let f = 0; f < frame; f++) src += speedAt(f + 0.5, fps, ramp, easing);
	return src;
};

/**
 * 18. Speed Ramp — remapeia o tempo do conteúdo (vídeo, gameplay ou animação):
 * normal → câmera lenta → acelerado, com curvas suaves. Funciona com <Video>
 * e com qualquer animação controlada por frame.
 */
export const SpeedRamp: React.FC<SpeedRampProps> = ({
	children,
	ramp = [
		{at: 0, speed: 1},
		{at: 0.8, speed: 1},
		{at: 1.3, speed: 0.2},
		{at: 2.4, speed: 0.2},
		{at: 2.9, speed: 2.5},
	],
	easing = 'inOut',
	intensity = 1,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const src = remapFrame(frame, fps, ramp, easing);
	const speed = speedAt(frame, fps, ramp, easing);
	const fast = Math.max(0, speed - 1);
	const slow = Math.max(0, 1 - speed);
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					scale: String(1 + 0.04 * fast * intensity + 0.03 * slow * intensity),
					filter: `blur(${Math.min(6, fast * 2 * intensity)}px) saturate(${1 + slow * 0.25 * intensity}) contrast(${1 + slow * 0.08 * intensity})`,
				}}
			>
				<Freeze frame={Math.floor(src)}>{children}</Freeze>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
