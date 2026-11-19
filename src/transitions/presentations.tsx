import React, {useId} from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, interpolate, random, useVideoConfig} from 'remotion';
import {DirectionalBlur, type WhipDirection} from '../camera/WhipPan';
import {clamp01} from '../motion/core';

/*
 * Transições customizadas para <TransitionSeries.Transition presentation={...} />.
 * Todas são determinísticas (dependem só do progresso).
 */

const dirVec = (d: WhipDirection): [number, number] =>
	({left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1]})[d] as [number, number];

/* ---------------- 16. Motion Blur Transition ---------------- */

type MotionBlurProps = {direction: WhipDirection; maxBlur: number; distance: number};

const MotionBlurComp: React.FC<TransitionPresentationComponentProps<MotionBlurProps>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
	passedProps: {direction, maxBlur, distance},
}) => {
	const {width, height} = useVideoConfig();
	const [vx, vy] = dirVec(direction);
	const size = vx !== 0 ? width : height;
	const blur = Math.sin(p * Math.PI) * maxBlur;
	const offset = presentationDirection === 'exiting' ? p * size * distance : -(1 - p) * size;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill style={{translate: `${vx * offset}px ${vy * offset}px`}}>
				<DirectionalBlur amount={blur} axis={vx !== 0 ? 'x' : 'y'}>
					{children}
				</DirectionalBlur>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** 16. Motion Blur Transition — empurra a cena com desfoque direcional. */
export const motionBlurSlide = (
	props: Partial<MotionBlurProps> = {},
): TransitionPresentation<MotionBlurProps> => ({
	component: MotionBlurComp,
	props: {direction: props.direction ?? 'left', maxBlur: props.maxBlur ?? 50, distance: props.distance ?? 1},
});

/** Whip Pan como transição (chicote rápido com desfoque forte). */
export const whipPan = (props: Partial<MotionBlurProps> = {}): TransitionPresentation<MotionBlurProps> => ({
	component: MotionBlurComp,
	props: {direction: props.direction ?? 'left', maxBlur: props.maxBlur ?? 120, distance: props.distance ?? 1},
});

/* ---------------- 19. Glitch Transition ---------------- */

type GlitchProps = {intensity: number; seed: string; slices: number};

const GlitchComp: React.FC<TransitionPresentationComponentProps<GlitchProps>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
	passedProps: {intensity, seed, slices},
}) => {
	const id = useId().replace(/:/g, '');
	const {width} = useVideoConfig();
	const visible = presentationDirection === 'exiting' ? p < 0.5 : p >= 0.5;
	if (!visible) return null;
	const amount = (1 - Math.abs(p - 0.5) * 2) * intensity; // pico no meio
	const step = Math.floor(p * 24); // muda em "saltos", como um glitch real
	const split = amount * 28;
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<filter id={`rgb-${id}`} x="-5%" y="0" width="110%" height="100%">
					<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
					<feOffset in="r" dx={split} dy={0} result="r2" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
					<feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
					<feOffset in="b" dx={-split} dy={0} result="b2" />
					<feBlend in="r2" in2="g" mode="screen" result="rg" />
					<feBlend in="rg" in2="b2" mode="screen" />
				</filter>
			</svg>
			<AbsoluteFill style={{filter: amount > 0.05 ? `url(#rgb-${id})` : undefined, opacity: 1 - amount * 0.15 * (step % 2)}}>
				{children}
			</AbsoluteFill>
			{amount > 0.15
				? new Array(slices).fill(0).map((_, i) => {
						const top = random(`${seed}-t-${step}-${i}`) * 90;
						const h = 2 + random(`${seed}-h-${step}-${i}`) * 9;
						const dx = (random(`${seed}-x-${step}-${i}`) - 0.5) * width * 0.25 * amount;
						return (
							<AbsoluteFill key={i} style={{clipPath: `inset(${top}% 0 ${Math.max(0, 100 - top - h)}% 0)`, translate: `${dx}px 0px`}}>
								{children}
							</AbsoluteFill>
						);
					})
				: null}
			<AbsoluteFill
				style={{
					background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, transparent 2px 5px)',
					opacity: amount,
					mixBlendMode: 'multiply',
				}}
			/>
		</AbsoluteFill>
	);
};

/** 19. Glitch Transition — separação RGB, fatias deslocadas e scanlines. */
export const glitch = (props: Partial<GlitchProps> = {}): TransitionPresentation<GlitchProps> => ({
	component: GlitchComp,
	props: {intensity: props.intensity ?? 1, seed: props.seed ?? 'glitch', slices: props.slices ?? 4},
});

/* ---------------- 20. Cinematic Reveal ---------------- */

type RevealProps = {shape: 'slit' | 'iris' | 'diagonal'; lineColor: string};

const RevealComp: React.FC<TransitionPresentationComponentProps<RevealProps>> = ({
	children,
	presentationDirection,
	presentationProgress: p,
	passedProps: {shape, lineColor},
}) => {
	if (presentationDirection === 'exiting') {
		return (
			<AbsoluteFill style={{scale: String(1 + p * 0.06), filter: `brightness(${1 - p * 0.6})`}}>{children}</AbsoluteFill>
		);
	}
	const clip =
		shape === 'slit'
			? `inset(${(1 - p) * 50}% 0 ${(1 - p) * 50}% 0)`
			: shape === 'iris'
				? `circle(${p * 75}% at 50% 50%)`
				: `polygon(0 0, ${p * 200}% 0, ${p * 200 - 100}% 100%, 0 100%)`;
	const lineOpacity = interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0], clamp01);
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{clipPath: clip, scale: String(1.12 - p * 0.12)}}>{children}</AbsoluteFill>
			{shape === 'slit' ? (
				<>
					<div style={{position: 'absolute', left: 0, right: 0, top: `${(1 - p) * 50}%`, height: 3, background: lineColor, boxShadow: `0 0 30px 6px ${lineColor}`, opacity: lineOpacity}} />
					<div style={{position: 'absolute', left: 0, right: 0, bottom: `${(1 - p) * 50}%`, height: 3, background: lineColor, boxShadow: `0 0 30px 6px ${lineColor}`, opacity: lineOpacity}} />
				</>
			) : null}
		</AbsoluteFill>
	);
};

/** 20. Cinematic Reveal — abertura em fenda, íris ou diagonal com linha de luz. */
export const cinematicReveal = (props: Partial<RevealProps> = {}): TransitionPresentation<RevealProps> => ({
	component: RevealComp,
	props: {shape: props.shape ?? 'slit', lineColor: props.lineColor ?? '#FFD27A'},
});
