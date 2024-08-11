import { App, Modal, Setting, Notice, Vault, TFile, FileManager } from 'obsidian';
// import * as zip from "@zip.js/zip.js";
import { Writer, ZipReader, BlobReader, TextWriter, Reader, BlobWriter } from '@zip.js/zip.js';
import Diarium from 'main';
import { logLevel, printToConsole, DEFAULT_FORMAT } from './constants';
import moment from 'moment';
import { getDailyNoteSettings } from './get-daily-notes';

/* enum attachDirs {
    defaultDir = "The folder specified in Settings → Files and links",
    dailyNotesDir = "The folder specified in Settings → Daily notes",
    dailyNotesSubDir = "A subfolder under the folder in Settings → Daily notes",
    noteDir = "The same folder as its note",
    noteSubdir = "A subfolder under its note's folder",
    customDir = 'The folder specified below'
} */

/* export interface ImportSettings {
    attachDir: attachDirs;
    subDir: string;
}

export const DEFAULT_SETTINGS: ImportSettings = {
    attachDir: attachDirs.defaultDir,
    subDir: 'Attachments'
} */

class BinaryStringWriter extends Writer {
    // binaryString;

    constructor() {
        super();
        this.binaryString = "";
    }

    writeUint8Array(array/* : Uint8Array */) {
        for (let indexCharacter = 0; indexCharacter < array.length; indexCharacter++) {
            this.binaryString += String.fromCharCode(array[indexCharacter]);
        }
    }

    getData() {
        return this.binaryString;
    }
}

class BinaryStringReader extends Reader {
    // binaryString;
    // size;

    constructor(binaryString) {
        super();
        this.binaryString = binaryString;
    }

    init() {
        super.init();
        this.size = this.binaryString.length;
    }

    readUint8Array(offset/* : number */, length) {
        const result = new Uint8Array(length);
        for (let indexCharacter = 0; indexCharacter < length; indexCharacter++) {
            result[indexCharacter] = this.binaryString.charCodeAt(indexCharacter + offset) & 0xFF;
        }
        return result;
    }
}

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
        list1.createEl('span', {text: ' and head over to the ' }).createEl('strong', { text: 'Export' });
        list1.createEl('span', { text: ' tab.' });
        const list2 = instrList.createEl('li', {text: 'Under '})
        list2.createEl('strong', { text: 'File format' });
        list2.createEl('span', { text: ', select ' }).createEl('strong', { text: 'JSON (.json)' });
        list2.createEl('span', { text: '.' });
        const list3 = instrList.createEl('li')
        list3.createEl('strong', { text: 'Uncheck' });
        list3.createEl('span', { text: ' the option ' }).createEl('strong', { text: 'Create separate file for each entry' });
        list3.createEl('span', { text: '.' });
        const list4 = instrList.createEl('li')
        list4.createEl('strong', { text: 'Check' });
        list4.createEl('span', { text: ' the option ' }).createEl('strong', { text: 'Create separate files for attachments' });
        list4.createEl('span', { text: '.' });
        const list5 = instrList.createEl('li', { text: 'Select ' });
        list5.createEl('strong', { text: 'Export' });
        list5.createEl('span', { text: '.' });
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

        /* let folderPath = '';

        jsonFile.addEventListener('change', (event) => {
            const input = event.target as HTMLInputElement;
            const files = input.files;
            if (files !== null && files.length > 0) {
                const firstFilePath = files[0].path; // Assuming consistent path format
                // Extract the folder path from the first file path
                folderPath = firstFilePath.substring(0, firstFilePath.lastIndexOf('/'));
                // printToConsole(logLevel.log, `folderPath = ${folderPath}`);
            }
        }); */

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

        const errorTextEl = contentEl.createEl('div', { cls: 'setting-error'});
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
            new Notice(importText);
            
            
            /* const input = jsonFile as HTMLInputElement;
            const files = jsonFile.files;
            let fileFolder = '';
            if (files !== null && files.length > 0) {
                const firstFilePath = files[0].path; // Assuming consistent path format
                // Extract the folder path from the first file path
                fileFolder = firstFilePath.substring(0, firstFilePath.lastIndexOf('/'));
                printToConsole(logLevel.log, `folderPath = ${fileFolder}`);
            } */
            
            
            for (let i = 0; i < datafiles.length; i++) {
                // create a BlobReader to read with a ZipReader the zip from a Blob object
                const reader = new ZipReader(new BlobReader(datafiles[i]));

                // get all entries from the zip
                const entries = await reader.getEntries();

                // let allNotes: TFile[];
                // let noteIndex = 0;
                let { format, folder }: any = getDailyNoteSettings();
                if (format == '') format = DEFAULT_FORMAT;

                for (let entry of entries) {
                    //skip if is folder
                    if (entry.directory) continue;

                    //skip if isn't json
                    let isJson: boolean = entry.filename.endsWith(".json");
                    if (!isJson) continue;

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
                    
                    let objdataarray: Array<any> = JSON.parse(text);
                    for (const objdata of objdataarray) {
                        const noteMoment = moment(objdata.date, 'YYYY-MM-DD[T]HH:mm:ss.SSSSSS');
                        const noteFormat = noteMoment.format(format);

                        // create the correct folder first.
                        const newPath = folder + '/' + noteFormat + '.md';
                        const folderPath = newPath.slice(0, newPath.lastIndexOf('/'));
                        if (!this.app.vault.getFolderByPath(folderPath)) {
                            this.app.vault.createFolder(folderPath);
                        }

                        //create new file
                        if (this.app.vault.getFileByPath(newPath)) {
                            // add code here for if the file already exists
                        }
                        else {
                            await this.app.vault.create(newPath, formatContent(objdata), { ctime: Number.parseInt(noteMoment.format('x')) });
                        }

                    }
                    break; //REMOVE THIS IF YOU ALLOW IMPORT FOR MULTIPLE JSON FILES WITHIN THE ZIP FILE
                }

                // close the ZipReader
                // await reader.close();

                // const binaryReader = new ZipReader(new BlobReader(datafiles[i]));
                //deal with attachments
                for (let entry of entries) {
                    //skip if is folder
                    if (entry.directory) continue;

                    //skip if is json
                    let isJson: boolean = entry.filename.endsWith(".json");
                    if (isJson) continue;

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

                    const note = this.app.vault.getFileByPath(`${folder}/${fileMoment.format(format)}.md`);

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
                            const folderPath = filePath.slice(0, filePath.lastIndexOf('/'));
                            if (!this.app.vault.getFolderByPath(folderPath)) {
                                this.app.vault.createFolder(folderPath);
                            }

                            //create new file
                            if (this.app.vault.getFileByPath(filePath)) {
                                // add code here for if the file already exists
                            }
                            else {
                                // this is incorrect. it does not write the file correctly.
                                this.app.vault.createBinary(filePath, content, { ctime: Number.parseInt(fileMoment.format('x')) });
                            }
                            this.app.vault.process(note, (data) => {
                                data += `\n\n![[${filePath}]]`;
                                return data;
                            }, { ctime: Number.parseInt(fileMoment.format('x')) })
                            //attach to file
                        });
                    console.log('got here');
                }

                await reader.close();
                // console.log(`Processing input file ${datafiles[i].name}`);

            }


            const finishedText = 'Import finished!'
            setText(importTextEl, finishedText);
            new Notice(finishedText);

            
        }

    }


    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

function htmlToMarkdown (value:string ) {
    let newValue = value.replaceAll('</p><p>', '\n').replaceAll('<p>', '').replaceAll('</p>', '');
    newValue = newValue.replaceAll('<em>', '*').replaceAll('</em>', '*');
    newValue = newValue.replaceAll('<strong>', '**').replaceAll('</strong>', '**');
    newValue = newValue.replaceAll(/<a href="(?<link>.+)">(?<title>.+)<\/a>/g, `[$<title>]($<link>)`);
    newValue = newValue.replaceAll("<s>", "~~").replaceAll("</s>", "~~");

    const doc = new DOMParser().parseFromString(newValue, 'text/html');
    return doc.documentElement.textContent;

    return newValue;
}

function formatContent(array: any) {
    let frontmatter = '---';
    if (array.location) {
        frontmatter += `\nlocation: ${array.location}`;
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
        for (let i in array.tags) {
            frontmatter += `\n  - ${array.people[i]}`;
        }
    }
    if (array.people.length != 0) {
        frontmatter += `\npeople:`;
        for (let i in array.tags) {
            frontmatter += `\n  - ${array.people[i]}`;
        }
    }
    if (array.weather) {
        frontmatter += `\nweather: ${array.weather}`
    }
    if (array.sun && array.sun != '') {
        frontmatter += parseSun(array.date, array.sun);
    }
    if (array.lunar && array.lunar != '') {
        frontmatter += `\nlunar phase: ${array.lunar}`
    }
    frontmatter += '\n---';
    let body = '\n';
    if (array.heading != '') {
        body += `# ${htmlToMarkdown(array.heading)}\n`;
    }
    if (array.html && array.html != '') {
        body += htmlToMarkdown(array.html);
    }

    /* const doc = new DOMParser().parseFromString(input, 'text/html');
    return doc.documentElement.textContent; */
    
    return frontmatter + body;
}

function parseSun(date: string, sun: string) {

    const start = date.slice(0, 11);

    const parse = (time: string, meridiem: string) => {
        let hour = time.slice(0, time.indexOf(":"));
        const rest = time.slice(time.indexOf(":"));
        if (meridiem == "PM") {
            const hourNum = Number.parseInt(hour) + 12
            hour = hourNum.toString();
        }
        if (hour.length == 1) {
            hour = "0" + hour;
        }
        return `${start}${hour}${rest}:00`
    }

    let array = sun.split(' ');

    return "\nsunrise: " + parse(array[2], array[3])
        + "\nsunset: " + parse(array[5], array[6]);

}