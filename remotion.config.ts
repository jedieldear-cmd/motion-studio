import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';

// Windows: se o projeto estiver num caminho muito longo (>260 caracteres), o
// Chrome headless dentro de node_modules não abre. Usa a cópia em ~/.remotion-browser.
const shortBrowser = join(homedir(), '.remotion-browser', 'chrome-headless-shell.exe');
if (process.platform === 'win32' && existsSync(shortBrowser)) {
	Config.setBrowserExecutable(shortBrowser);
}
// Mesmo problema para o FFmpeg/compositor do Remotion (cópia em ~/.remotion-browser/compositor).
const shortBinaries = join(homedir(), '.remotion-browser', 'compositor');
if (process.platform === 'win32' && existsSync(join(shortBinaries, 'remotion.exe'))) {
	Config.setBinariesDirectory(shortBinaries);
}

// Padrão do estúdio: H.264 + AAC, compatível com Reels / TikTok / Shorts.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setAudioCodec('aac');
Config.setPixelFormat('yuv420p');
Config.setCrf(18);
Config.setChromiumOpenGlRenderer('angle'); // WebGL (mapas, light leak, 3D)
Config.setOverwriteOutput(true);
Config.setEntryPoint('src/index.ts');
