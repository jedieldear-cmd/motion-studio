import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadGrotesk} from '@remotion/google-fonts/SpaceGrotesk';
import {loadFont as loadPlayfair} from '@remotion/google-fonts/PlayfairDisplay';

export const fonts = {
	anton: loadAnton('normal', {weights: ['400'], subsets: ['latin']}).fontFamily,
	inter: loadInter('normal', {weights: ['400', '600', '800'], subsets: ['latin']}).fontFamily,
	mono: loadMono('normal', {weights: ['400', '700'], subsets: ['latin']}).fontFamily,
	grotesk: loadGrotesk('normal', {weights: ['500', '700'], subsets: ['latin']}).fontFamily,
	playfair: loadPlayfair('normal', {weights: ['700'], subsets: ['latin']}).fontFamily,
};
