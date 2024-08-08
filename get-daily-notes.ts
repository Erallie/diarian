import { App, Vault } from 'obsidian';
import { Diarium, DiariumSettings } from './main';

const vault: Vault = app.vault;

const allFiles = vault.getFiles();

const targetPath = 'your/desired/path'; // Replace with your target path
const filteredFiles = allFiles.filter(file => file.path.startsWith(targetPath));

export class DailyNotesHandler extends Diarium {
    app: App;

    const getFilesInPath = (path: string) => {


        const allFiles = this.app.vault.getFiles();
        const filteredFiles = allFiles.filter(file => file.path.startsWith(getDailyNoteSettings.folder));
        return filteredFiles;
    };
}

export function getDailyNoteSettings(): DiariumSettings {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { internalPlugins, plugins } = <any>window.app;

        const { folder, format } =
            internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
        return {
            format: format,
            folder: folder?.trim() || "",
        };
    } catch (err) {
        console.info("No custom daily note settings found!", err);
    }
}