import { App, Modal, Setting, Platform, TFile, normalizePath, htmlToMarkdown, ProgressBarComponent } from 'obsidian';
import { ZipReader, BlobReader, TextWriter, BlobWriter } from '@zip.js/zip.js';
import Diarian from 'main';
import { logLevel, printToConsole } from './constants';
import moment from 'moment';
import { getModifiedFolderAndFormat } from './get-daily-notes';
import { openDailyNote } from './views/react-nodes/note-preview';

export enum DupEntry {
    append = 'Append all new entries',
    firstEntry = "Keep first entry (don't overwrite)",
    lastEntry = 'Keep last entry (overwrite)'
};


const dupEntryMap: { [key: string]: DupEntry } = {
    append: DupEntry.append,
    firstEntry: DupEntry.firstEntry,
    lastEntry: DupEntry.lastEntry,
};

let skippedMoments: moment.Moment[] = [];

export class ImportView extends Modal {
    plugin: Diarian;
    /* attachDir: string;
    subDir: string; */

    constructor(app: App, plugin: Diarian) {
        super(app);
        this.plugin = plugin;
        /* this.attachDir = attachDirs.defaultDir;
        this.attachDir = 'Attachments'; */
    }


    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('Import journal').setHeading();


        // #region instructions
        const instrDiv = contentEl.createDiv(/* { cls: 'instructions' } */);

        const instrDesc = new DocumentFragment();
        const instrList = instrDesc.createEl('ol'/* , { cls: 'instructions' } */);
        const list1 = instrList.createEl('li', { text: 'Open ' });
        // list1.createEl('strong', { text: 'Diarium' });

        list1.createEl("a", {
            text: "Diarium",
            attr: {
                href: "diarium://",
            },
        });
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
            list5.createEl('span', { text: '  and save the exported file to any location.' });
            instrList.createEl('li', { text: 'Import your saved zip or json file below.' });
        }
        // instrList.createEl('li', { text: 'Decompress the exported zip file.' }); //Change this wording!


        new Setting(instrDiv).setName('Instructions').setDesc(instrDesc).setHeading();

        // #endregion

        const zipFileSetting = new Setting(this.contentEl)
            .setName("Choose exported file")
            .setDesc("Select the zip or json file exported from Diarium.");
        const zipFile = zipFileSetting.controlEl.createEl("input", {
            attr: {
                type: "file",
                multiple: false,
                accept: ".zip, .json"
            }
        });

        // #region duplicate entry

        /* const dupEntryDesc = new DocumentFragment;
        dupEntryDesc.textContent = "What to do when multiple entries share the same note path."
        dupEntryDesc.createEl('br');
        dupEntryDesc.createEl('span', { text: "This also applies when an entry being imported has the path of a note that already exists." }).createEl('br');
        dupEntryDesc.createEl('br');
        dupEntryDesc.createEl('strong', { text: 'Append:' });
        dupEntryDesc.createEl('span', { text: " Append all new entries to the end of the note." }).createEl('br');
        dupEntryDesc.createEl('strong', { text: "First entry:" });
        dupEntryDesc.createEl('span', { text: " Only import the first entry/Do not touch the pre-existing note." }).createEl('br');
        dupEntryDesc.createEl('strong', { text: "Last entry:" });
        dupEntryDesc.createEl('span', { text: ' Only import the last entry/Overwrite the pre-existing note.' }); */

        let dupEntry = 'append' as DupEntry;
        new Setting(this.contentEl)
            .setName('How to handle duplicate notes')
            .setDesc('What to do when multiple entries share the same note path. This also applies when an entry being imported has the path of a note that already exists.')
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(DupEntry)
                    .setValue(dupEntry)
                    .onChange((value) => {
                        dupEntry = value as DupEntry;
                    }));
        //#endregion

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

        //#region import button
        const importDesc = new DocumentFragment;
        importDesc.textContent = 'Begin the importing process.';
        /* const importDescNotes = importDesc.createEl('ul');
        const importNotes1 = importDescNotes.createEl('li', { text: 'Attachments will be uploaded to the location specified under ' });
        importNotes1.createEl('strong', { text: 'Settings → Files and links → Default location for new attachments' });
        importNotes1.createEl('span', { text: '.' })
        const importNotes2 = importDescNotes.createEl('li', { text: 'Properties will be populated according to the data you exported from Diarium.' })
        const importNotes2a = importNotes2.createEl('ul');
        const importNotes2a1 = importNotes2a.createEl('li', { text: 'The ' })
        importNotes2a1.createEl('strong', { text: 'rating' });
        importNotes2a1.createEl('span', { text: ' property name can be set under ' }).createEl('strong', { text: 'Settings → Diarian → Rating → Property name' });
        importNotes2a1.createEl('span', { text: '.' }); */
        importDesc.createEl('br');
        importDesc.createEl('span', { text: 'View ' }).createEl("a", {
            text: "importer notes",
            attr: {
                href: "https://github.com/Erallie/diarian?tab=readme-ov-file#importer-notes",
            },
        });
        importDesc.createEl('span', { text: '.' });

        const importSetting = new Setting(this.contentEl).setName("Import").setDesc(importDesc);
        const importButton = importSetting.controlEl.createEl("button");
        importButton.textContent = "Import";

        //#endregion

        const importTextEl = contentEl.createEl('div');
        importTextEl.empty();

        function setText(msg: string, cls?: string) {
            importTextEl.empty();
            let text = new DocumentFragment;
            const textArray = msg.split('\n');
            if (cls) {
                for (let i = 0; i < textArray.length; i++) {
                    text.createEl('span', { text: textArray[i], cls: cls })
                    if (i != textArray.length - 1)
                        text.createEl('br');
                }
            }
            else {
                for (let i = 0; i < textArray.length; i++) {
                    text.createEl('span', { text: textArray[i] })
                    if (i != textArray.length - 1)
                        text.createEl('br');
                }
            }
            new Setting(importTextEl)
                .setName(text);
        }

        importButton.onclick = async () => { //functions for the import process
            // const { files: datafiles } = jsonFile;
            const { files: datafiles } = zipFile;
            if (datafiles === null || !datafiles.length) {
                const errorText = 'No file has been selected.';
                printToConsole(logLevel.error, errorText);
                setText(errorText, 'setting-error');
                return;
            }

            const importText = 'Starting import...'
            setText(importText);
            printToConsole(logLevel.info, importText);
            const progressBar = new ProgressBarComponent(contentEl).setValue(0);

            skippedMoments = [];

            const mapViewProperty = getMapViewProperty();

            let { format, folder }: any = getModifiedFolderAndFormat();

            for (let i = 0; i < datafiles.length; i++) {
                let index = 0;
                let progressMax = datafiles.length;

                if (datafiles[i].name.endsWith('.json')) {
                    const srcText = await datafiles[i].text();
                    const data = JSON.parse(srcText);
                    if (data.date) {
                        // printToConsole(logLevel.log, 'Is separate entry');
                        progressMax = datafiles.length;
                        index++;
                        progressBar.setValue(index / progressMax * 100);
                        await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry);
                    }
                    else {
                        // printToConsole(logLevel.log, 'Contains all entries');
                        const dataArray: Array<any> = data;
                        progressMax = datafiles.length + dataArray.length - 1;
                        for (const data of dataArray) {
                            index++;
                            progressBar.setValue(index / progressMax * 100);
                            await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry);
                        }
                    }
                    continue;
                }

                // create a BlobReader to read with a ZipReader the zip from a Blob object
                const reader = new ZipReader(new BlobReader(datafiles[i]));

                // get all entries from the zip
                const entries = await reader.getEntries();
                progressMax = entries.length;


                for (let entry of entries) {
                    progressBar.setValue(index / progressMax * 100);
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
                        // printToConsole(logLevel.log, 'Is separate entry');
                        progressMax = entries.length;
                        index++;
                        progressBar.setValue(index / progressMax * 100);
                        await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry);
                    }
                    else {
                        // printToConsole(logLevel.log, 'Contains all entries');
                        const dataArray: Array<any> = JSON.parse(text);
                        progressMax = entries.length + dataArray.length;
                        for (const data of dataArray) {
                            index++;
                            progressBar.setValue(index / progressMax * 100);
                            await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry);
                        }
                        break;
                    }
                }


                for (let entry of entries) {
                    index++;
                    progressBar.setValue(index / progressMax * 100);

                    //skip if is folder
                    if (entry.directory) continue;

                    //skip if isn't attachment
                    let notAttachment: boolean = entry.filename.endsWith(".json") || !(entry.filename.startsWith('media/'));
                    if (notAttachment) continue;

                    const fullName = entry.filename;
                    const date = fullName.slice(fullName.indexOf('/') + 1, fullName.lastIndexOf('/'));
                    const fileMoment = moment(date, 'YYYY-MM-DD_HHmmssSSS');

                    if (skippedMoments.find((skippedMoment) => {
                        return Math.abs(skippedMoment.diff(fileMoment, 'milliseconds', true)) < 1;
                    }))
                        continue;

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
            setText(finishedText);
            printToConsole(logLevel.info, finishedText);


        }

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

async function createAttachment(note: TFile, filePath: string, content: ArrayBuffer, fileMoment: moment.Moment) {

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



async function createEntry(data: any, format: string, folder: string, mapViewProperty: string, plugin: Diarian, dupEntry: DupEntry) {
    const noteMoment = moment(data.date, 'YYYY-MM-DD[T]HH:mm:ss.SSSSSS');
    await writeNote(noteMoment, formatContent(data, noteMoment, mapViewProperty, plugin), format, folder, dupEntry);
}

export async function writeNote(date: moment.Moment, content: { frontmatter: string, body: string }, format: string, alteredFolder: string, dupEntry: DupEntry, openNote?: boolean, plugin?: Diarian) {

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
        if (openNote) {
            if (plugin)
                openDailyNote(fileExists, plugin, this.app);
            else printToConsole(logLevel.warn, `Cannot open ${fileExists.name}:\nPlugin is not defined!`);
        }
        else {
            const dupEntryMapped = dupEntryMap[dupEntry as DupEntry];
            switch (dupEntryMapped) {
                case DupEntry.lastEntry:
                    this.app.vault.process(fileExists, () => {
                        if (content.frontmatter && content.frontmatter != '')
                            return content.frontmatter + '\n' + content.body;
                        else
                            return content.body;
                    })
                    break;
                case DupEntry.firstEntry:
                    skippedMoments[skippedMoments.length] = date;
                    break;
                case DupEntry.append:
                    this.app.vault.process(fileExists, (data: string) => {
                        if (content.frontmatter && content.frontmatter != '')
                            return data + '\n\n---\n\n' + '```\n' + content.frontmatter + '\n```' + '\n\n' + content.body;
                        else return data + '\n\n---\n\n' + content.body;
                    })
                    break;
                default:
                    printToConsole(logLevel.warn, `Cannot create new note:\n${dupEntry} is not an appropriate setting for duplicate entries!`);
            }
        };
    }
    else {
        let newContent;
        if (content.frontmatter && content.frontmatter != '')
            newContent = content.frontmatter + '\n' + content.body;
        else
            newContent = content.body;
        await this.app.vault.create(newPath, newContent, { ctime: Number.parseInt(date.format('x')) });
        if (openNote) {
            const note = this.app.vault.getFileByPath(newPath);
            if (plugin)
                openDailyNote(note, plugin, this.app);
            else printToConsole(logLevel.warn, `Cannot open ${note.name}:\nPlugin is not defined!`);
        }

    }

}


// Transformation functions
function formatContent(array: any, moment: moment.Moment, mapViewProperty: string, plugin: Diarian) {

    let frontmatter = '---';
    if (array.location) {
        frontmatter += `\n${mapViewProperty}: ${array.location}`;
    }
    if (array.rating) {
        frontmatter += `\n${plugin.settings.ratingProp}: ${array.rating}/5`;
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
    if (array.tracker.length != 0) {
        for (let string of array.tracker) {
            const markdownString = htmlToMarkdown(string);
            const key = markdownString.slice(0, markdownString.lastIndexOf(':'));
            const value = markdownString.slice(markdownString.lastIndexOf(':'));
            frontmatter += `\n"${key}"${value}`;
        }
    }
    frontmatter += '\n---';

    let body = '';
    if (array.heading != '') {
        body += `# ${htmlToMarkdown(array.heading)}\n`;
    }
    if (array.html && array.html != '') {
        body += `${htmlToMarkdown(array.html)}`;
    }

    return {
        frontmatter: frontmatter,
        body: body
    };
}


function parseSun(noteMoment: moment.Moment, sun: string) {
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