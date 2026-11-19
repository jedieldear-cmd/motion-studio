import React from 'react';
import {linearTiming, TransitionSeries, type TransitionPresentation} from '@remotion/transitions';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {z} from 'zod';
import {CameraShake} from '../camera/CameraShake';
import {Parallax25D} from '../camera/Parallax25D';
import {RackFocus} from '../camera/RackFocus';
import {SmoothZoom} from '../camera/SmoothZoom';
import {WhipPan} from '../camera/WhipPan';
import {AnimatedCaptions, estimateCaptions} from '../captions/AnimatedCaptions';
import {CounterAnimation} from '../captions/CounterAnimation';
import {InfoCard} from '../captions/InfoCard';
import {KineticTypography} from '../captions/KineticTypography';
import {WordHighlight} from '../captions/WordHighlight';
import {AnimatedPins, MapFlyover, RegionHighlight, RouteReveal, SatelliteZoom} from '../maps/MapEffects';
import {MapStage} from '../maps/MapStage';
import {easingSchema} from '../motion/core';
import {styleIdSchema} from '../presets/styles';
import {sunsetLayers} from '../scenes/Scenes';
import {StudioProvider, useSafeArea, useTheme} from '../themes/context';
import {Backdrop, Bokeh, Palms, SafeAreaGuide} from '../themes/Scenery';
import {themeIdSchema} from '../themes/themes';
import {LightLeak} from '../transitions/LightLeak';
import {cinematicReveal, glitch, motionBlurSlide} from '../transitions/presentations';
import {SpeedRamp} from '../transitions/SpeedRamp';
import {EFFECTS, effectIds, type EffectId} from './registry';

export const showcaseSchema = z.object({
	effect: z.enum(effectIds),
	theme: themeIdSchema,
	style: styleIdSchema,
	text: z.string(),
	intensity: z.number().min(0).max(2).step(0.05),
	speed: z.number().min(0.25).max(4).step(0.05),
	delay: z.number().min(0).max(5).step(0.05),
	duration: z.number().min(0.2).max(10).step(0.05),
	easing: easingSchema,
	primaryColor: z.string(),
	showLabel: z.boolean(),
	showSafeArea: z.boolean(),
});
export type ShowcaseProps = z.infer<typeof showcaseSchema>;

export const showcaseDefaults = (effect: EffectId): ShowcaseProps => ({
	effect,
	theme: 'gta6',
	style: 'cinematic',
	text: EFFECTS[effect].sampleText,
	intensity: 1,
	speed: 1,
	delay: 0.3,
	duration: EFFECTS[effect].defaultDuration,
	easing: 'smooth',
	primaryColor: '',
	showLabel: true,
	showSafeArea: false,
});

const PINS = [
	{at: [0.42, 0.45] as [number, number], label: 'Ponto A'},
	{at: [0.55, 0.58] as [number, number], label: 'Ponto B'},
	{at: [0.38, 0.66] as [number, number], label: 'Ponto C'},
];
const ROUTE: [number, number][] = [
	[0.3, 0.42],
	[0.42, 0.45],
	[0.5, 0.5],
	[0.55, 0.58],
	[0.48, 0.68],
	[0.38, 0.66],
];
const REGION: [number, number][] = [
	[0.4, 0.4],
	[0.56, 0.42],
	[0.62, 0.55],
	[0.52, 0.66],
	[0.38, 0.6],
];

/** Cena de exemplo "A" e "B" para as transições. */
const SceneA: React.FC<{label: string}> = ({label}) => (
	<AbsoluteFill>
		<Backdrop variant="sunset" />
		<KineticTypography text={label} mode="rise" fontSize={110} delay={0} />
	</AbsoluteFill>
);
const SceneB: React.FC<{label: string}> = ({label}) => (
	<AbsoluteFill>
		<MapStage camera={[{t: 0, x: 0.5, y: 0.52, zoom: 1.6}]} />
		<KineticTypography text={label} mode="rise" fontSize={110} delay={0} />
	</AbsoluteFill>
);

const TransitionDemo: React.FC<{presentation: TransitionPresentation<Record<string, unknown>> | null; seconds: number; leak?: boolean; delay: number}> = ({presentation, seconds, leak, delay}) => {
	const {fps, durationInFrames} = useVideoConfig();
	const half = Math.max(fps, Math.round((delay + 1.2) * fps));
	const t = Math.max(2, Math.round(seconds * fps));
	return (
		<TransitionSeries>
			<TransitionSeries.Sequence durationInFrames={half + (presentation ? t : 0)}>
				<SceneA label="Cena *A*" />
			</TransitionSeries.Sequence>
			{presentation ? <TransitionSeries.Transition presentation={presentation} timing={linearTiming({durationInFrames: t})} /> : null}
			{leak ? (
				<TransitionSeries.Overlay durationInFrames={t}>
					<LightLeak />
				</TransitionSeries.Overlay>
			) : null}
			<TransitionSeries.Sequence durationInFrames={Math.max(fps, durationInFrames - half)}>
				<SceneB label="Cena *B*" />
			</TransitionSeries.Sequence>
		</TransitionSeries>
	);
};

/** Renderiza um dos 20 efeitos com os parâmetros do Studio. */
export const EffectView: React.FC<ShowcaseProps> = (p) => {
	const timing = {delay: p.delay, duration: p.duration, speed: p.speed, intensity: p.intensity, easing: p.easing};
	const theme = useTheme();
	const sa = useSafeArea();
	switch (p.effect) {
		case 'smooth-zoom':
			return (
				<SmoothZoom {...timing} to={1.3} origin="50% 55%">
					<Backdrop />
				</SmoothZoom>
			);
		case 'whip-pan':
			return (
				<>
					<Backdrop variant="grid" />
					<WhipPan {...timing} direction="left">
						<Backdrop variant="sunset" />
					</WhipPan>
				</>
			);
		case 'parallax-25d':
			return <Parallax25D {...timing} layers={sunsetLayers()} move={[-220, -60]} dolly={0.15} />;
		case 'camera-shake':
			return (
				<CameraShake {...timing} mode="impact" amplitude={40} rotation={1.5}>
					<Backdrop />
				</CameraShake>
			);
		case 'rack-focus':
			return <RackFocus {...timing} background={<Backdrop grain={false} />} foreground={<><Bokeh count={12} seed="rf" /><AbsoluteFill style={{translate: '0px -80px', scale: '1.15'}}><Palms /></AbsoluteFill></>} maxBlur={26} />;
		case 'map-flyover':
			return <MapFlyover from={[0.35, 0.6]} to={[0.6, 0.42]} duration={p.duration} intensity={p.intensity} delay={p.delay} speed={p.speed} easing={p.easing} />;
		case 'animated-pins':
			return (
				<MapStage camera={[{t: 0, x: 0.47, y: 0.55, zoom: 2.2}]}>
					<AnimatedPins pins={PINS.map((pin, i) => ({...pin, delay: p.delay + i * 0.35 / p.speed}))} intensity={p.intensity} color={p.primaryColor || undefined} />
				</MapStage>
			);
		case 'route-reveal':
			return (
				<MapStage camera={[{t: 0, x: 0.46, y: 0.55, zoom: 2.1}, {t: p.delay + p.duration, x: 0.46, y: 0.56, zoom: 2.4}]}>
					<RouteReveal {...timing} points={ROUTE} color={p.primaryColor || undefined} />
					<AnimatedPins pins={[{at: ROUTE[0], label: 'Início', delay: 0}, {at: ROUTE[ROUTE.length - 1], label: 'Destino', delay: p.delay + p.duration / p.speed}]} />
				</MapStage>
			);
		case 'region-highlight':
			return (
				<MapStage camera={[{t: 0, x: 0.5, y: 0.53, zoom: 1.9}]}>
					<RegionHighlight {...timing} polygon={REGION} label={p.text} color={p.primaryColor || undefined} />
				</MapStage>
			);
		case 'satellite-zoom':
			return <SatelliteZoom target={[0.5, 0.53]} duration={p.duration} delay={p.delay} speed={p.speed} label={p.text} coordinates="MAPA DE TESTE" intensity={p.intensity} easing={p.easing} />;
		case 'kinetic-typography':
			return (
				<>
					<Backdrop />
					<KineticTypography {...timing} text={p.text} mode={p.style === 'viral-fast' ? 'pop' : p.style === 'cinematic' ? 'blur' : 'rise'} stagger={0.12} accentColor={p.primaryColor || undefined} />
				</>
			);
		case 'word-highlight':
			return (
				<>
					<Backdrop />
					<WordHighlight {...timing} duration={Math.min(p.duration, 0.6)} text={p.text} highlightColor={p.primaryColor || undefined} />
				</>
			);
		case 'animated-captions':
			return (
				<>
					<Backdrop />
					<AnimatedCaptions captions={estimateCaptions(p.text, p.delay * 1000, p.duration * 1000)} intensity={p.intensity} activeColor={p.primaryColor || undefined} />
				</>
			);
		case 'counter':
			return (
				<>
					<Backdrop />
					<CounterAnimation {...timing} to={2026} from={0} label={p.text} accentColor={p.primaryColor || undefined} />
				</>
			);
		case 'info-cards':
			return (
				<>
					<Backdrop />
					<InfoCard {...timing} title={p.text} tag="EXEMPLO" icon="🌴" items={['Componente reutilizável', 'Cores e tempos configuráveis', 'Entrada com spring + blur']} x={sa.left} y={sa.top + 300} width={sa.width - sa.left - sa.right} accentColor={p.primaryColor || undefined} />
				</>
			);
		case 'motion-blur-transition':
			return <TransitionDemo presentation={motionBlurSlide({direction: 'left', maxBlur: 60 * p.intensity}) as never} seconds={p.duration / p.speed} delay={p.delay} />;
		case 'light-leak':
			return (
				<>
					<Backdrop />
					<Sequence from={Math.round(p.delay * 30)} durationInFrames={Math.round((p.duration / p.speed) * 30)}>
						<LightLeak intensity={p.intensity} />
					</Sequence>
				</>
			);
		case 'speed-ramp':
			return (
				<SpeedRamp
					intensity={p.intensity}
					easing={p.easing}
					ramp={[
						{at: 0, speed: 1},
						{at: p.delay + 0.5, speed: 1},
						{at: p.delay + 0.9, speed: 0.15},
						{at: p.delay + 0.9 + p.duration, speed: 0.15},
						{at: p.delay + 1.3 + p.duration, speed: 3 * p.speed},
					]}
				>
					<CameraShake amplitude={4}>
						<Parallax25D layers={sunsetLayers()} duration={4} move={[-500, -40]} easing="linear" />
					</CameraShake>
				</SpeedRamp>
			);
		case 'glitch-transition':
			return <TransitionDemo presentation={glitch({intensity: p.intensity}) as never} seconds={p.duration / p.speed} delay={p.delay} />;
		case 'cinematic-reveal':
			return <TransitionDemo presentation={cinematicReveal({shape: 'slit', lineColor: p.primaryColor || theme.colors.secondary}) as never} seconds={p.duration / p.speed} delay={p.delay} />;
		default:
			return null;
	}
};

const Label: React.FC<{effect: EffectId}> = ({effect}) => {
	const theme = useTheme();
	const sa = useSafeArea();
	const e = EFFECTS[effect];
	return (
		<div style={{position: 'absolute', left: sa.left, top: 80, fontFamily: theme.fonts.mono, color: theme.colors.text, fontSize: 30, textShadow: '0 2px 8px #000'}}>
			<span style={{color: theme.colors.primary, fontWeight: 700}}>{String(e.n).padStart(2, '0')}</span> · {e.category.toUpperCase()} · {e.name}
		</div>
	);
};

/** Composição individual de efeito (editável no Studio). */
export const EffectShowcase: React.FC<ShowcaseProps> = (p) => (
	<StudioProvider themeId={p.theme} styleId={p.style} colorOverrides={p.primaryColor ? {primary: p.primaryColor} : undefined}>
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			<EffectView {...p} />
			{p.showLabel ? <Label effect={p.effect} /> : null}
			<SafeAreaGuide visible={p.showSafeArea} />
		</AbsoluteFill>
	</StudioProvider>
);

/** Galeria: os 20 efeitos em sequência, 3 s cada. */
export const Gallery: React.FC<{theme: ShowcaseProps['theme']; style: ShowcaseProps['style']}> = ({theme, style}) => {
	const {fps} = useVideoConfig();
	const each = 3 * fps;
	return (
		<AbsoluteFill style={{backgroundColor: '#000'}}>
			{effectIds.map((id, i) => (
				<Sequence key={id} from={i * each} durationInFrames={each} name={`${i + 1}. ${EFFECTS[id].name}`}>
					<EffectShowcase {...showcaseDefaults(id)} theme={theme} style={style} delay={0.2} duration={Math.min(EFFECTS[id].defaultDuration, 2.2)} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
