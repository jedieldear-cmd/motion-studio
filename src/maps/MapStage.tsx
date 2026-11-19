import React, {createContext, useContext, useMemo} from 'react';
import {AbsoluteFill, Img, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp01, getEasing, smoothNoise, type EasingName} from '../motion/core';
import {useTheme} from '../themes/context';

/*
 * Sistema de mapas 2D determinístico.
 * Coordenadas do mapa são NORMALIZADAS (0..1) sobre a "placa" do mapa.
 * A placa pode ser uma imagem (satélite/mapa real, em public/) ou o mapa
 * fictício procedural (material de teste — não representa lugar real).
 */

export type MapPoint = [number, number];

export type CameraKeyframe = {
	/** Tempo em segundos. */
	t: number;
	/** Centro da câmera (0..1). */
	x: number;
	y: number;
	/** 1 = mapa inteiro cobrindo a tela. */
	zoom: number;
	/** Inclinação (graus) para efeito de sobrevoo. */
	tilt?: number;
	/** Rotação (graus). */
	rotate?: number;
};

type MapCtx = {
	project: (p: MapPoint) => [number, number];
	scale: number;
	zoom: number;
};

const MapContext = createContext<MapCtx | null>(null);
export const useMap = () => {
	const ctx = useContext(MapContext);
	if (!ctx) throw new Error('Use este componente dentro de <MapStage>.');
	return ctx;
};

export const PLATE = 2000;

/** Interpola keyframes de câmera (zoom em escala logarítmica = movimento natural). */
export const cameraAt = (frame: number, fps: number, keys: CameraKeyframe[], easing: EasingName) => {
	const t = frame / fps;
	if (keys.length === 1 || t <= keys[0].t) return keys[0];
	const last = keys[keys.length - 1];
	if (t >= last.t) return last;
	let i = 0;
	while (i < keys.length - 2 && t > keys[i + 1].t) i++;
	const a = keys[i];
	const b = keys[i + 1];
	const p = getEasing(easing)(interpolate(t, [a.t, b.t], [0, 1], clamp01));
	const lz = Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * p;
	return {
		t,
		x: a.x + (b.x - a.x) * p,
		y: a.y + (b.y - a.y) * p,
		zoom: Math.exp(lz),
		tilt: (a.tilt ?? 0) + ((b.tilt ?? 0) - (a.tilt ?? 0)) * p,
		rotate: (a.rotate ?? 0) + ((b.rotate ?? 0) - (a.rotate ?? 0)) * p,
	};
};

export type Island = {cx: number; cy: number; r: number; seed: string};

/** Ilhas do mapa fictício de teste. */
export const DEFAULT_ISLANDS: Island[] = [
	{cx: 0.47, cy: 0.52, r: 0.3, seed: 'main'},
	{cx: 0.8, cy: 0.25, r: 0.09, seed: 'north'},
	{cx: 0.2, cy: 0.85, r: 0.07, seed: 'south'},
	{cx: 0.85, cy: 0.78, r: 0.05, seed: 'keys'},
];

export const islandPath = (isl: Island, size = PLATE) => {
	const n = 72;
	const pts: string[] = [];
	for (let i = 0; i < n; i++) {
		const a = (i / n) * Math.PI * 2;
		const rr =
			isl.r *
			(1 + 0.22 * smoothNoise(isl.seed, (i / n) * 8) + 0.08 * smoothNoise(`${isl.seed}b`, (i / n) * 24));
		pts.push(`${(isl.cx + Math.cos(a) * rr) * size},${(isl.cy + Math.sin(a) * rr * 1.15) * size}`);
	}
	return `M ${pts.join(' L ')} Z`;
};

/** Mapa fictício procedural, estilizado conforme o tema. */
export const ProceduralMap: React.FC<{islands?: Island[]; showGrid?: boolean}> = ({islands = DEFAULT_ISLANDS, showGrid = true}) => {
	const theme = useTheme();
	const roads = useMemo(() => {
		const out: string[] = [];
		const main = islands[0];
		for (let i = 0; i < 18; i++) {
			const a1 = random(`road-a-${i}`) * Math.PI * 2;
			const a2 = a1 + Math.PI * (0.5 + random(`road-b-${i}`));
			const r1 = main.r * (0.2 + random(`road-c-${i}`) * 0.6);
			const r2 = main.r * (0.2 + random(`road-d-${i}`) * 0.6);
			const x1 = (main.cx + Math.cos(a1) * r1) * PLATE;
			const y1 = (main.cy + Math.sin(a1) * r1) * PLATE;
			const x2 = (main.cx + Math.cos(a2) * r2) * PLATE;
			const y2 = (main.cy + Math.sin(a2) * r2) * PLATE;
			const mx = (x1 + x2) / 2 + (random(`road-e-${i}`) - 0.5) * 300;
			const my = (y1 + y2) / 2 + (random(`road-f-${i}`) - 0.5) * 300;
			out.push(`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`);
		}
		return out;
	}, [islands]);
	return (
		<svg width={PLATE} height={PLATE} viewBox={`0 0 ${PLATE} ${PLATE}`}>
			<defs>
				<radialGradient id="ocean" cx="50%" cy="50%" r="75%">
					<stop offset="0%" stopColor={theme.colors.bgAlt} />
					<stop offset="100%" stopColor={theme.colors.bg} />
				</radialGradient>
				<linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor={theme.colors.accent} stopOpacity={0.55} />
					<stop offset="100%" stopColor={theme.colors.primary} stopOpacity={0.45} />
				</linearGradient>
				<pattern id="mapgrid" width={100} height={100} patternUnits="userSpaceOnUse">
					<path d="M 100 0 L 0 0 0 100" fill="none" stroke={theme.colors.text} strokeOpacity={0.07} strokeWidth={2} />
				</pattern>
			</defs>
			<rect width={PLATE} height={PLATE} fill="url(#ocean)" />
			{showGrid ? <rect width={PLATE} height={PLATE} fill="url(#mapgrid)" /> : null}
			{islands.map((isl) => (
				<g key={isl.seed}>
					<path d={islandPath({...isl, r: isl.r * 1.04})} fill="none" stroke={theme.colors.primary} strokeOpacity={0.35} strokeWidth={10} />
					<path d={islandPath(isl)} fill="url(#land)" stroke={theme.colors.text} strokeOpacity={0.5} strokeWidth={3} />
				</g>
			))}
			{roads.map((d, i) => (
				<path key={i} d={d} fill="none" stroke={theme.colors.text} strokeOpacity={0.22} strokeWidth={i % 4 === 0 ? 7 : 3} strokeLinecap="round" />
			))}
		</svg>
	);
};

export type MapStageProps = {
	camera: CameraKeyframe[];
	easing?: EasingName;
	/** Imagem da placa (satélite/mapa). Sem src = mapa fictício de teste. */
	src?: string;
	islands?: Island[];
	/** Atraso (s) aplicado aos keyframes. */
	delay?: number;
	speed?: number;
	/** Perspectiva para o tilt (px). */
	perspective?: number;
	children?: React.ReactNode;
};

/** Palco de mapa: placa + câmera + projeção para overlays em espaço de tela. */
export const MapStage: React.FC<MapStageProps> = ({
	camera,
	easing = 'cinematic',
	src,
	islands,
	delay = 0,
	speed = 1,
	perspective = 1600,
	children,
}) => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();
	const f = Math.max(0, (frame - delay * fps) * speed);
	const cam = cameraAt(f, fps, camera, easing);
	const base = Math.max(width / PLATE, height / PLATE);
	const s = base * cam.zoom;
	const tx = width / 2 - cam.x * PLATE * s;
	const ty = height / 2 - cam.y * PLATE * s;
	const ctx: MapCtx = {
		project: ([x, y]) => [tx + x * PLATE * s, ty + y * PLATE * s],
		scale: s,
		zoom: cam.zoom,
	};
	return (
		<AbsoluteFill style={{overflow: 'hidden', perspective}}>
			<AbsoluteFill
				style={{
					transformOrigin: '50% 60%',
					rotate: `${cam.rotate ?? 0}deg`,
					transform: `rotateX(${cam.tilt ?? 0}deg)`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						width: PLATE,
						height: PLATE,
						transformOrigin: '0 0',
						transform: `translate(${tx}px, ${ty}px) scale(${s})`,
					}}
				>
					{src ? <Img src={src} style={{width: PLATE, height: PLATE, objectFit: 'cover'}} /> : <ProceduralMap islands={islands} />}
				</div>
				<MapContext.Provider value={ctx}>{children}</MapContext.Provider>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** Caminho suave (Catmull-Rom → Bézier) por pontos em espaço de tela. */
export const smoothPath = (pts: [number, number][]) => {
	if (pts.length < 2) return '';
	let d = `M ${pts[0][0]} ${pts[0][1]}`;
	for (let i = 0; i < pts.length - 1; i++) {
		const p0 = pts[Math.max(0, i - 1)];
		const p1 = pts[i];
		const p2 = pts[i + 1];
		const p3 = pts[Math.min(pts.length - 1, i + 2)];
		const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
		const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
		d += ` C ${c1[0]} ${c1[1]}, ${c2[0]} ${c2[1]}, ${p2[0]} ${p2[1]}`;
	}
	return d;
};
