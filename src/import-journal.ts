import { App, Modal, Setting, Platform, TFile, normalizePath, htmlToMarkdown, ProgressBarComponent, moment } from 'obsidian';
import { ZipReader, BlobReader, TextWriter, BlobWriter } from '@zip.js/zip.js';
import Diarian from 'src/main';
import { logLevel, printToConsole } from './constants';
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

export enum DupProps {
    codeblock = 'Insert codeblock before entry',
    firstEntry = "Keep first entry (don't overwrite)",
    lastEntry = 'Keep last entry (overwrite)'
};

const dupPropsMap: { [key: string]: DupProps } = {
    codeblock: DupProps.codeblock,
    firstEntry: DupProps.firstEntry,
    lastEntry: DupProps.lastEntry,
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
        list1.appendText(' and head over to the ')
        list1.createEl('strong', { text: 'Export' });
        if (Platform.isMacOS && Platform.isDesktop) {
            list1.appendText(' tab.');
        }
        else {
            list1.appendText(' menu.');
        }
        const list2 = instrList.createEl('li', { text: 'Under ' })
        list2.createEl('strong', { text: 'File format' });
        list2.appendText(', select ')
        list2.createEl('strong', { text: 'JSON (.json)' });
        list2.appendText('.');
        /* const list3 = instrList.createEl('li')
        list3.createEl('strong', { text: 'Uncheck' });
        list3.createEl('span', { text: ' the option ' }).createEl('strong', { text: 'Create separate file for each entry' });
        list3.createEl('span', { text: '.' }); */
        const list4 = instrList.createEl('li')
        list4.createEl('strong', { text: 'Check' });
        list4.appendText(' the option ')
        list4.createEl('strong', { text: 'Create separate files for attachments' });
        list4.appendText('.');
        instrList.createEl('li', { text: 'Set the other options according to your liking.' });
        if (!Platform.isIosApp) {
            const list5 = instrList.createEl('li', { text: 'Select ' });
            list5.createEl('strong', { text: 'Export' });
            list5.appendText('.');
        }
        else {
            const list5 = instrList.createEl('li', { text: 'Select ' });
            list5.createEl('strong', { text: 'Export → Save to Files' });
            list5.appendText('  and save the exported file to any location.');
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

        const dupEntryDesc = new DocumentFragment;
        dupEntryDesc.textContent = 'What to do when multiple entries share the same note path. This also applies when an entry being imported has the path of a note that already exists.';
        dupEntryDesc.createEl('br');
        dupEntryDesc.createEl('br');
        dupEntryDesc.appendText('For multiple notes per day, follow ');
        dupEntryDesc.createEl('a', {
            text: 'these instructions',
            attr: {
                href: "https://github.com/Erallie/diarian?tab=readme-ov-file#multiplenested-daily-notes",
            },
        });
        dupEntryDesc.appendText('.');

        let dupEntry = 'append' as DupEntry;
        const dupEntrySetting = new Setting(this.contentEl)
            .setName('How to handle duplicate notes')
            .setDesc(dupEntryDesc);

        // #region Duplicate Properties
        const propsDiv = this.contentEl.createDiv();

        let dupProps = 'codeblock' as DupProps;

        function addPropsSetting() {
            const dupEntryMapped = dupEntryMap[dupEntry as DupEntry];
            if (dupEntryMapped == DupEntry.append) {
                propsDiv.createSpan();
                new Setting(propsDiv)
                    .setName('How to handle appended properties')
                    .setDesc('What to do with imported properties when appending multiple entries to the same note.')
                    .addDropdown((dropdown) =>
                        dropdown
                            .addOptions(DupProps)
                            .setValue(dupProps)
                            .onChange((value) => {
                                dupProps = value as DupProps;
                            })
                    )
            }
            else propsDiv.empty();
        }
        addPropsSetting();
        // #endregion

        dupEntrySetting.addDropdown((dropdown) =>
            dropdown
                .addOptions(DupEntry)
                .setValue(dupEntry)
                .onChange((value) => {
                    dupEntry = value as DupEntry;
                    addPropsSetting();
                }));
        //#endregion

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
        importDesc.appendText('View ')
        importDesc.createEl("a", {
            text: "importer notes",
            attr: {
                href: "https://github.com/Erallie/diarian?tab=readme-ov-file#importer-notes",
            },
        });
        importDesc.appendText('.');

        const importSetting = new Setting(this.contentEl).setName("Import").setDesc(importDesc);
        const importButton = importSetting.controlEl.createEl("button");
        importButton.textContent = "Import";

        //#endregion

        const importTextEl = contentEl.createDiv();
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
            importTextEl.createSpan();
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

            let { format, folder }: any = getModifiedFolderAndFormat(this.plugin.settings);

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
                        await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry, dupProps);
                    }
                    else {
                        // printToConsole(logLevel.log, 'Contains all entries');
                        const dataArray: Array<any> = data;
                        progressMax = datafiles.length + dataArray.length - 1;
                        for (const data of dataArray) {
                            index++;
                            progressBar.setValue(index / progressMax * 100);
                            await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry, dupProps);
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
                        await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry, dupProps);
                    }
                    else {
                        // printToConsole(logLevel.log, 'Contains all entries');
                        const dataArray: Array<any> = JSON.parse(text);
                        progressMax = entries.length + dataArray.length;
                        for (const data of dataArray) {
                            index++;
                            progressBar.setValue(index / progressMax * 100);
                            await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry, dupProps);
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

    this.app.vault.createBinary(filePath, content, { ctime: Number.parseInt(fileMoment.format('x')) });
    //attach to file
    this.app.vault.process(note, (data: string) => {
        data += `\n\n![[${filePath}]]`;
        return data;
    }, { ctime: Number.parseInt(fileMoment.format('x')) })
}



async function createEntry(data: any, format: string, folder: string, mapViewProperty: string, plugin: Diarian, dupEntry: DupEntry, dupProps: DupProps) {
    const noteMoment = moment(data.date, 'YYYY-MM-DD[T]HH:mm:ss.SSSSSS');
    await writeNote(noteMoment, formatContent(data, noteMoment, mapViewProperty, plugin), format, folder, dupEntry, dupProps);
}

export async function writeNote(date: moment.Moment, content: { frontmatter: string, frontmatterObj: any, body: string }, format: string, alteredFolder: string, dupEntry: DupEntry, dupProps: DupProps, newNote?: boolean, plugin?: Diarian) {

    const noteFormat = date.format(format);

    // create the correct folder first.
    let newPath = normalizePath(alteredFolder + noteFormat + '.md');
    const index = newPath.lastIndexOf('/');
    if (index != -1) {
        const folderPath = newPath.slice(0, index);
        // printToConsole(logLevel.log, folderPath);
        if (!this.app.vault.getFolderByPath(folderPath)) {
            await this.app.vault.createFolder(folderPath);
        }
    }

    const fileExists = await this.app.vault.getFileByPath(newPath);
    //create new file
    if (fileExists) {
        if (newNote) {
            if (plugin)
                openDailyNote(fileExists, plugin, this.app, true);
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
                    const dupPropsMapped = dupPropsMap[dupProps as DupProps];
                    switch (dupPropsMapped) {
                        case DupProps.codeblock:
                            this.app.vault.process(fileExists, (data: string) => {
                                if (content.frontmatter && content.frontmatter != '')
                                    return data + '\n\n---\n\n' + '```\n' + content.frontmatter + '\n```' + '\n\n' + content.body;
                                else return data + '\n\n---\n\n' + content.body;
                            })
                            break;
                        case DupProps.firstEntry:
                            this.app.vault.process(fileExists, (data: string) => {
                                return data + '\n\n---\n\n' + content.body;
                            })
                            break;
                        case DupProps.lastEntry:
                            this.app.vault.process(fileExists, (data: string) => {
                                return data + '\n\n---\n\n' + content.body;
                            })
                            this.app.fileManager.processFrontMatter(fileExists, (frontmatter: any) => {
                                for (let [key, value] of Object.entries(content.frontmatterObj)) {
                                    frontmatter[key] = value;
                                }
                            });
                            break;
                        default:
                            printToConsole(logLevel.warn, `Cannot append properties:\n${dupProps} is not an appropriate setting for duplicate properties!`);
                    }
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
        if (newNote) {
            const note = this.app.vault.getFileByPath(newPath);
            if (plugin)
                openDailyNote(note, plugin, this.app, true);
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
    if (array.tags && array.tags.length != 0) {
        frontmatter += `\ntags:`;
        for (let i in array.tags) {
            frontmatter += `\n  - ${array.tags[i]}`;
        }
    }
    if (array.people && array.people.length != 0) {
        frontmatter += `\npeople:`;
        for (let i in array.people) {
            frontmatter += `\n  - ${array.people[i]}`;
        }
    }
    if (array.weather) {
        frontmatter += `\nweather: ${array.weather}`
    }
    if (array.sun && array.sun != '') {
        frontmatter += parseSun(moment, array.sun).text;
    }
    if (array.lunar && array.lunar != '') {
        frontmatter += `\nlunar phase: ${array.lunar}`
    }
    if (array.tracker && array.tracker.length != 0) {
        for (let string of array.tracker) {
            const markdownString = htmlToMarkdown(string);
            const key = markdownString.slice(0, markdownString.lastIndexOf(':'));
            const value = markdownString.slice(markdownString.lastIndexOf(':'));
            frontmatter += `\n"${key}"${value}`;
        }
    }
    frontmatter += '\n---';

    let body = '';
    if (array.heading && array.heading != '') {
        body += `# ${htmlToMarkdown(array.heading)}\n`;
    }
    if (array.html && array.html != '') {
        body += `${htmlToMarkdown(array.html)}`;
    }

    let frontmatterObj: any = {};
    if (array.location)
        frontmatterObj[mapViewProperty] = array.location.toString();
    if (array.rating)
        frontmatterObj[plugin.settings.ratingProp] = `${array.rating}/5`;
    if (array.tags && array.tags.length != 0) {
        frontmatterObj['tags'] = [];
        for (let i in array.tags) {
            frontmatterObj['tags'][i] = array.tags[i];
        }
    }
    if (array.people && array.people.length != 0) {
        frontmatterObj['people'] = [];
        for (let i in array.people) {
            frontmatterObj['people'][i] = array.people[i];
        }
    }
    if (array.weather)
        frontmatterObj['weather'] = array.weather;
    if (array.sun && array.sun != '') {
        const { sunrise, sunset } = parseSun(moment, array.sun)
        frontmatterObj['sunrise'] = sunrise;
        frontmatterObj['sunset'] = sunset;
    }
    if (array.lunar && array.lunar != '')
        frontmatterObj['lunar phase'] = array.lunar;
    if (array.tracker && array.tracker.length != 0)
        for (let string of array.tracker) {
            const markdownString = htmlToMarkdown(string);
            const key = markdownString.slice(0, markdownString.lastIndexOf(':'));
            const value = markdownString.slice(markdownString.lastIndexOf(':')).trim();
            frontmatterObj[key] = value;
        }

    return {
        frontmatter: frontmatter,
        frontmatterObj: frontmatterObj,
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

    return {
        sunrise: newRiseText,
        sunset: newSetText,
        text: "\nsunrise: " + newRiseText
            + "\nsunset: " + newSetText
    }

    /* return "\nsunrise: " + newRiseText
        + "\nsunset: " + newSetText; */

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