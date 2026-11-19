/** Catálogo dos 20 efeitos (nome, categoria, arquivo-fonte). */
export const effectIds = [
	'smooth-zoom',
	'whip-pan',
	'parallax-25d',
	'camera-shake',
	'rack-focus',
	'map-flyover',
	'animated-pins',
	'route-reveal',
	'region-highlight',
	'satellite-zoom',
	'kinetic-typography',
	'word-highlight',
	'animated-captions',
	'counter',
	'info-cards',
	'motion-blur-transition',
	'light-leak',
	'speed-ramp',
	'glitch-transition',
	'cinematic-reveal',
] as const;
export type EffectId = (typeof effectIds)[number];

type EffectMeta = {
	n: number;
	name: string;
	compId: string;
	category: 'Câmera' | 'Mapas' | 'Texto' | 'Transições';
	component: string;
	file: string;
	defaultDuration: number;
	sampleText: string;
};

const m = (n: number, name: string, category: EffectMeta['category'], component: string, file: string, defaultDuration: number, sampleText = ''): EffectMeta => ({
	n,
	name,
	compId: `E${String(n).padStart(2, '0')}-${name.replace(/[^A-Za-z0-9]/g, '')}`,
	category,
	component,
	file,
	defaultDuration,
	sampleText,
});

export const EFFECTS: Record<EffectId, EffectMeta> = {
	'smooth-zoom': m(1, 'Smooth Zoom', 'Câmera', 'SmoothZoom', 'src/camera/SmoothZoom.tsx', 3),
	'whip-pan': m(2, 'Whip Pan', 'Câmera', 'WhipPan / whipPan()', 'src/camera/WhipPan.tsx', 0.5),
	'parallax-25d': m(3, 'Parallax 2.5D', 'Câmera', 'Parallax25D', 'src/camera/Parallax25D.tsx', 3.5),
	'camera-shake': m(4, 'Camera Shake', 'Câmera', 'CameraShake', 'src/camera/CameraShake.tsx', 0.8),
	'rack-focus': m(5, 'Rack Focus', 'Câmera', 'RackFocus', 'src/camera/RackFocus.tsx', 1.4),
	'map-flyover': m(6, 'Map Flyover', 'Mapas', 'MapFlyover', 'src/maps/MapEffects.tsx', 3.5),
	'animated-pins': m(7, 'Animated Pins', 'Mapas', 'AnimatedPins', 'src/maps/MapEffects.tsx', 1),
	'route-reveal': m(8, 'Route Reveal', 'Mapas', 'RouteReveal', 'src/maps/MapEffects.tsx', 2.2),
	'region-highlight': m(9, 'Region Highlight', 'Mapas', 'RegionHighlight', 'src/maps/MapEffects.tsx', 1.4, 'Região'),
	'satellite-zoom': m(10, 'Satellite Zoom', 'Mapas', 'SatelliteZoom', 'src/maps/MapEffects.tsx', 2.8, 'Alvo'),
	'kinetic-typography': m(11, 'Kinetic Typography', 'Texto', 'KineticTypography', 'src/captions/KineticTypography.tsx', 1, 'Bem-vindo a\n*Vice City*'),
	'word-highlight': m(12, 'Word Highlight', 'Texto', 'WordHighlight', 'src/captions/WordHighlight.tsx', 0.45, 'Cada [detalhe] conta na [edição] final'),
	'animated-captions': m(13, 'Animated Captions', 'Texto', 'AnimatedCaptions', 'src/captions/AnimatedCaptions.tsx', 2.6, 'Legendas sincronizadas palavra por palavra, prontas para Reels'),
	counter: m(14, 'Counter Animation', 'Texto', 'CounterAnimation', 'src/captions/CounterAnimation.tsx', 1.8, 'Ano de exemplo'),
	'info-cards': m(15, 'Animated Info Cards', 'Texto', 'InfoCard', 'src/captions/InfoCard.tsx', 0.8, 'Cartão de informação'),
	'motion-blur-transition': m(16, 'Motion Blur Transition', 'Transições', 'motionBlurSlide()', 'src/transitions/presentations.tsx', 0.5),
	'light-leak': m(17, 'Light Leak', 'Transições', 'LightLeak', 'src/transitions/LightLeak.tsx', 1.2),
	'speed-ramp': m(18, 'Speed Ramp', 'Transições', 'SpeedRamp', 'src/transitions/SpeedRamp.tsx', 0.8),
	'glitch-transition': m(19, 'Glitch Transition', 'Transições', 'glitch()', 'src/transitions/presentations.tsx', 0.5),
	'cinematic-reveal': m(20, 'Cinematic Reveal', 'Transições', 'cinematicReveal()', 'src/transitions/presentations.tsx', 0.9),
};
