import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraShake} from '../camera/CameraShake';
import {Parallax25D} from '../camera/Parallax25D';
import {RackFocus} from '../camera/RackFocus';
import {SmoothZoom} from '../camera/SmoothZoom';
import {WhipPan} from '../camera/WhipPan';
import {CounterAnimation} from '../captions/CounterAnimation';
import {InfoCard} from '../captions/InfoCard';
import {KineticTypography, type KineticMode} from '../captions/KineticTypography';
import {WordHighlight} from '../captions/WordHighlight';
import {AnimatedPins, RegionHighlight, RouteReveal, SatelliteZoom, MapFlyover} from '../maps/MapEffects';
import {clamp01} from '../motion/core';
import type {CameraMove, SceneSpec} from '../production/spec';
import {SpeedRamp} from '../transitions/SpeedRamp';
import {useSafeArea, useStudio} from '../themes/context';
import {Backdrop, Bokeh, FilmGrain, Palms, SkyGradient, Skyline, Sun, Vignette, Water} from '../themes/Scenery';
import {MediaLayer} from './MediaLayer';

/** Modo de tipografia por estilo. */
export const useKineticMode = (): KineticMode => {
	const {style} = useStudio();
	return style.id === 'viral-fast' ? 'pop' : style.id === 'cinematic' ? 'blur' : 'rise';
};

/** Aplica um movimento de câmera ao conteúdo. */
export const CameraMoveWrap: React.FC<{move?: CameraMove; duration: number; intensity?: number; children: React.ReactNode}> = ({move = 'zoom-in', duration, intensity = 1, children}) => {
	const {style} = useStudio();
	const k = style.cameraIntensity * intensity;
	switch (move) {
		case 'zoom-in':
			return (
				<SmoothZoom from={1} to={1.18} duration={duration} intensity={k} easing={style.easing === 'snappy' ? 'smooth' : style.easing}>
					{children}
				</SmoothZoom>
			);
		case 'zoom-out':
			return (
				<SmoothZoom from={1.25} to={1} duration={duration} intensity={k} easing="smooth">
					{children}
				</SmoothZoom>
			);
		case 'shake':
			return (
				<CameraShake amplitude={14} intensity={k}>
					<SmoothZoom to={1.1} duration={duration} intensity={k}>
						{children}
					</SmoothZoom>
				</CameraShake>
			);
		case 'whip':
			return (
				<WhipPan direction="left" duration={0.45} intensity={1}>
					<SmoothZoom to={1.12} duration={duration} intensity={k}>
						{children}
					</SmoothZoom>
				</WhipPan>
			);
		case 'parallax':
			return <Parallax25D duration={duration} intensity={k} layers={[{depth: 0.5, content: children}]} />;
		case 'rack-focus':
			return <RackFocus duration={1.4} delay={0.3} background={children} foreground={<Bokeh count={10} seed="rack" />} intensity={k} />;
		case 'speed-ramp':
			return <SpeedRamp intensity={k}>{children}</SpeedRamp>;
		default:
			return <>{children}</>;
	}
};

/** Etiqueta pequena (ex.: "CONFIRMADO", "RUMOR", "PARTE 2"). */
export const Tag: React.FC<{text: string; delay?: number}> = ({text, delay = 0.1}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {theme} = useStudio();
	const sa = useSafeArea();
	const sp = spring({frame: frame - delay * fps, fps, config: {damping: 16}});
	return (
		<div
			style={{
				position: 'absolute',
				left: sa.left,
				top: sa.top,
				fontFamily: theme.fonts.mono,
				fontWeight: 700,
				fontSize: 30,
				letterSpacing: 4,
				color: theme.colors.bg,
				background: theme.colors.primary,
				padding: '10px 18px',
				borderRadius: 8,
				opacity: sp,
				translate: `${(1 - sp) * -40}px 0px`,
			}}
		>
			{text}
		</div>
	);
};

const Subtitle: React.FC<{text: string; delay?: number; vertical?: number}> = ({text, delay = 0.6, vertical = 0.62}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {theme} = useStudio();
	const sa = useSafeArea();
	const o = interpolate(frame, [delay * fps, (delay + 0.5) * fps], [0, 1], clamp01);
	const usableH = sa.height - sa.top - sa.bottom;
	return (
		<div
			style={{
				position: 'absolute',
				left: sa.left,
				right: sa.right,
				top: sa.top + usableH * vertical,
				textAlign: 'center',
				fontFamily: theme.fonts.body,
				fontWeight: 600,
				fontSize: 44,
				color: theme.colors.textMuted,
				opacity: o,
				translate: `0px ${(1 - o) * 20}px`,
				letterSpacing: 1,
				textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.8)',
			}}
		>
			{text}
		</div>
	);
};

/* ------------------------------ cenas ------------------------------ */

export const TitleScene: React.FC<{scene: SceneSpec; intensity: number}> = ({scene, intensity}) => {
	const mode = useKineticMode();
	return (
		<AbsoluteFill>
			<CameraMoveWrap move={scene.camera ?? 'zoom-in'} duration={scene.duration} intensity={intensity}>
				<MediaLayer src={scene.media} trimStart={scene.mediaTrimStart} shade={0.5} />
			</CameraMoveWrap>
			{scene.tag ? <Tag text={scene.tag} /> : null}
			<KineticTypography text={scene.text} mode={mode} fontSize={130} delay={0.15} intensity={intensity} />
			{scene.subtitle ? <Subtitle text={scene.subtitle} /> : null}
		</AbsoluteFill>
	);
};

export const MediaScene: React.FC<{scene: SceneSpec; intensity: number}> = ({scene, intensity}) => {
	const mode = useKineticMode();
	const {style} = useStudio();
	return (
		<AbsoluteFill>
			{!scene.media && scene.camera === 'parallax' ? (
				// sem mídia: cenário em camadas reais para mostrar profundidade
				<CameraShake amplitude={6} intensity={style.shake + 0.3}>
					<Parallax25D layers={sunsetLayers()} duration={scene.duration} move={[-260, -50]} dolly={0.16} intensity={intensity} easing={style.easing} />
				</CameraShake>
			) : (
				<CameraMoveWrap move={scene.camera ?? 'zoom-in'} duration={scene.duration} intensity={intensity}>
					<MediaLayer src={scene.media} trimStart={scene.mediaTrimStart} placeholderLabel="MÍDIA DE TESTE" />
				</CameraMoveWrap>
			)}
			{scene.tag ? <Tag text={scene.tag} /> : null}
			{scene.text ? <KineticTypography text={scene.text} mode={mode} fontSize={96} vertical={0.18} delay={0.1} intensity={intensity} /> : null}
		</AbsoluteFill>
	);
};

export const MapScene: React.FC<{scene: SceneSpec; intensity: number}> = ({scene, intensity}) => {
	const {style} = useStudio();
	const m = scene.map ?? {target: [0.47, 0.52] as [number, number]};
	const dive = Math.min(3, scene.duration * 0.45);
	const overlays = (
		<>
			{m.region ? <RegionHighlight polygon={m.region} delay={dive} duration={1.2} label={m.label} intensity={intensity} /> : null}
			{m.route ? <RouteReveal points={m.route} delay={dive + 0.2} duration={Math.max(1, scene.duration - dive - 1)} /> : null}
			{m.pins ? <AnimatedPins pins={m.pins.map((p, i) => ({...p, delay: dive * 0.7 + i * 0.35}))} intensity={intensity} /> : null}
		</>
	);
	return (
		<AbsoluteFill>
			{(m.mode ?? (style.id === 'cinematic' ? 'flyover' : 'satellite')) === 'flyover' ? (
				<MapFlyover src={m.src} from={[0.5, 0.55]} to={m.target} duration={scene.duration} zoomFrom={0.9} zoomTo={1.6} intensity={intensity}>
					{overlays}
				</MapFlyover>
			) : (
				<SatelliteZoom
					src={m.src}
					target={m.target}
					duration={dive}
					zoomFrom={0.75}
					zoomTo={1.45}
					label={m.region ? undefined : m.label}
					coordinates={m.coordinates}
					hud={style.id === 'documentary' || style.id === 'viral-fast'}
					intensity={intensity}
				>
					{overlays}
				</SatelliteZoom>
			)}
			{scene.tag ? <Tag text={scene.tag} /> : null}
			{scene.text ? <KineticTypography text={scene.text} mode="rise" fontSize={84} vertical={0.04} delay={0.2} /> : null}
		</AbsoluteFill>
	);
};

export const StatScene: React.FC<{scene: SceneSpec; intensity: number}> = ({scene, intensity}) => {
	const s = scene.stat ?? {to: 100};
	return (
		<AbsoluteFill>
			<CameraMoveWrap move={scene.camera ?? 'zoom-in'} duration={scene.duration} intensity={intensity}>
				<MediaLayer src={scene.media} shade={0.7} />
			</CameraMoveWrap>
			{scene.tag ? <Tag text={scene.tag} /> : null}
			{scene.text ? <KineticTypography text={scene.text} mode="rise" fontSize={72} vertical={0.12} delay={0.05} /> : null}
			<CounterAnimation to={s.to} from={s.from} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} label={s.label} delay={0.3} duration={Math.min(2.2, scene.duration * 0.6)} intensity={intensity} />
		</AbsoluteFill>
	);
};

export const CardsScene: React.FC<{scene: SceneSpec; intensity: number}> = ({scene, intensity}) => {
	const sa = useSafeArea();
	return (
		<AbsoluteFill>
			<CameraMoveWrap move={scene.camera ?? 'zoom-out'} duration={scene.duration} intensity={intensity}>
				<AbsoluteFill style={{filter: 'blur(6px) brightness(0.7)'}}>
					<MediaLayer src={scene.media} shade={0.4} />
				</AbsoluteFill>
			</CameraMoveWrap>
			<InfoCard
				title={scene.text}
				items={scene.items}
				icon={scene.icon}
				tag={scene.tag}
				x={sa.left}
				y={sa.top + 260}
				width={sa.width - sa.left - sa.right}
				delay={0.15}
				intensity={intensity}
			/>
		</AbsoluteFill>
	);
};

export const HighlightScene: React.FC<{scene: SceneSpec; intensity: number}> = ({scene, intensity}) => (
	<AbsoluteFill>
		<CameraMoveWrap move={scene.camera ?? 'zoom-in'} duration={scene.duration} intensity={intensity}>
			<MediaLayer src={scene.media} shade={0.75} />
		</CameraMoveWrap>
		{scene.tag ? <Tag text={scene.tag} /> : null}
		<WordHighlight text={scene.text} delay={0.1} stagger={Math.max(0.3, (scene.duration - 1.2) / 4)} intensity={intensity} />
	</AbsoluteFill>
);

export const OutroScene: React.FC<{scene: SceneSpec; intensity: number; handle?: string}> = ({scene, intensity, handle}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {theme} = useStudio();
	const sa = useSafeArea();
	const btn = spring({frame: frame - 0.9 * fps, fps, config: {damping: 12}});
	const glow = 0.5 + 0.5 * Math.sin(frame / 8);
	return (
		<AbsoluteFill>
			<CameraMoveWrap move={scene.camera ?? 'zoom-out'} duration={scene.duration} intensity={intensity}>
				<MediaLayer src={scene.media} shade={0.6} />
			</CameraMoveWrap>
			<KineticTypography text={scene.text || 'Segue para *mais*'} mode="stack" fontSize={120} vertical={0.32} stagger={0.12} intensity={intensity} />
			<div
				style={{
					position: 'absolute',
					left: sa.left,
					right: sa.right,
					top: sa.top + (sa.height - sa.top - sa.bottom) * 0.62,
					display: 'flex',
					justifyContent: 'center',
				}}
			>
				<div
					style={{
						fontFamily: theme.fonts.body,
						fontWeight: 800,
						fontSize: 48,
						color: theme.colors.text,
						padding: '24px 52px',
						borderRadius: 999,
						background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
						boxShadow: `0 0 ${30 + glow * 40}px ${theme.colors.primary}99`,
						scale: String(btn),
					}}
				>
					{scene.subtitle ?? (handle ? `Siga ${handle}` : 'Siga para a parte 2')}
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const SceneRenderer: React.FC<{scene: SceneSpec; intensity: number; handle?: string}> = ({scene, intensity, handle}) => {
	switch (scene.kind) {
		case 'title':
			return <TitleScene scene={scene} intensity={intensity} />;
		case 'media':
			return <MediaScene scene={scene} intensity={intensity} />;
		case 'map':
			return <MapScene scene={scene} intensity={intensity} />;
		case 'stat':
			return <StatScene scene={scene} intensity={intensity} />;
		case 'cards':
			return <CardsScene scene={scene} intensity={intensity} />;
		case 'highlight':
			return <HighlightScene scene={scene} intensity={intensity} />;
		case 'outro':
			return <OutroScene scene={scene} intensity={intensity} handle={handle} />;
		default:
			return null;
	}
};

/** Cenário Vice Sunset em camadas separadas (para Parallax 2.5D). */
export const sunsetLayers = () => [
	{depth: 0.05, content: <SkyGradient />},
	{depth: 0.15, content: <Sun y={0.5} />},
	{depth: 0.35, content: <Skyline seed="far" baseline={0.72} maxHeight={380} color="#2A0F35" density={1.4} />},
	{depth: 0.6, content: <Skyline seed="near" baseline={0.74} maxHeight={560} color="#12061A" />},
	{depth: 0.7, content: <Water horizon={0.74} />},
	{depth: 1, content: <Palms />},
	{depth: 0, content: <Vignette />},
	{depth: 0, content: <FilmGrain />},
];

export {Backdrop};
