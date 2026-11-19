import React from 'react';
import {Audio} from '@remotion/media';
import {linearTiming, TransitionSeries, type TransitionPresentation} from '@remotion/transitions';
import {AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig, type CalculateMetadataFunction} from 'remotion';
import {AnimatedCaptions, estimateCaptions, type Caption} from '../captions/AnimatedCaptions';
import {formats} from '../presets/formats';
import {resolveSrc} from '../scenes/MediaLayer';
import {SceneRenderer} from '../scenes/Scenes';
import {StudioProvider} from '../themes/context';
import {SafeAreaGuide} from '../themes/Scenery';
import {LightLeak} from '../transitions/LightLeak';
import {cinematicReveal, glitch, motionBlurSlide, whipPan} from '../transitions/presentations';
import {layoutScenes, videoSpecSchema, type VideoSpec} from './spec';

/** Atraso da voz após o início da cena (s) — igual ao LEAD de scripts/narrate.ts. */
const VOICE_LEAD = 0.25;

export type ProductionProps = VideoSpec & {
	/** Legendas carregadas de arquivo (preenchido por calculateMetadata). */
	loadedCaptions?: Caption[];
};

const presentationFor = (kind: string, accent: string): TransitionPresentation<Record<string, unknown>> | null =>
	presentationForTyped(kind, accent) as TransitionPresentation<Record<string, unknown>> | null;

const presentationForTyped = (kind: string, accent: string) => {
	switch (kind) {
		case 'whip':
			return whipPan({direction: 'left'});
		case 'motion-blur':
			return motionBlurSlide({direction: 'up'});
		case 'glitch':
			return glitch();
		case 'cinematic-reveal':
			return cinematicReveal({shape: 'slit', lineColor: accent});
		default:
			return null;
	}
};

/** Composição de produção: transforma um VideoSpec em vídeo. */
export const Production: React.FC<ProductionProps> = (spec) => {
	const {fps} = useVideoConfig();
	const layout = layoutScenes(spec, fps);
	const captions: Caption[] =
		spec.captions === 'none'
			? []
			: spec.captions === 'file' && spec.loadedCaptions
				? spec.loadedCaptions
				: spec.scenes.flatMap((s, i) => {
						if (!s.narration) return [];
						const startMs = (layout.items[i].start / fps) * 1000;
						// com narração gerada: tempo real da fala; sem: estimativa pela duração da cena
						return s.voice && s.voiceDuration
							? estimateCaptions(s.narration, startMs + VOICE_LEAD * 1000, s.voiceDuration * 1000)
							: estimateCaptions(s.narration, startMs + 150, (layout.items[i].dur / fps) * 1000 - 300);
					});
	const hasVoice = Boolean(spec.narrationSrc) || spec.scenes.some((s) => s.voice);
	const lightLeakFrames = Math.round(0.9 * fps);
	return (
		<StudioProvider themeId={spec.theme} styleId={spec.style} colorOverrides={spec.accentColor ? {primary: spec.accentColor} : undefined}>
			<AbsoluteFill style={{backgroundColor: '#000'}}>
				<TransitionSeries>
					{spec.scenes.flatMap((scene, i) => {
						const item = layout.items[i];
						const nodes: React.ReactNode[] = [];
						if (i > 0 && item.overlap > 0) {
							const pres = presentationFor(item.transition, '#FFD27A');
							if (pres) {
								nodes.push(<TransitionSeries.Transition key={`t${i}`} presentation={pres} timing={linearTiming({durationInFrames: item.overlap})} />);
							}
						}
						if (i > 0 && item.transition === 'light-leak') {
							nodes.push(
								<TransitionSeries.Overlay key={`o${i}`} durationInFrames={Math.min(lightLeakFrames, item.dur, layout.items[i - 1].dur)}>
									<LightLeak seed={i} />
								</TransitionSeries.Overlay>,
							);
						}
						nodes.push(
							<TransitionSeries.Sequence key={`s${i}`} name={`${i + 1}. ${scene.kind}`} durationInFrames={item.dur}>
								<SceneRenderer scene={scene} intensity={spec.intensity} handle={spec.handle} />
							</TransitionSeries.Sequence>,
						);
						return nodes;
					})}
				</TransitionSeries>

				{captions.length ? <AnimatedCaptions captions={captions} intensity={spec.intensity} /> : null}

				{spec.narrationSrc ? <Audio src={resolveSrc(spec.narrationSrc)} /> : null}
				{spec.scenes.map((s, i) =>
					s.voice ? (
						<Sequence key={`voz${i}`} name={`Voz ${i + 1}`} from={layout.items[i].start + Math.round(VOICE_LEAD * fps)} durationInFrames={Math.ceil(((s.voiceDuration ?? s.duration) + 0.2) * fps)} layout="none">
							<Audio src={resolveSrc(s.voice)} />
						</Sequence>
					) : null,
				)}
				{spec.musicSrc ? (
					<Audio
						src={resolveSrc(spec.musicSrc)}
						loop
						volume={(f) =>
							interpolate(f, [0, fps, layout.total - fps, layout.total], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
							spec.musicVolume *
							(hasVoice ? 0.4 : 1) // ducking sob a narração
						}
					/>
				) : null}
				{spec.sfxSrc
					? layout.items
							.filter((it) => it.index > 0 && it.transition !== 'cut')
							.map((it) => (
								<Sequence key={`sfx${it.index}`} from={Math.max(0, it.start - 4)} durationInFrames={fps} layout="none">
									<Audio src={resolveSrc(spec.sfxSrc!)} volume={0.6} />
								</Sequence>
							))
					: null}

				<SafeAreaGuide visible={spec.showSafeArea} />
			</AbsoluteFill>
		</StudioProvider>
	);
};

export const productionSchema = videoSpecSchema;

/** Calcula duração/tamanho a partir do spec e carrega legendas de arquivo. */
export const calculateProductionMetadata: CalculateMetadataFunction<ProductionProps> = async ({props}) => {
	const fps = 30;
	const {total} = layoutScenes(props, fps);
	let loadedCaptions: Caption[] | undefined;
	if (props.captions === 'file' && props.captionsFile) {
		const res = await fetch(staticFile(props.captionsFile));
		loadedCaptions = (await res.json()) as Caption[];
	}
	const f = formats[props.format ?? 'vertical'];
	return {durationInFrames: total, fps, width: f.width, height: f.height, props: {...props, loadedCaptions}};
};

/** Variante que carrega o spec de public/projects/<arquivo>.json. */
export const calculateProjectMetadata: CalculateMetadataFunction<ProductionProps & {projectFile?: string}> = async (input) => {
	const {props} = input;
	let spec: ProductionProps = props;
	if (props.projectFile) {
		const res = await fetch(staticFile(`projects/${props.projectFile}`));
		if (!res.ok) throw new Error(`Projeto não encontrado: public/projects/${props.projectFile}`);
		spec = {...videoSpecSchema.parse(await res.json()), projectFile: props.projectFile} as ProductionProps;
	}
	return calculateProductionMetadata({...input, props: spec} as Parameters<typeof calculateProductionMetadata>[0]);
};
