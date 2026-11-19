import type {VideoSpec} from '../production/spec';

/*
 * Demonstração de 30 s com MATERIAL DE TESTE (cenários e mapa fictícios
 * gerados por código). Não contém fatos, cenas ou mapas oficiais de jogos.
 * Soma das cenas 34,0 s − 5 transições de 0,8 s = 30,0 s (light-leak é overlay, não encurta).
 */
export const demoSpec: VideoSpec = {
	title: 'Demo — Motion Studio',
	theme: 'gta6',
	style: 'cinematic',
	format: 'vertical',
	musicSrc: 'audio/test-music.wav',
	musicVolume: 0.5,
	sfxSrc: 'audio/test-whoosh.wav',
	captions: 'auto',
	intensity: 1,
	showSafeArea: false,
	handle: '@seucanal',
	scenes: [
		{
			kind: 'title',
			duration: 4.5,
			tag: 'DEMO',
			text: 'Bem-vindo a\n*Vice Sunset*',
			subtitle: 'Estúdio de motion para Reels',
			camera: 'zoom-in',
			narration: 'Este é o estúdio de motion do seu canal.',
		},
		{
			kind: 'map',
			duration: 7,
			transition: 'cinematic-reveal',
			text: '',
			tag: 'MAPA DE TESTE',
			map: {
				mode: 'satellite',
				target: [0.48, 0.55],
				coordinates: 'MAPA FICTÍCIO',
				pins: [
					{at: [0.42, 0.47], label: 'Ponto A'},
					{at: [0.56, 0.57], label: 'Ponto B'},
					{at: [0.4, 0.66], label: 'Ponto C'},
				],
				route: [
					[0.42, 0.47],
					[0.5, 0.5],
					[0.56, 0.57],
					[0.49, 0.65],
					[0.4, 0.66],
				],
			},
			narration: 'Zoom de satélite, pins animados e rotas revelando o caminho.',
		},
		{
			kind: 'media',
			duration: 5,
			transition: 'motion-blur',
			text: 'Câmera em *2.5D*',
			camera: 'parallax',
			narration: 'Movimentos de câmera com profundidade de verdade.',
		},
		{
			kind: 'highlight',
			duration: 4.5,
			transition: 'light-leak',
			text: 'Cada [corte] e cada [legenda] no [ritmo] certo',
			narration: 'Tipografia cinética e destaques no ritmo da narração.',
		},
		{
			kind: 'stat',
			duration: 4,
			transition: 'glitch',
			text: 'Prontos para *usar*',
			stat: {to: 20, suffix: ' efeitos', label: 'Biblioteca reutilizável'},
			narration: 'Vinte efeitos reutilizáveis, todos configuráveis.',
		},
		{
			kind: 'cards',
			duration: 4.2,
			transition: 'whip',
			text: '3 estilos',
			tag: 'PRESETS',
			icon: '🎬',
			items: ['Viral Fast', 'Cinematic', 'Documentary'],
			narration: 'Três estilos: viral, cinematográfico e documental.',
		},
		{
			kind: 'outro',
			duration: 4.8,
			transition: 'cinematic-reveal',
			text: 'Bora *criar*?',
			subtitle: 'Siga para mais',
			narration: 'Agora é só mandar o roteiro.',
		},
	],
};
