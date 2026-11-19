import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {useSafeArea, useTheme} from './context';

/*
 * Cenários procedurais ORIGINAIS (não reproduzem arte de nenhum jogo).
 * Servem como material de teste e como fundo quando não há mídia.
 */

export const SkyGradient: React.FC<{colors?: string[]}> = ({colors}) => {
	const theme = useTheme();
	const c = colors ?? theme.gradient;
	return (
		<AbsoluteFill
			style={{background: `linear-gradient(180deg, ${c.map((x, i) => `${x} ${(i / (c.length - 1)) * 100}%`).join(', ')})`}}
		/>
	);
};

/** Sol retrô com faixas horizontais. */
export const Sun: React.FC<{size?: number; y?: number; colorTop?: string; colorBottom?: string}> = ({
	size = 620,
	y = 0.5,
	colorTop,
	colorBottom,
}) => {
	const theme = useTheme();
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const top = colorTop ?? '#FFD27A';
	const bottom = colorBottom ?? theme.colors.primary;
	const stripes = 7;
	const drift = Math.sin(frame / 90) * 6;
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={top} />
					<stop offset="100%" stopColor={bottom} />
				</linearGradient>
				<mask id="sunMask">
					<rect width={width} height={height} fill="white" />
					{new Array(stripes).fill(0).map((_, i) => {
						const t = i / stripes;
						const h = 4 + t * 22;
						const yy = height * y + size * 0.05 + t * size * 0.45 + ((frame * 0.4) % 24);
						return <rect key={i} x={0} y={yy} width={width} height={h} fill="black" />;
					})}
				</mask>
				<radialGradient id="sunGlow">
					<stop offset="0%" stopColor={bottom} stopOpacity={0.55} />
					<stop offset="100%" stopColor={bottom} stopOpacity={0} />
				</radialGradient>
			</defs>
			<circle cx={width / 2} cy={height * y + drift} r={size * 1.1} fill="url(#sunGlow)" />
			<circle cx={width / 2} cy={height * y + drift} r={size / 2} fill="url(#sunGrad)" mask="url(#sunMask)" />
		</svg>
	);
};

/** Skyline procedural (silhueta de prédios com janelas). */
export const Skyline: React.FC<{
	seed?: string;
	baseline?: number;
	maxHeight?: number;
	color?: string;
	windowColor?: string;
	density?: number;
}> = ({seed = 'city', baseline = 0.72, maxHeight = 520, color = '#12081C', windowColor, density = 1}) => {
	const {width, height} = useVideoConfig();
	const theme = useTheme();
	const buildings = useMemo(() => {
		const out: {x: number; w: number; h: number; antenna: boolean}[] = [];
		let x = -40;
		let i = 0;
		while (x < width + 40) {
			const w = (60 + random(`${seed}-w-${i}`) * 110) / density;
			const tall = random(`${seed}-t-${i}`) > 0.82;
			const h = (0.25 + random(`${seed}-h-${i}`) * 0.6) * maxHeight * (tall ? 1.5 : 1);
			out.push({x, w, h, antenna: tall && random(`${seed}-a-${i}`) > 0.4});
			x += w + random(`${seed}-g-${i}`) * 8;
			i++;
		}
		return out;
	}, [seed, width, maxHeight, density]);
	const base = height * baseline;
	const wc = windowColor ?? theme.colors.secondary;
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			{buildings.map((b, i) => (
				<g key={i}>
					<rect x={b.x} y={base - b.h} width={b.w} height={b.h + height} fill={color} />
					{b.antenna ? <rect x={b.x + b.w / 2 - 2} y={base - b.h - 60} width={4} height={60} fill={color} /> : null}
					{new Array(Math.floor(b.h / 38)).fill(0).map((__, r) =>
						new Array(Math.max(1, Math.floor(b.w / 26))).fill(0).map((___, c) =>
							random(`${seed}-win-${i}-${r}-${c}`) > 0.72 ? (
								<rect
									key={`${r}-${c}`}
									x={b.x + 8 + c * 26}
									y={base - b.h + 14 + r * 38}
									width={10}
									height={14}
									fill={wc}
									opacity={0.35 + random(`${seed}-wo-${i}-${r}-${c}`) * 0.5}
								/>
							) : null,
						),
					)}
				</g>
			))}
		</svg>
	);
};

/** Palmeira em silhueta (desenho original em SVG). */
export const Palm: React.FC<{x: number; y: number; scale?: number; color?: string; flip?: boolean; sway?: number}> = ({
	x,
	y,
	scale = 1,
	color = '#0A0510',
	flip = false,
	sway = 1,
}) => {
	const frame = useCurrentFrame();
	const angle = Math.sin(frame / 40 + x) * 2.5 * sway;
	const fronds = [-150, -120, -95, -70, -40, -15, 10];
	return (
		<g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
			<path d="M -14 0 C -10 -200 20 -380 60 -560 L 74 -556 C 36 -380 10 -200 14 0 Z" fill={color} />
			<g transform={`translate(66 -560) rotate(${angle})`}>
				{fronds.map((a, i) => (
					<path
						key={i}
						transform={`rotate(${a})`}
						d="M 0 0 C 80 -40 170 -30 250 30 C 170 0 90 0 0 14 Z"
						fill={color}
					/>
				))}
				<circle r={18} fill={color} />
			</g>
		</g>
	);
};

export const Palms: React.FC<{color?: string; scale?: number}> = ({color, scale = 1}) => {
	const {width, height} = useVideoConfig();
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			<Palm x={width * 0.08} y={height * 1.02} scale={1.25 * scale} color={color} />
			<Palm x={width * 0.92} y={height * 1.04} scale={1.05 * scale} color={color} flip />
			<Palm x={width * 0.8} y={height * 1.05} scale={0.8 * scale} color={color} flip sway={0.6} />
		</svg>
	);
};

/** Reflexo de água sob o horizonte. */
export const Water: React.FC<{horizon?: number; color?: string}> = ({horizon = 0.72, color}) => {
	const {width, height} = useVideoConfig();
	const frame = useCurrentFrame();
	const theme = useTheme();
	const top = height * horizon;
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={color ?? theme.colors.bgAlt} />
					<stop offset="100%" stopColor={theme.colors.bg} />
				</linearGradient>
			</defs>
			<rect x={0} y={top} width={width} height={height - top} fill="url(#waterGrad)" />
			{new Array(26).fill(0).map((_, i) => {
				const t = i / 26;
				const yy = top + 10 + t * t * (height - top);
				const w = 80 + random(`wl-${i}`) * 300;
				const xx = (random(`wx-${i}`) * width + frame * (0.6 + t * 2)) % (width + w) - w;
				return (
					<rect key={i} x={xx} y={yy} width={w} height={2 + t * 4} rx={2} fill={theme.colors.secondary} opacity={0.18 + (1 - t) * 0.3} />
				);
			})}
		</svg>
	);
};

/** Piso em grade com perspectiva (estilo tech). */
export const GridFloor: React.FC<{color?: string; horizon?: number}> = ({color, horizon = 0.62}) => {
	const {width, height} = useVideoConfig();
	const frame = useCurrentFrame();
	const theme = useTheme();
	const c = color ?? theme.colors.primary;
	const top = height * horizon;
	const rows = 16;
	const offset = (frame % 30) / 30;
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
			<defs>
				<linearGradient id="gridFade" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={c} stopOpacity={0} />
					<stop offset="100%" stopColor={c} stopOpacity={0.6} />
				</linearGradient>
			</defs>
			{new Array(rows).fill(0).map((_, i) => {
				const t = (i + offset) / rows;
				const yy = top + Math.pow(t, 2.2) * (height - top);
				return <line key={`h${i}`} x1={0} x2={width} y1={yy} y2={yy} stroke="url(#gridFade)" strokeWidth={1 + t * 2} />;
			})}
			{new Array(21).fill(0).map((_, i) => {
				const xx = (i / 20) * width;
				const spread = (xx - width / 2) * 4;
				return <line key={`v${i}`} x1={width / 2 + (xx - width / 2) * 0.15} y1={top} x2={width / 2 + spread} y2={height} stroke={c} strokeOpacity={0.28} strokeWidth={1.5} />;
			})}
		</svg>
	);
};

/** Granulação de filme determinística. */
export const FilmGrain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	return (
		<svg width={width} height={height} style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<filter id={`grain-${frame % 8}`}>
				<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 8} stitchTiles="stitch" />
				<feColorMatrix type="saturate" values="0" />
			</filter>
			<rect width="100%" height="100%" filter={`url(#grain-${frame % 8})`} />
		</svg>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.6}) => (
	<AbsoluteFill
		style={{
			pointerEvents: 'none',
			background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
		}}
	/>
);

/** Brilhos flutuantes (bokeh) — profundidade barata. */
export const Bokeh: React.FC<{count?: number; color?: string; seed?: string}> = ({count = 14, color, seed = 'bokeh'}) => {
	const frame = useCurrentFrame();
	const {width, height} = useVideoConfig();
	const theme = useTheme();
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{new Array(count).fill(0).map((_, i) => {
				const size = 40 + random(`${seed}-s-${i}`) * 160;
				const x = random(`${seed}-x-${i}`) * width;
				const y = (random(`${seed}-y-${i}`) * height - frame * (0.3 + random(`${seed}-v-${i}`))) % height;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - size / 2,
							top: (y < 0 ? y + height : y) - size / 2,
							width: size,
							height: size,
							borderRadius: '50%',
							background: i % 2 ? color ?? theme.colors.primary : theme.colors.secondary,
							opacity: 0.12 + random(`${seed}-o-${i}`) * 0.18,
							filter: `blur(${8 + random(`${seed}-b-${i}`) * 18}px)`,
						}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

/** Fundo completo de acordo com o tema atual. */
export const Backdrop: React.FC<{variant?: 'sunset' | 'grid' | 'plain'; grain?: boolean}> = ({variant, grain = true}) => {
	const theme = useTheme();
	const v = variant ?? theme.backdrop;
	return (
		<AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
			<SkyGradient />
			{v === 'sunset' ? (
				<>
					<Sun y={0.52} />
					<Skyline seed="far" baseline={0.72} maxHeight={380} color="#2A0F35" density={1.4} />
					<Skyline seed="near" baseline={0.72} maxHeight={560} color="#12061A" />
					<Water horizon={0.72} />
					<Palms />
				</>
			) : null}
			{v === 'grid' ? (
				<>
					<Bokeh />
					<GridFloor />
				</>
			) : null}
			{v === 'plain' ? <Bokeh count={8} /> : null}
			<Vignette />
			{grain ? <FilmGrain /> : null}
		</AbsoluteFill>
	);
};

/** Guia visual das áreas de segurança (somente para revisão). */
export const SafeAreaGuide: React.FC<{visible?: boolean}> = ({visible = true}) => {
	const sa = useSafeArea();
	if (!visible) return null;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					left: sa.left,
					right: sa.right,
					top: sa.top,
					bottom: sa.bottom,
					border: '3px dashed rgba(0,255,170,0.8)',
				}}
			/>
		</AbsoluteFill>
	);
};

/** Faixas de letterbox animáveis (0 = sem faixas, 1 = 2.39:1). */
export const Letterbox: React.FC<{amount: number; color?: string}> = ({amount, color = '#000'}) => {
	const {width, height} = useVideoConfig();
	const target = Math.max(0, (height - width / 2.39) / 2);
	const bar = interpolate(amount, [0, 1], [0, Math.min(target, height * 0.16)]);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<div style={{position: 'absolute', top: 0, left: 0, right: 0, height: bar, background: color}} />
			<div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: bar, background: color}} />
		</AbsoluteFill>
	);
};
