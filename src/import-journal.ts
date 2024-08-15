import { App, Modal, Setting, Platform, TFile, normalizePath, htmlToMarkdown } from 'obsidian';
// import * as zip from "@zip.js/zip.js";
import { ZipReader, BlobReader, TextWriter, BlobWriter } from '@zip.js/zip.js';
import Diarium from 'main';
import { logLevel, printToConsole, DEFAULT_FORMAT } from './constants';
import moment from 'moment';
import { getDailyNoteSettings, getModifiedFolderAndFormat } from './get-daily-notes';


export class ImportView extends Modal {
    plugin: Diarium;
    /* attachDir: string;
    subDir: string; */

    constructor(app: App, plugin: Diarium) {
        super(app);
        this.plugin = plugin;
        /* this.attachDir = attachDirs.defaultDir;
        this.attachDir = 'Attachments'; */
    }


    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('Import journal').setHeading();

        // contentEl.createEl('br');

        const instrDiv = contentEl.createDiv({ cls: 'instructions' });

        const instrDesc = new DocumentFragment();
        const instrList = instrDesc.createEl('ol', { cls: 'instructions' });
        const list1 = instrList.createEl('li', { text: 'Open ' });
        list1.createEl('strong', { text: 'Diarium' });
        list1.createEl('span', { text: ' and head over to the ' }).createEl('strong', { text: 'Export' });
        if (Platform.isMacOS && Platform.isDesktop) {
            list1.createEl('span', { text: ' tab.' });
        }
        else {
            list1.createEl('span', { text: ' menu.' });
        }
        const list2 = instrList.createEl('li', { text: 'Under ' })
        list2.createEl('strong', { text: 'File format' });
        list2.createEl('span', { text: ', select ' }).createEl('strong', { text: 'JSON (.json)' });
        list2.createEl('span', { text: '.' });
        /* const list3 = instrList.createEl('li')
        list3.createEl('strong', { text: 'Uncheck' });
        list3.createEl('span', { text: ' the option ' }).createEl('strong', { text: 'Create separate file for each entry' });
        list3.createEl('span', { text: '.' }); */
        const list4 = instrList.createEl('li')
        list4.createEl('strong', { text: 'Check' });
        list4.createEl('span', { text: ' the option ' }).createEl('strong', { text: 'Create separate files for attachments' });
        list4.createEl('span', { text: '.' });
        instrList.createEl('li', { text: 'Set the other options according to your liking.' });
        if (!Platform.isIosApp) {
            const list5 = instrList.createEl('li', { text: 'Select ' });
            list5.createEl('strong', { text: 'Export' });
            list5.createEl('span', { text: '.' });
        }
        else {
            const list5 = instrList.createEl('li', { text: 'Select ' });
            list5.createEl('strong', { text: 'Export → Save to Files' });
            list5.createEl('span', { text: '  and save the zip file to any location.' });
            instrList.createEl('li', { text: 'Import your saved zip file below.' });
        }
        // instrList.createEl('li', { text: 'Decompress the exported zip file.' }); //Change this wording!


        new Setting(instrDiv).setName('Instructions').setDesc(instrDesc).setHeading();


        /* const openCalendarButton = new DocumentFragment();
        openCalendarButton.createEl('img', {
            text: "Open calendar",
            attr: {
                src: "Attachments/icons/lucide-calendar-search.svg"
            },
        });
        openCalendarButton.createEl('span', { text: ' Open calendar' }); */

        /* const jsonFileSetting = new Setting(this.contentEl).setName("Choose json file").setDesc("Select the exported .json file containing your Diarium journal");
        const jsonFile = jsonFileSetting.controlEl.createEl("input", {
            attr: {
                type: "file",
                multiple: false,
                accept: ".json"
            }
        }); */

        const zipFileSetting = new Setting(this.contentEl)
            .setName("Choose zip file")
            .setDesc("Select the zip file exported from Diarium.");
        const zipFile = zipFileSetting.controlEl.createEl("input", {
            attr: {
                type: "file",
                multiple: false,
                accept: ".zip"
            }
        });

        /* const locationSetting = new Setting(this.contentEl)
            .setName('Location for attachments')
            .setDesc('Where imported attachments are placed.')
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(attachDirs)
                    .setValue(this.attachDir)
                    .onChange((value) => {
                        this.attachDir = value as attachDirs;
                        printToConsole(logLevel.log, this.attachDir.toString());
                        let chosenFolder;

                        if (this.attachDir == 'dailyNotesSubDir') {
                            chosenFolder = 'the Daily notes folder';
                        }
                        else if (this.attachDir == 'noteSubdir') {
                            chosenFolder = 'the note\'s folder';
                        }

                        if (this.attachDir == 'dailyNotesSubDir' || this.attachDir == 'noteSubdir') {
                            toggleDir(true, 'Subfolder name', `If ${chosenFolder} is \"vault/folder\", and you set the subfolder name to \"attachments\", attachments will be saved to \"vault/folder/attachments\".`);
                        }
                        else if (this.attachDir == 'customDir') {
                            toggleDir(true, 'Folder path', 'Imported attachments will be placed in this folder.');
                        }
                        else {
                            printToConsole(logLevel.log, 'notCustomDir');
                            toggleDir(false);
                        };
                    }),
        );

        const dirDiv = this.contentEl.createDiv(); */

        // use https://docs.obsidian.md/Reference/TypeScript+API/SuggestModal

        /* const attachFolder = new Setting(this.contentEl).setName('Folder path').addSearch((cb) => {
            new FolderSuggest(this.app, cb.inputEl, this.plugin);
            cb.setPlaceholder('Example: folder1/')
                .setValue(this.plugin.settings.folderName)
                .onChange((newFolder) => {
                    this.plugin.settings.folderName = newFolder;
                    this.plugin.saveSettings();
                    this.getFilesByFolder();
                }); */

        /* function toggleDir(show: boolean, name?: string, desc?: string) {
            switch (show) {
                case true:
                    if (name && desc) {
                        dirDiv.empty();
                        new Setting(dirDiv)
                            .setName(name)
                            .setDesc(desc)
                            .addText((text) =>
                                text.setValue(this.subDir)
                                    .onChange((value) => {
                                        this.subDir = value;
                                    }),
                            );
                    }
                    else printToConsole(logLevel.warn, 'toggleDirSetting() cannot be invoked!\nname and/or desc are undefined!');
                    break;
                case false:
                    dirDiv.empty();
                    break;
            }
        } */

        const importSetting = new Setting(this.contentEl).setName("Import").setDesc("Begin the importing process.");
        const importButton = importSetting.controlEl.createEl("button");
        importButton.textContent = "Import";

        const errorTextEl = contentEl.createEl('div', { cls: 'setting-error' });
        errorTextEl.empty();

        const importTextEl = contentEl.createEl('div');
        importTextEl.empty();

        // use https://docs.obsidian.md/Reference/TypeScript+API/ProgressBarComponent instead of importTextEl

        function setText(text: any, msg: string) {
            text.empty();
            text.createEl('span', { text: msg });
        }

        importButton.onclick = async () => {
            // const { files: datafiles } = jsonFile;
            const { files: datafiles } = zipFile;
            if (datafiles === null || !datafiles.length) {
                const errorText = 'No zip file has been selected.';
                printToConsole(logLevel.error, errorText);
                setText(errorTextEl, errorText);
                return;
            }

            const importText = 'Starting import...'
            setText(importTextEl, importText);
            printToConsole(logLevel.info, importText);

            const mapViewProperty = getMapViewProperty();

            let { format, folder }: any = getModifiedFolderAndFormat();

            for (let i = 0; i < datafiles.length; i++) {
                // create a BlobReader to read with a ZipReader the zip from a Blob object
                const reader = new ZipReader(new BlobReader(datafiles[i]));

                // get all entries from the zip
                const entries = await reader.getEntries();

                for (let entry of entries) {
                    //skip if is folder
                    if (entry.directory) continue;

                    //skip if isn't json
                    let isEntry: boolean = entry.filename.endsWith(".json") && !(entry.filename.startsWith('media/'));
                    if (!isEntry) continue;

                    if (!entry.getData) {
                        printToConsole(logLevel.warn, `Cannot get data from ${entry.filename}:\nentry.getData() is undefined.`);
                        continue;
                    }
                    const text = await entry.getData(
                        // writer
                        new TextWriter(),
                        // options
                        {
                            /* onstart: (total) => {
                                // onprogress callback
                            } */
                        }
                    );

                    const data = JSON.parse(text);
                    if (data.date) {
                        printToConsole(logLevel.log, 'Is separate entry');
                        await createEntry(data, format, folder, mapViewProperty);
                    }
                    else {
                        // printToConsole(logLevel.log, 'Contains all entries');
                        const dataArray: Array<any> = JSON.parse(text);
                        for (const data of dataArray) {
                            await createEntry(data, format, folder, mapViewProperty);
                        }
                        break;
                    }
                }


                for (let entry of entries) {
                    //skip if is folder
                    if (entry.directory) continue;

                    //skip if isn't attachment
                    let notAttachment: boolean = entry.filename.endsWith(".json") || !(entry.filename.startsWith('media/'));
                    if (notAttachment) continue;

                    const fullName = entry.filename;
                    const date = fullName.slice(fullName.indexOf('/') + 1, fullName.lastIndexOf('/'));
                    const fileMoment = moment(date, 'YYYY-MM-DD_HHmmssSSS');
                    const name = fullName.slice(fullName.lastIndexOf('/') + 1);

                    if (!entry.getData) {
                        printToConsole(logLevel.warn, `Cannot get data from ${entry.filename}:\nentry.getData() is undefined.`);
                        continue;
                    }

                    let content: ArrayBuffer;
                    await entry.getData(new BlobWriter())
                        .then(async result => {
                            await result.arrayBuffer().then(arrayBuffer => {
                                content = arrayBuffer;
                            });
                        });

                    const filePath = normalizePath(`${folder}${fileMoment.format(format)}.md`);

                    const note = this.app.vault.getFileByPath(filePath);

                    if (!note) {
                        printToConsole(logLevel.warn, `Cannot attach file:\n${name} from ${fullName} does not have an associated note!`)
                        continue;
                    }

                    /* let filePath;
                    switch (this.attachDir) {
                        case 'defaultDir':
                            filePath = this.app.fileManager.getAvailablePathForAttachment(name, note.path);
                            break;
                        case 'dailyNotesDir':
                            filePath = `${folder}/${name}`;
                            break;
                        case 'dailyNotesSubDir':
                            filePath = `${folder}/${this.subDir}/${name}`;
                            break;
                        case 'noteDir':
                            // if note is in root.
                            if (!note.parent) filePath = name;
                                
                            // if note is not in root.
                            else filePath = `${note.parent.path}/${name}`;

                            break;
                        case 'noteSubdir':
                            // if note is in root.
                            if (!note.parent) filePath = `${this.subDir}/${name}`;

                            // if note is not in root.
                            else filePath = `${note.parent.path}/${this.subDir}/${name}`;
                            break;
                        case 'customDir':
                            filePath = `${this.subDir}/${name}`;
                            break;
                        default:
                            printToConsole(logLevel.warn, 'Cannot attach file:\nThe attachment location is not properly specified!');
                            continue;
                    } */

                    await this.app.fileManager.getAvailablePathForAttachment(name, note.path)
                        .then(filePath => {
                            createAttachment(note, filePath, content, fileMoment);
                        });
                }

                await reader.close();
                // console.log(`Processing input file ${datafiles[i].name}`);

            }


            let finishedText = 'Import finished!'
            if (Platform.isMobile) finishedText += '\nReopen your vault to access the imported files.';
            setText(importTextEl, finishedText);
            printToConsole(logLevel.info, finishedText);


        }

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

async function createAttachment(note: TFile, filePath: string, content: ArrayBuffer, fileMoment: any) {

    const index = filePath.lastIndexOf('/');
    if (index != -1) {
        const folderPath = filePath.slice(0, filePath.lastIndexOf('/'));
        if (!this.app.vault.getFolderByPath(folderPath)) {
            this.app.vault.createFolder(folderPath);
        }
    }

    /* const exists = await this.app.vault.getFileByPath(filePath);
    //create new file
    if (this.app.vault.getFileByPath(filePath)) {
        // add code here for if the file already exists
    }
    else { */
    // this is incorrect. it does not write the file correctly.
    this.app.vault.createBinary(filePath, content, { ctime: Number.parseInt(fileMoment.format('x')) });
    /* } */
    this.app.vault.process(note, (data: string) => {
        data += `\n\n![[${filePath}]]`;
        return data;
    }, { ctime: Number.parseInt(fileMoment.format('x')) })
    //attach to file
}



async function createEntry(data: any, format: string, folder: string, mapViewProperty: string,) {
    const noteMoment = moment(data.date, 'YYYY-MM-DD[T]HH:mm:ss.SSSSSS');
    await writeNote(noteMoment, formatContent(data, noteMoment, mapViewProperty), format, folder);
}

export async function writeNote(date: any, content: string, format: string, alteredFolder: string, openNote?: boolean) {

    /* if (!format || !folder) {
        let { format, folder }: any = getDailyNoteSettings();
        if (format == '') format = DEFAULT_FORMAT;
        let newFolder = '';
        if (normalizePath(folder) == '/') newFolder = normalizePath(folder);
        else if (normalizePath(folder) != '') newFolder = normalizePath(folder) + '/';
    } */

    const noteFormat = date.format(format);

    // create the correct folder first.
    let newPath = normalizePath(alteredFolder + noteFormat + '.md');
    const index = newPath.lastIndexOf('/');
    if (index != -1) {
        const folderPath = newPath.slice(0, index);
        // printToConsole(logLevel.log, folderPath);
        if (!this.app.vault.getFolderByPath(folderPath)) {
            this.app.vault.createFolder(folderPath);
        }
    }

    const fileExists = await this.app.vault.getFileByPath(newPath);
    //create new file
    if (fileExists) {
        if (openNote) void this.app.workspace.getLeaf(false).openFile(fileExists);
        else return;
    }
    else {
        await this.app.vault.create(newPath, content, { ctime: Number.parseInt(date.format('x')) });
        if (openNote) {
            const note = this.app.vault.getFileByPath(newPath);

            void this.app.workspace.getLeaf(false).openFile(note);
        }

    }

}


// Transformation functions
function formatContent(array: any, moment: any, mapViewProperty: string,) {
    let frontmatter = '---';
    if (array.location) {
        frontmatter += `\n${mapViewProperty}: ${array.location}`;
    }
    if (array.rating) {
        frontmatter += `\nrating: ${array.rating}/5`;
    }
    if (array.tags.length != 0) {
        frontmatter += `\ntags:`;
        for (let i in array.tags) {
            frontmatter += `\n  - ${array.tags[i]}`;
        }
    }
    if (array.people.length != 0) {
        frontmatter += `\npeople:`;
        for (let i in array.people) {
            frontmatter += `\n  - ${array.people[i]}`;
        }
    }
    if (array.weather) {
        frontmatter += `\nweather: ${array.weather}`
    }
    if (array.sun && array.sun != '') {
        frontmatter += parseSun(moment, array.sun);
    }
    if (array.lunar && array.lunar != '') {
        frontmatter += `\nlunar phase: ${array.lunar}`
    }
    frontmatter += '\n---';
    let body = '';
    if (array.heading != '') {
        body += `\n# ${htmlToMarkdown(array.heading)}`;
    }
    if (array.html && array.html != '') {
        body += `\n${htmlToMarkdown(array.html)}`;
    }

    return frontmatter + body;
}


function parseSun(noteMoment: any, sun: string) {
    const start = noteMoment.format('YYYY-MM-DD[T]');
    //2000-12-31T15:14:00

    // ☀️ Sunrise: 5:32 AM Sunset: 7:39 PM

    const riseText = sun.slice(('☀️ Sunrise: ').length, sun.indexOf(' Sunset:'));
    const setText = sun.slice(sun.indexOf('Sunset: ') + ('Sunset: ').length);

    // printToConsole(logLevel.log, `Sunrise text = '${sunriseText}'\nSunset text = '${sunsetText}'`);
    // Sunrise text = '5:28 AM'
    // Sunset text = '7:43 PM'

    const riseMoment = moment(riseText, 'h:mm A');
    const setMoment = moment(setText, 'h:mm A');

    const newRiseText = start + riseMoment.format('HH:mm:[00]');
    const newSetText = start + setMoment.format('HH:mm:[00]');


    return "\nsunrise: " + newRiseText
        + "\nsunset: " + newSetText;

}


export function getMapViewProperty() {
    /* from: https://github.com/liamcain/obsidian-daily-notes-interface/blob/123969e461b7b0927c91fe164a77da05f43aba6a/src/settings.ts#L22 */
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // const { internalPlugins } = <any>window.app;
        // const mapView = (<any>window.app).plugins.getPlugin("map-view");

        const pluginManager = (this.app).plugins;

        const settings =
            pluginManager.getPlugin("obsidian-map-view")?.settings || {};
        // console.log("Daily note settings found.\n\tformat = " + format);
        if (!settings.frontMatterKey || settings.frontMatterKey === undefined || settings.frontMatterKey == '') {
            printToConsole(logLevel.warn, 'No frontmatter key found in any custom Map view settings!');
            return 'location';
        }
        // printToConsole(logLevel.log, 'frontMatterKey: ' + settings.frontMatterKey);
        return settings.frontMatterKey as string;
    } catch (err) {
        const errorText = "No custom map view settings found!"
        printToConsole(logLevel.info, `${errorText}\n${err}`);
        return 'location';
    }
}