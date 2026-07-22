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

export enum TrackerProps {
    firstColon = 'Split at the first colon',
    lastColon = "Split at the last colon",
};

const trackerPropsMap: { [key: string]: TrackerProps } = {
    firstColon: TrackerProps.firstColon,
    lastColon: TrackerProps.lastColon,
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
        if (!(Platform.isMacOS && Platform.isDesktop)) {
            const list2 = instrList.createEl('li', { text: 'Under ' });
            list2.createEl('strong', { text: 'File format' });
            list2.appendText(', select ');
            list2.createEl('strong', { text: 'JSON (.json)' });
            list2.appendText('.');
        }
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
                accept: ".zip, .json, .docx"
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

        // #region Tracker Data

        const trackerDesc = new DocumentFragment;
        trackerDesc.textContent = "Tracker data is exported to json as \"";
        trackerDesc.createEl("strong", { text: "{key}: {value}" });
        trackerDesc.appendText("\". This text is split at the colon (:) to determine which part is the key and which part is the value.");
        trackerDesc.createEl('br');
        trackerDesc.createEl("br");
        trackerDesc.appendText("If you have colons (:) in the names or values of any of your trackers, you can decide whether to split the text at the ");
        trackerDesc.createEl("strong", { text: "first colon" });
        trackerDesc.appendText(" or the ");
        trackerDesc.createEl("strong", { text: "last colon" });
        trackerDesc.appendText(".");

        let trackerValue = "firstColon" as TrackerProps;


        new Setting(this.contentEl)
            .setName("Where to separate tracker keys/values")
            .setDesc(trackerDesc)
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(TrackerProps)
                    .setValue(trackerValue)
                    .onChange((value) => {
                        trackerValue = value as TrackerProps;
                    }));
        // #endregion

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
                        await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry, dupProps, trackerValue);
                    }
                    else {
                        // printToConsole(logLevel.log, 'Contains all entries');
                        const dataArray: Array<any> = data;
                        progressMax = datafiles.length + dataArray.length - 1;
                        for (const data of dataArray) {
                            index++;
                            progressBar.setValue(index / progressMax * 100);
                            await createEntry(data, format, folder, mapViewProperty, this.plugin, dupEntry, dupProps, trackerValue);
                        }
                    }
                    continue;
                }

                if (datafiles[i].name.toLowerCase().endsWith('.docx')) {
                const docxEntries = await readDiariumDocx(datafiles[i]);

                progressMax = docxEntries.length;

                for (const data of docxEntries) {
                    index++;
                    progressBar.setValue(index / progressMax * 100);

                    await createEntry(
                        data,
                        format,
                        folder,
                        mapViewProperty,
                        this.plugin,
                        dupEntry,
                        dupProps,
                        trackerValue
                    );
                }

                continue;
            }

                // create a BlobReader to read with a ZipReader the zip from a Blob object
                const reader = new ZipReader(new BlobReader(datafiles[i]));

                // get all entries from the zip
                const entries = await reader.getEntries();
                progressMax = entries.length;


                for (const entry of entries) {
                    progressBar.setValue(index / progressMax * 100);

                    // Skip folders.
                    if (entry.directory) {
                        continue;
                    }

                    // Media files are handled by the attachment loop below.
                    if (entry.filename.startsWith('media/')) {
                        continue;
                    }

                    if (!entry.getData) {
                        printToConsole(
                            logLevel.warn,
                            `Cannot get data from ${entry.filename}:\nentry.getData() is undefined.`
                        );

                        continue;
                    }

                    const lowerFilename = entry.filename.toLowerCase();

                    if (lowerFilename.endsWith('.json')) {
                        const text = await entry.getData(
                            new TextWriter()
                        );

                        const parsedData = JSON.parse(text);

                        const dataArray: Array<any> = Array.isArray(parsedData)
                            ? parsedData
                            : [parsedData];

                        for (const data of dataArray) {
                            if (!data?.date) {
                                printToConsole(
                                    logLevel.warn,
                                    `Cannot import ${entry.filename}:\nThe entry does not contain a date.`
                                );

                                continue;
                            }

                            index++;
                            progressBar.setValue(index / progressMax * 100);

                            await createEntry(
                                data,
                                format,
                                folder,
                                mapViewProperty,
                                this.plugin,
                                dupEntry,
                                dupProps,
                                trackerValue
                            );
                        }

                        continue;
                    }

                    if (lowerFilename.endsWith('.docx')) {
                        const docxBlob = await entry.getData(
                            new BlobWriter(
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                            )
                        );

                        const docxEntries = await readDiariumDocx(
                            docxBlob
                        );

                        if (docxEntries.length === 0) {
                            printToConsole(
                                logLevel.warn,
                                `Cannot import ${entry.filename}:\nNo Diarium entries were found in the DOCX file.`
                            );

                            continue;
                        }

                        for (const data of docxEntries) {
                            index++;
                            progressBar.setValue(index / progressMax * 100);

                            await createEntry(
                                data,
                                format,
                                folder,
                                mapViewProperty,
                                this.plugin,
                                dupEntry,
                                dupProps,
                                trackerValue
                            );
                        }

                        continue;
                    }
                }


                for (let entry of entries) {
                    index++;
                    progressBar.setValue(index / progressMax * 100);

                    //skip if is folder
                    if (entry.directory) continue;

                    //skip if isn't attachment
                    let notAttachment: boolean = !(entry.filename.startsWith('media/'));
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

interface DocxParagraph {
    style: string;
    text: string;
}

interface DiariumDocxEntry {
    date: string;
    html: string;
    tags?: string[];
    people?: string[];
    weather?: string;
    sun?: string;
    lunar?: string;
    location?: string;
    rating?: number;
}

async function readDiariumDocx(file: Blob): Promise<DiariumDocxEntry[]> {
    const reader = new ZipReader(new BlobReader(file));

    try {
        const entries = await reader.getEntries();

        const documentEntry = entries.find(
            (entry) => entry.filename === 'word/document.xml'
        );

        if (!documentEntry?.getData) {
            throw new Error(
                'The DOCX file does not contain word/document.xml.'
            );
        }

        const documentXml = await documentEntry.getData(
            new TextWriter()
        );

        return parseDiariumDocx(documentXml);
    }
    finally {
        await reader.close();
    }
}

function parseDiariumDocx(
    documentXml: string
): DiariumDocxEntry[] {
    const parser = new DOMParser();
    const xml = parser.parseFromString(
        documentXml,
        'application/xml'
    );

    const parserError = xml.querySelector('parsererror');

    if (parserError) {
        throw new Error(
            `Could not parse the DOCX document XML: ${parserError.textContent}`
        );
    }

    const paragraphs = getDocxParagraphs(xml);
    const importedEntries: DiariumDocxEntry[] = [];

    let currentParagraphs: DocxParagraph[] = [];

    for (const paragraph of paragraphs) {
        if (paragraph.style === 'Date') {
            if (currentParagraphs.length > 0) {
                const entry = createEntryFromDocxParagraphs(
                    currentParagraphs
                );

                if (entry) {
                    importedEntries.push(entry);
                }
            }

            currentParagraphs = [paragraph];
        }
        else if (currentParagraphs.length > 0) {
            currentParagraphs.push(paragraph);
        }
    }

    if (currentParagraphs.length > 0) {
        const entry = createEntryFromDocxParagraphs(
            currentParagraphs
        );

        if (entry) {
            importedEntries.push(entry);
        }
    }

    return importedEntries;
}

function getDocxParagraphs(
    document: Document
): DocxParagraph[] {
    const wordNamespace =
        'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

    const paragraphElements = Array.from(
        document.getElementsByTagNameNS(
            wordNamespace,
            'p'
        )
    );

    return paragraphElements.map((paragraphElement) => {
        const styleElement = paragraphElement
            .getElementsByTagNameNS(
                wordNamespace,
                'pStyle'
            )[0];

        const style = styleElement?.getAttributeNS(
            wordNamespace,
            'val'
        ) ?? '';

        const text = readDocxParagraphText(
            paragraphElement,
            wordNamespace
        );

        return {
            style,
            text
        };
    });
}

function readDocxParagraphText(
    paragraph: Element,
    wordNamespace: string
): string {
    let text = '';

    const walkNode = (node: Node): void => {
        if (
            node.nodeType === Node.ELEMENT_NODE
            && (node as Element).namespaceURI === wordNamespace
        ) {
            const localName = (node as Element).localName;

            if (localName === 't') {
                text += node.textContent ?? '';
                return;
            }

            if (localName === 'br') {
                text += '\n';
                return;
            }

            if (localName === 'tab') {
                text += '\t';
                return;
            }
        }

        for (const child of Array.from(node.childNodes)) {
            walkNode(child);
        }
    };

    walkNode(paragraph);

    return text;
}

function createEntryFromDocxParagraphs(
    paragraphs: DocxParagraph[]
): DiariumDocxEntry | null {
    const dateParagraph = paragraphs.find(
        (paragraph) => paragraph.style === 'Date'
    );

    if (!dateParagraph) {
        return null;
    }

    const date = parseDocxDate(dateParagraph.text);

    if (!date) {
        printToConsole(
            logLevel.warn,
            `Cannot import DOCX entry:\nCould not parse date "${dateParagraph.text}".`
        );

        return null;
    }

    const contentParagraphs = paragraphs.filter(
        (paragraph) =>
            paragraph.style !== 'Date'
            && paragraph.style !== 'TagsLocation'
    );

    const metadataParagraph = paragraphs.find(
        (paragraph) =>
            paragraph.style === 'TagsLocation'
    );

    const data: DiariumDocxEntry = {
        date,
        html: createDocxEntryHtml(contentParagraphs)
    };

    if (metadataParagraph) {
        applyDocxMetadata(
            data,
            metadataParagraph.text
        );
    }

    return data;
}

function parseDocxDate(dateText: string): string | null {
    const normalizedDate = dateText
        .replace(/[\u00A0\u202F]/g, ' ')
        .trim();

    const parsedDate = moment(
        normalizedDate,
        'dddd, MMMM D, YYYY h:mm A',
        true
    );

    if (!parsedDate.isValid()) {
        return null;
    }

    return parsedDate.format(
        'YYYY-MM-DD[T]HH:mm:ss.SSSSSS'
    );
}

function createDocxEntryHtml(
    paragraphs: DocxParagraph[]
): string {
    const html: string[] = [];
    let listItems: string[] = [];

    const finishList = (): void => {
        if (listItems.length === 0) {
            return;
        }

        html.push(
            `<ul>${listItems
                .map((item) => `<li>${item}</li>`)
                .join('')}</ul>`
        );

        listItems = [];
    };

    for (const paragraph of paragraphs) {
        const escapedText = escapeHtml(
            paragraph.text
        );

        if (paragraph.style === 'List') {
            listItems.push(escapedText);
            continue;
        }

        finishList();

        if (paragraph.text.trim() === '') {
            html.push('<p><br></p>');
        }
        else {
            html.push(`<p>${escapedText}</p>`);
        }
    }

    finishList();

    return html.join('');
}

function applyDocxMetadata(
    data: DiariumDocxEntry,
    metadataText: string
): void {
    const metadataLines = metadataText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    for (const line of metadataLines) {
        if (line.startsWith('Tags:')) {
            data.tags = parseDocxListValue(
                line.slice('Tags:'.length)
            );
        }
        else if (line.startsWith('People:')) {
            data.people = parseDocxListValue(
                line.slice('People:'.length)
            );
        }
        else if (line.startsWith('Weather:')) {
            data.weather = line
                .slice('Weather:'.length)
                .trim();
        }
        else if (line.startsWith('☀️ Sunrise:')) {
            data.sun = line;
        }
        else if (line.startsWith('Lunar phase:')) {
            data.lunar = line
                .slice('Lunar phase:'.length)
                .trim();
        }
        else if (line.startsWith('Location:')) {
            data.location = line
                .slice('Location:'.length)
                .trim();
        }
        else if (line.startsWith('Rating:')) {
            const ratingText = line
                .slice('Rating:'.length)
                .trim();

            data.rating = (
                ratingText.match(/★/g) ?? []
            ).length;
        }
    }
}

function parseDocxListValue(
    value: string
): string[] {
    return value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
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



async function createEntry(data: any, format: string, folder: string, mapViewProperty: string, plugin: Diarian, dupEntry: DupEntry, dupProps: DupProps, trackerValue: TrackerProps) {
    const noteMoment = moment(data.date, 'YYYY-MM-DD[T]HH:mm:ss.SSSSSS');
    await writeNote(noteMoment, formatContent(data, noteMoment, mapViewProperty, plugin, trackerValue), format, folder, dupEntry, dupProps);
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
function formatContent(array: any, moment: moment.Moment, mapViewProperty: string, plugin: Diarian, trackerValue: TrackerProps) {

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

            const trackerValueMapped = trackerPropsMap[trackerValue as TrackerProps];
            switch (trackerValueMapped) {
                case TrackerProps.firstColon:
                    const keyFirst = markdownString.slice(0, markdownString.indexOf(': '));
                    const valueFirst = markdownString.slice(markdownString.indexOf(': ') + 2);
                    frontmatter += `\n"${keyFirst}": "${valueFirst}"`;
                    break;
                case TrackerProps.lastColon:
                    const keyLast = markdownString.slice(0, markdownString.lastIndexOf(': '));
                    const valueLast = markdownString.slice(markdownString.lastIndexOf(': ') + 2);
                    frontmatter += `\n"${keyLast}": "${valueLast}"`;
                    break;

            }
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