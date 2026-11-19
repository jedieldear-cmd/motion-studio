import React, {createContext, useContext, useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import {formatFromSize, safeAreas, type FormatId} from '../presets/formats';
import {getStyle, type StyleId, type StylePreset} from '../presets/styles';
import {getTheme, type Theme, type ThemeId} from './themes';

type StudioContextValue = {theme: Theme; style: StylePreset};

const StudioContext = createContext<StudioContextValue>({
	theme: getTheme('gta6'),
	style: getStyle('cinematic'),
});

/** Define tema + estilo para todos os componentes abaixo. */
export const StudioProvider: React.FC<{
	themeId?: ThemeId;
	styleId?: StyleId;
	/** Sobrescreve cores do tema (ex.: ajustes feitos no Studio). */
	colorOverrides?: Partial<Theme['colors']>;
	children: React.ReactNode;
}> = ({themeId, styleId, colorOverrides, children}) => {
	const value = useMemo(() => {
		const base = getTheme(themeId);
		const theme: Theme = colorOverrides
			? {...base, colors: {...base.colors, ...stripUndefined(colorOverrides)}}
			: base;
		return {theme, style: getStyle(styleId)};
	}, [themeId, styleId, colorOverrides]);
	return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
};

const stripUndefined = <T extends object>(o: T): Partial<T> =>
	Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== '')) as Partial<T>;

export const useStudio = () => useContext(StudioContext);
export const useTheme = () => useContext(StudioContext).theme;

/** Formato atual + margens de segurança da plataforma. */
export const useSafeArea = () => {
	const {width, height} = useVideoConfig();
	const format: FormatId = formatFromSize(width, height);
	return {format, width, height, ...safeAreas[format]};
};
