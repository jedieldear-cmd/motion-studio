import React from 'react';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, getEasing, timingToFrames, type EffectTiming} from '../motion/core';
import {useTheme} from '../themes/context';
import {MapStage, smoothPath, useMap, type CameraKeyframe, type MapPoint, type MapStageProps} from './MapStage';

/* ------------------------------------------------------------------ */
/* 6. Map Flyover                                                      */
/* ------------------------------------------------------------------ */

export type MapFlyoverProps = Omit<MapStageProps, 'camera'> & {
	from: MapPoint;
	to: MapPoint;
	zoomFrom?: number;
	zoomTo?: number;
	/** Inclinação máxima (graus) no meio do voo. */
	tilt?: number;
	/** Rotação total (graus). */
	bank?: number;
	duration?: number;
	intensity?: number;
};

/** 6. Map Flyover — sobrevoo com inclinação 3D, rotação e zoom em escala log. */
export const MapFlyover: React.FC<MapFlyoverProps> = ({
	from,
	to,
	zoomFrom = 1.2,
	zoomTo = 3,
	tilt = 38,
	bank = -12,
	duration = 4,
	intensity = 1,
	children,
	...stage
}) => {
	const mid: CameraKeyframe = {
		t: duration / 2,
		x: (from[0] + to[0]) / 2,
		y: (from[1] + to[1]) / 2,
		zoom: Math.sqrt(zoomFrom * zoomTo) * 0.85,
		tilt: tilt * intensity,
		rotate: (bank / 2) * intensity,
	};
	return (
		<MapStage
			{...stage}
			camera={[
				{t: 0, x: from[0], y: from[1], zoom: zoomFrom, tilt: tilt * 0.4 * intensity, rotate: 0},
				mid,
				{t: duration, x: to[0], y: to[1], zoom: zoomTo, tilt: tilt * 0.6 * intensity, rotate: bank * intensity},
			]}
		>
			{children}
		</MapStage>
	);
};

/* ------------------------------------------------------------------ */
/* 7. Animated Pins                                                    */
/* ------------------------------------------------------------------ */

export type PinSpec = {
	at: MapPoint;
	label?: string;
	/** Segundos para o pin cair. */
	delay?: number;
	color?: string;
};

export type AnimatedPinsProps = {
	pins: PinSpec[];
	/** Escala geral dos pins. */
	size?: number;
	intensity?: number;
	speed?: number;
	color?: string;
	labelColor?: string;
	fontFamily?: string;
};

const Pin: React.FC<{spec: PinSpec; size: number; color: string; labelColor: string; font: string; intensity: number; speed: number}> = ({
	spec,
	size,
	color,
	labelColor,
	font,
	intensity,
	speed,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {project} = useMap();
	const start = (spec.delay ?? 0) * fps;
	const local = (frame - start) * speed;
	if (local < 0) return null;
	const drop = spring({frame: local, fps, config: {damping: 11, stiffness: 140, mass: 0.7}});
	const [x, y] = project(spec.at);
	const pulse = (local % 40) / 40;
	const labelIn = interpolate(local, [8, 20], [0, 1], clamp01);
	const c = spec.color ?? color;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
			{/* anel de pulso */}
			<div
				style={{
					position: 'absolute',
					left: -size * 0.9,
					top: -size * 0.35,
					width: size * 1.8,
					height: size * 0.7,
					borderRadius: '50%',
					border: `${3}px solid ${c}`,
					opacity: (1 - pulse) * 0.9 * drop,
					scale: String(0.4 + pulse * 1.4 * intensity),
				}}
			/>
			{/* sombra */}
			<div
				style={{
					position: 'absolute',
					left: -size * 0.3,
					top: -size * 0.1,
					width: size * 0.6,
					height: size * 0.2,
					borderRadius: '50%',
					background: 'rgba(0,0,0,0.5)',
					filter: 'blur(4px)',
					opacity: drop,
				}}
			/>
			{/* pin */}
			<svg
				width={size}
				height={size * 1.3}
				viewBox="0 0 40 52"
				style={{
					position: 'absolute',
					left: -size / 2,
					top: -size * 1.3,
					translate: `0px ${(1 - drop) * -220 * intensity}px`,
					scale: String(0.6 + drop * 0.4),
					transformOrigin: '50% 100%',
					filter: `drop-shadow(0 0 12px ${c})`,
				}}
			>
				<path d="M20 51 C 20 51 2 30 2 19 A 18 18 0 1 1 38 19 C 38 30 20 51 20 51 Z" fill={c} />
				<circle cx={20} cy={19} r={7} fill="#fff" />
			</svg>
			{spec.label ? (
				<div
					style={{
						position: 'absolute',
						left: size * 0.7,
						top: -size * 1.35,
						whiteSpace: 'nowrap',
						fontFamily: font,
						fontSize: size * 0.55,
						fontWeight: 800,
						color: labelColor,
						padding: `${size * 0.12}px ${size * 0.3}px`,
						background: 'rgba(8,6,12,0.78)',
						borderLeft: `4px solid ${c}`,
						borderRadius: 8,
						opacity: labelIn,
						translate: `${(1 - labelIn) * -20}px 0px`,
					}}
				>
					{spec.label}
				</div>
			) : null}
		</div>
	);
};

/** 7. Animated Pins — pins caem com spring, pulsam e revelam rótulos. Use dentro de <MapStage>. */
export const AnimatedPins: React.FC<AnimatedPinsProps> = ({pins, size = 64, intensity = 1, speed = 1, color, labelColor, fontFamily}) => {
	const theme = useTheme();
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{pins.map((p, i) => (
				<Pin
					key={i}
					spec={p}
					size={size}
					color={color ?? theme.colors.primary}
					labelColor={labelColor ?? theme.colors.text}
					font={fontFamily ?? theme.fonts.body}
					intensity={intensity}
					speed={speed}
				/>
			))}
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* 8. Route Reveal                                                     */
/* ------------------------------------------------------------------ */

export type RouteRevealProps = EffectTiming & {
	points: MapPoint[];
	color?: string;
	width?: number;
	dashed?: boolean;
	/** Mostra o "veículo"/cabeça brilhante na ponta. */
	head?: boolean;
};

/** 8. Route Reveal — rota desenhada progressivamente com brilho e cabeça animada. */
export const RouteReveal: React.FC<RouteRevealProps> = ({points, color, width: strokeW = 10, dashed = false, head = true, intensity = 1, ...timing}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {project} = useMap();
	const theme = useTheme();
	const {delay, duration} = timingToFrames(fps, timing, 2.5);
	const p = getEasing(timing.easing ?? 'inOut')(interpolate(frame, [delay, delay + duration], [0, 1], clamp01));
	const d = smoothPath(points.map((pt) => project(pt)));
	if (!d || p <= 0) return null;
	const evo = evolvePath(p, d);
	const len = getLength(d);
	const headPt = getPointAtLength(d, len * p);
	const c = color ?? theme.colors.secondary;
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
			<path d={d} fill="none" stroke={c} strokeOpacity={0.35} strokeWidth={strokeW * 3 * intensity} strokeLinecap="round" style={{filter: 'blur(10px)'}} strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
			<path d={d} fill="none" stroke={c} strokeWidth={strokeW} strokeLinecap="round" strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
			{dashed ? (
				<path d={d} fill="none" stroke={theme.colors.bg} strokeWidth={strokeW * 0.3} strokeDasharray="16 22" strokeDashoffset={-frame * 2} style={{clipPath: 'none'}} opacity={p < 1 ? 0 : 0.8} />
			) : null}
			{head && headPt && p < 1 ? (
				<g>
					<circle cx={headPt.x} cy={headPt.y} r={strokeW * 2.6} fill={c} opacity={0.35} />
					<circle cx={headPt.x} cy={headPt.y} r={strokeW * 1.2} fill="#fff" />
				</g>
			) : null}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/* 9. Region Highlight                                                 */
/* ------------------------------------------------------------------ */

export type RegionHighlightProps = EffectTiming & {
	polygon: MapPoint[];
	label?: string;
	color?: string;
	/** Escurece o resto do mapa. */
	dimOutside?: boolean;
};

/** 9. Region Highlight — contorno desenhado, preenchimento pulsante e foco na região. */
export const RegionHighlight: React.FC<RegionHighlightProps> = ({polygon, label, color, dimOutside = true, intensity = 1, ...timing}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const {project} = useMap();
	const theme = useTheme();
	const {delay, duration} = timingToFrames(fps, timing, 1.6);
	const p = getEasing(timing.easing ?? 'smooth')(interpolate(frame, [delay, delay + duration], [0, 1], clamp01));
	if (p <= 0) return null;
	const pts = polygon.map((pt) => project(pt));
	const d = `M ${pts.map((q) => `${q[0]} ${q[1]}`).join(' L ')} Z`;
	const evo = evolvePath(p, d);
	const fillIn = interpolate(p, [0.5, 1], [0, 1], clamp01);
	const pulse = 0.5 + 0.5 * Math.sin((frame - delay) / 9);
	const c = color ?? theme.colors.primary;
	const cx = pts.reduce((a, q) => a + q[0], 0) / pts.length;
	const cy = pts.reduce((a, q) => a + q[1], 0) / pts.length;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
				<defs>
					<mask id="regionDim">
						<rect width={width} height={height} fill="white" />
						<path d={d} fill="black" />
					</mask>
				</defs>
				{dimOutside ? <rect width={width} height={height} fill="#000" opacity={0.5 * fillIn * intensity} mask="url(#regionDim)" /> : null}
				<path d={d} fill={c} opacity={fillIn * (0.18 + 0.14 * pulse) * intensity} />
				<path d={d} fill="none" stroke={c} strokeWidth={14} opacity={0.4} style={{filter: 'blur(8px)'}} strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
				<path d={d} fill="none" stroke={c} strokeWidth={6} strokeLinejoin="round" strokeDasharray={evo.strokeDasharray} strokeDashoffset={evo.strokeDashoffset} />
			</svg>
			{label ? (
				<div
					style={{
						position: 'absolute',
						left: cx,
						top: cy,
						translate: `-50% ${-50 + (1 - fillIn) * 30}%`,
						opacity: fillIn,
						fontFamily: theme.fonts.display,
						fontSize: 64,
						letterSpacing: 2,
						color: theme.colors.text,
						textTransform: theme.uppercaseTitles ? 'uppercase' : 'none',
						textShadow: `0 0 24px ${c}, 0 4px 18px rgba(0,0,0,0.8)`,
						whiteSpace: 'nowrap',
					}}
				>
					{label}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/* 10. Satellite Zoom                                                  */
/* ------------------------------------------------------------------ */

export type SatelliteZoomProps = Omit<MapStageProps, 'camera'> & {
	target: MapPoint;
	zoomFrom?: number;
	zoomTo?: number;
	duration?: number;
	/** Texto do HUD (ex.: nome do local). */
	label?: string;
	/** Coordenadas exibidas no HUD (texto livre — não inventamos coordenadas). */
	coordinates?: string;
	/** Altitude inicial exibida (km). */
	altitudeFrom?: number;
	altitudeTo?: number;
	hud?: boolean;
	intensity?: number;
};

/** 10. Satellite Zoom — mergulho do "espaço" até o alvo, com HUD e estabilização. */
export const SatelliteZoom: React.FC<SatelliteZoomProps> = ({
	target,
	zoomFrom = 0.9,
	zoomTo = 7,
	duration = 3.5,
	label,
	coordinates,
	altitudeFrom = 420,
	altitudeTo = 0.8,
	hud = true,
	intensity = 1,
	easing = 'cinematic',
	children,
	...stage
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const theme = useTheme();
	const t = frame / fps - (stage.delay ?? 0);
	const p = getEasing(easing)(interpolate(t, [0, duration], [0, 1], clamp01));
	const altitude = Math.exp(Math.log(altitudeFrom) + (Math.log(altitudeTo) - Math.log(altitudeFrom)) * p);
	// blur de velocidade no meio do mergulho
	const speedBlur = Math.sin(p * Math.PI) * 3 * intensity;
	return (
		<AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
			<AbsoluteFill style={{filter: `blur(${speedBlur}px) saturate(${1 + p * 0.3})`}}>
				<MapStage
					{...stage}
					easing={easing}
					camera={[
						{t: 0, x: 0.5, y: 0.5, zoom: zoomFrom, rotate: -8 * intensity},
						{t: duration, x: target[0], y: target[1], zoom: zoomTo, rotate: 0},
					]}
				>
					{children}
				</MapStage>
			</AbsoluteFill>
			{hud ? (
				<AbsoluteFill style={{pointerEvents: 'none', fontFamily: theme.fonts.mono, color: theme.colors.text}}>
					{/* mira */}
					<div style={{position: 'absolute', left: '50%', top: '50%', width: 180, height: 180, translate: '-50% -50%', border: `2px solid ${theme.colors.primary}`, borderRadius: '50%', opacity: 0.8, scale: String(1.6 - p * 0.6)}} />
					<div style={{position: 'absolute', left: '50%', top: '50%', width: 2, height: 260, translate: '-50% -50%', background: theme.colors.primary, opacity: 0.5}} />
					<div style={{position: 'absolute', left: '50%', top: '50%', width: 260, height: 2, translate: '-50% -50%', background: theme.colors.primary, opacity: 0.5}} />
					{/* scanlines */}
					<AbsoluteFill style={{background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 6px)'}} />
					<div style={{position: 'absolute', left: 90, top: 260, fontSize: 30, lineHeight: 1.5, textShadow: '0 2px 8px #000'}}>
						<div style={{color: theme.colors.primary}}>● SAT FEED</div>
						<div>ALT {altitude >= 10 ? altitude.toFixed(0) : altitude.toFixed(1)} KM</div>
						{coordinates ? <div>{coordinates}</div> : null}
					</div>
					{label ? (
						<div
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								bottom: 520,
								textAlign: 'center',
								fontFamily: theme.fonts.display,
								fontSize: 92,
								textTransform: theme.uppercaseTitles ? 'uppercase' : 'none',
								opacity: interpolate(p, [0.75, 1], [0, 1], clamp01),
								translate: `0px ${interpolate(p, [0.75, 1], [30, 0], clamp01)}px`,
								textShadow: `0 0 30px ${theme.colors.primary}, 0 6px 20px rgba(0,0,0,0.9)`,
							}}
						>
							{label}
						</div>
					) : null}
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};
