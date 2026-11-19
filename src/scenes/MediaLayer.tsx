import React from 'react';
import {Video} from '@remotion/media';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import {Backdrop} from '../themes/Scenery';
import {useTheme} from '../themes/context';

const VIDEO_EXT = /\.(mp4|mov|webm|mkv|m4v)$/i;

/** Resolve caminho: URL completa fica igual; caminho relativo vem de public/. */
export const resolveSrc = (src: string) => (/^(https?:|data:|blob:)/.test(src) ? src : staticFile(src.replace(/^\/?public\//, '').replace(/^\//, '')));

export type MediaLayerProps = {
	/** Imagem ou vídeo (public/... ou URL). Vazio = cenário de teste. */
	src?: string;
	/** Segundos a pular no início do vídeo. */
	trimStart?: number;
	muted?: boolean;
	volume?: number;
	fit?: 'cover' | 'contain';
	/** Escurece a base para legibilidade do texto. */
	shade?: number;
	/** Tag de aviso exibida quando é material de teste. */
	placeholderLabel?: string;
};

/** Camada de mídia (imagem, vídeo, gameplay ou trailer autorizado). */
export const MediaLayer: React.FC<MediaLayerProps> = ({src, trimStart = 0, muted = true, volume = 1, fit = 'cover', shade = 0.35, placeholderLabel}) => {
	const theme = useTheme();
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{backgroundColor: theme.colors.bg}}>
			{!src ? (
				<Backdrop />
			) : VIDEO_EXT.test(src) ? (
				<Video
					src={resolveSrc(src)}
					trimBefore={Math.round(trimStart * fps)}
					muted={muted}
					volume={volume}
					objectFit={fit}
					style={{width: '100%', height: '100%'}}
				/>
			) : (
				<Img src={resolveSrc(src)} style={{width: '100%', height: '100%', objectFit: fit}} />
			)}
			{shade > 0 ? (
				<AbsoluteFill
					style={{
						background: `linear-gradient(180deg, rgba(0,0,0,${shade * 0.6}) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 55%, rgba(0,0,0,${shade * 1.6}) 100%)`,
					}}
				/>
			) : null}
			{!src && placeholderLabel ? (
				<div
					style={{
						position: 'absolute',
						top: 250,
						right: 180,
						fontFamily: theme.fonts.mono,
						fontSize: 22,
						color: 'rgba(255,255,255,0.6)',
						border: '1px solid rgba(255,255,255,0.35)',
						padding: '6px 12px',
						borderRadius: 6,
					}}
				>
					{placeholderLabel}
				</div>
			) : null}
		</AbsoluteFill>
	);
};
