import React, {useEffect, useRef, useState} from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {AbsoluteFill, interpolate, useCurrentFrame, useDelayRender, useVideoConfig} from 'remotion';
import {clamp01, getEasing, type EasingName} from '../motion/core';

/**
 * Mapa REAL com MapLibre (sem chave de API). Requer internet no render.
 * Coordenadas em [longitude, latitude]. Use para geografia real
 * (documentários, cidades). Para lugares fictícios, use <MapStage>.
 *
 * Render: o projeto já usa --gl=angle (remotion.config.ts).
 * Atribuição do provedor de tiles deve ficar visível (prop `attribution`).
 */
export type MapLibreMapProps = {
	from: {center: [number, number]; zoom: number; pitch?: number; bearing?: number};
	to?: {center: [number, number]; zoom: number; pitch?: number; bearing?: number};
	/** Duração do movimento (s). Sem `to`, o mapa fica parado (mais estável). */
	duration?: number;
	easing?: EasingName;
	styleUrl?: string;
	attribution?: string;
	children?: React.ReactNode;
};

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
	from,
	to,
	duration = 4,
	easing = 'cinematic',
	styleUrl = 'https://demotiles.maplibre.org/style.json',
	attribution = '© MapLibre / OpenStreetMap contributors',
	children,
}) => {
	const ref = useRef<HTMLDivElement>(null);
	const frame = useCurrentFrame();
	const {width, height, fps} = useVideoConfig();
	const {delayRender, continueRender} = useDelayRender();
	const [loadHandle] = useState(() => delayRender('Carregando mapa'));
	const [map, setMap] = useState<maplibregl.Map | null>(null);

	useEffect(() => {
		if (!ref.current) return;
		maplibregl.setWorkerUrl(
			URL.createObjectURL(
				new Blob([`import "https://unpkg.com/maplibre-gl@${maplibregl.getVersion()}/dist/maplibre-gl-worker.mjs";`], {type: 'text/javascript'}),
			),
		);
		const m = new maplibregl.Map({
			container: ref.current,
			style: styleUrl,
			center: from.center,
			zoom: from.zoom,
			pitch: from.pitch ?? 0,
			bearing: from.bearing ?? 0,
			interactive: false,
			attributionControl: false,
			fadeDuration: 0,
			canvasContextAttributes: {preserveDrawingBuffer: true},
		});
		m.on('load', () => {
			m.once('idle', () => {
				setMap(m);
				continueRender(loadHandle);
			});
		});
		// sem cleanup com remove(): interfere no ciclo de render do Remotion
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!map || !to) return;
		const handle = delayRender('Movendo câmera do mapa');
		const p = getEasing(easing)(interpolate(frame / fps, [0, duration], [0, 1], clamp01));
		const lz = from.zoom + (to.zoom - from.zoom) * p;
		map.jumpTo({
			center: [from.center[0] + (to.center[0] - from.center[0]) * p, from.center[1] + (to.center[1] - from.center[1]) * p],
			zoom: lz,
			pitch: (from.pitch ?? 0) + ((to.pitch ?? 0) - (from.pitch ?? 0)) * p,
			bearing: (from.bearing ?? 0) + ((to.bearing ?? 0) - (from.bearing ?? 0)) * p,
		});
		map.once('idle', () => continueRender(handle));
	}, [map, frame, fps, to, from, duration, easing, delayRender, continueRender]);

	return (
		<AbsoluteFill>
			<div ref={ref} style={{position: 'absolute', width, height}} />
			{children}
			<div style={{position: 'absolute', right: 16, bottom: 12, fontSize: 18, color: 'rgba(255,255,255,0.8)', fontFamily: 'sans-serif', textShadow: '0 1px 3px #000'}}>
				{attribution}
			</div>
		</AbsoluteFill>
	);
};
