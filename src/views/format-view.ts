import { App, Modal, Setting, moment, normalizePath, setIcon, TFile, ProgressBarComponent } from 'obsidian';
import type Diarian from 'src/main';
import { printToConsole, logLevel } from 'src/constants';
import { getModifiedFolderAndFormat, getAllDailyNotes } from 'src/get-daily-notes';

export class ConvertView extends Modal {
    plugin: Diarian;

    constructor(app: App, plugin: Diarian) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('Convert date formats').setHeading();

        const infoDesc = new DocumentFragment();
        infoDesc.textContent = 'Begin the conversion process.'
        infoDesc.createEl('br')
        infoDesc.createEl('span', { text: 'View ' }).createEl('a', {
            text: 'converter notes',
            attr: {
                href: 'https://github.com/Erallie/diarian?tab=readme-ov-file#converter-notes'
            }
        })
        infoDesc.createEl('span', { text: '.' });
        /* infoDesc.createEl('span', { text: 'All notes that match will be renamed to the format specified under ' }).createEl('strong', { text: 'Settings → Daily notes → Date format' });
        infoDesc.createEl('span', { text: '.' }).createEl('br');
        infoDesc.createEl('span', { text: 'Only notes found under the folder specified in ' }).createEl('strong', { text: 'Settings → Daily notes → New file location' });
        infoDesc.createEl('span', { text: ' will be converted.' }); */

        // new Setting(contentEl).setDesc(infoDesc);


        const { folder, format } = getModifiedFolderAndFormat();

        let oldFolder = folder;


        const formatPreview = new DocumentFragment();
        formatPreview.textContent = 'A note with the path: ';
        const folderSample = formatPreview.createEl('span', { text: oldFolder, cls: 'text-accent' });
        const fromSample = formatPreview.createSpan({ cls: 'text-accent' })
        formatPreview.createEl('br');
        formatPreview.createEl('span', { text: 'Will be renamed to: ' })
            .createEl('span', { text: folder + moment().format(format), cls: 'text-accent' });

        // const toSample = formatPreview.createSpan({ cls: 'text-accent' });

        let oldFormat = format;

        new Setting(contentEl)
            .setName('Format to convert from')
            .setDesc('Enter the date format of the notes you\'d like to rename.')
            .addMomentFormat((from) => {
                from
                    .setDefaultFormat(format)
                    .setPlaceholder(format)
                    .setSampleEl(fromSample)
                    .onChange((value) => {
                        oldFormat = value;
                    })
            })

        const folderDesc = new DocumentFragment();
        folderDesc.textContent = 'Enter old folder path previously set under '
        folderDesc.createEl('strong', { text: 'Settings → Daily notes → New file location' })
        folderDesc.createEl('span', { text: '.' });

        new Setting(contentEl)
            .setName('Old daily note folder')
            .setDesc('Enter old folder path of the notes you\'d like to rename.')
            .addText((text) => {
                text
                    .setValue(normalizePath(oldFolder))
                    .setPlaceholder(normalizePath(oldFolder))
                    .onChange((value) => {

                        let newFolder = '';
                        if (value && normalizePath(value) == '/') newFolder = '';
                        else if (value && normalizePath(value) != '') newFolder = normalizePath(value) + '/';

                        oldFolder = newFolder;
                        folderSample.textContent = oldFolder;
                    })
            })

        new Setting(contentEl)//
            .setName('Preview conversion')
            .setDesc(formatPreview)

        const convertSetting = new Setting(contentEl)
            .setName('Start conversion')
            .setDesc(infoDesc)

        const convertButton = convertSetting.controlEl.createEl("button");
        setIcon(convertButton, 'refresh-ccw');

        const convertTextEl = contentEl.createDiv();
        convertTextEl.empty();

        function setText(msg: string, cls?: string) {
            convertTextEl.empty();
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
            convertTextEl.createSpan();
            new Setting(convertTextEl)
                .setName(text);
        }

        convertButton.onclick = async () => {
            const notes: TFile[] = getAllDailyNotes(oldFolder, oldFormat);
            const max = notes.length;
            // console.log(notes.length);
            const startText = 'Starting conversion...'
            setText(startText);
            printToConsole(logLevel.info, startText);
            const progressBar = new ProgressBarComponent(contentEl).setValue(0);

            let i = 0;


            for (let note of notes) {

                // console.log('got here');
                const ctime = moment(note.stat.ctime, 'x');
                const newPath = folder + ctime.format(format) + '.md';

                const folderIndex = newPath.lastIndexOf('/');
                if (folderIndex != -1) {
                    const folderPath = newPath.slice(0, folderIndex);
                    // printToConsole(logLevel.log, folderPath);
                    if (!this.app.vault.getFolderByPath(folderPath)) {
                        await this.app.vault.createFolder(folderPath);
                    }
                }
                // console.log(ctime.format(format));
                await this.app.fileManager.renameFile(note, folder + ctime.format(format) + '.md')
                // break;

                i++;
                progressBar.setValue(i / max * 100);
            }

            this.plugin.dailyNotes = getAllDailyNotes(folder, format);
            this.plugin.sortDailyNotes(folder, format);
            // printToConsole(logLevel.log, this.dailyNotes.length.toString());
            this.plugin.refreshViews(true, true);


            const endText = 'Conversion finished!'
            setText(endText);
            printToConsole(logLevel.info, endText);


        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}