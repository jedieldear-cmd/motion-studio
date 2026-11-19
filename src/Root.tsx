import React from 'react';
import {Composition, Folder} from 'remotion';
import {z} from 'zod';
import {demoSpec} from './demo/demoSpec';
import {EffectShowcase, Gallery, showcaseDefaults, showcaseSchema} from './gallery/EffectShowcase';
import {EFFECTS, effectIds} from './gallery/registry';
import {FPS} from './presets/formats';
import {styleIdSchema} from './presets/styles';
import {calculateProductionMetadata, calculateProjectMetadata, Production} from './production/Production';
import {videoSpecSchema} from './production/spec';
import {themeIdSchema} from './themes/themes';

const projectSchema = videoSpecSchema.extend({projectFile: z.string()});

export const RemotionRoot: React.FC = () => (
	<>
		<Folder name="Producao">
			{/* Demonstração de 30 s (9:16) */}
			<Composition
				id="Demo"
				component={Production}
				schema={videoSpecSchema}
				defaultProps={demoSpec}
				calculateMetadata={calculateProductionMetadata}
				fps={FPS}
				width={1080}
				height={1920}
				durationInFrames={900}
			/>
			<Composition
				id="Demo-Horizontal"
				component={Production}
				schema={videoSpecSchema}
				defaultProps={{...demoSpec, format: 'horizontal' as const}}
				calculateMetadata={calculateProductionMetadata}
				fps={FPS}
				width={1920}
				height={1080}
				durationInFrames={900}
			/>
			<Composition
				id="Demo-AITech"
				component={Production}
				schema={videoSpecSchema}
				defaultProps={{...demoSpec, theme: 'ai-tech' as const, style: 'viral-fast' as const, title: 'Demo — AI Tech'}}
				calculateMetadata={calculateProductionMetadata}
				fps={FPS}
				width={1080}
				height={1920}
				durationInFrames={900}
			/>
			{/* Carrega public/projects/<projectFile> gerado por `npm run storyboard` */}
			<Composition
				id="Projeto"
				component={Production}
				schema={projectSchema}
				defaultProps={{...demoSpec, projectFile: 'exemplo-gta6.json'}}
				calculateMetadata={calculateProjectMetadata as never}
				fps={FPS}
				width={1080}
				height={1920}
				durationInFrames={900}
			/>
		</Folder>

		<Folder name="Efeitos">
			{effectIds.map((id) => (
				<Composition
					key={id}
					id={EFFECTS[id].compId}
					component={EffectShowcase}
					schema={showcaseSchema}
					defaultProps={showcaseDefaults(id)}
					fps={FPS}
					width={1080}
					height={1920}
					durationInFrames={FPS * 4}
				/>
			))}
		</Folder>

		<Composition
			id="Galeria-20-Efeitos"
			component={Gallery}
			schema={z.object({theme: themeIdSchema, style: styleIdSchema})}
			defaultProps={{theme: 'gta6' as const, style: 'cinematic' as const}}
			fps={FPS}
			width={1080}
			height={1920}
			durationInFrames={FPS * 3 * effectIds.length}
		/>
	</>
);
