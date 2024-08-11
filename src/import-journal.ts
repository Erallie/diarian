import { App, Modal, Setting, Notice, Vault } from 'obsidian';
import Diarium from 'main';
import { logLevel, printToConsole, DEFAULT_FORMAT } from './constants';
import moment from 'moment';
import { getDailyNoteSettings } from './get-daily-notes';

export class ImportView extends Modal {
    plugin: Diarium;

    constructor(app: App, plugin: Diarium) {
        super(app);
        this.plugin = plugin;
    }


    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('Import journal').setHeading();

        contentEl.createEl('br');

        const instrDiv = contentEl.createDiv({ cls: 'instructions' });

        const instrDesc = new DocumentFragment();
        const instrList = instrDesc.createEl('ol', { cls: 'instructions' });
        instrList.createEl('li', { text: 'Export your Diarium journal as a JSON (.json) file' });
        const step1List = instrList.createEl('ol', { cls: 'instructions' });
        const list1 = step1List.createEl('li')
        list1.createEl('strong', { text: 'Uncheck' });
        list1.createEl('span', { text: ' the option \'Create separate file for each entry\'.' });
        const list2 = step1List.createEl('li')
        list2.createEl('strong', { text: 'Check' });
        list2.createEl('span', { text: ' the option \'Create separate files for attachments\'.' });
        const list3 = step1List.createEl('li', { text: 'Select ' });
        list3.createEl('strong', { text: 'Export' });
        list3.createEl('span', { text: '.' });
        instrList.createEl('li', { text: 'Decompress the exported zip file.' }); //Change this wording!


        new Setting(instrDiv).setName('Instructions').setDesc(instrDesc).setHeading();
        

        /* const openCalendarButton = new DocumentFragment();
        openCalendarButton.createEl('img', {
            text: "Open calendar",
            attr: {
                src: "Attachments/icons/lucide-calendar-search.svg"
            },
        });
        openCalendarButton.createEl('span', { text: ' Open calendar' }); */

        const jsonFileSetting = new Setting(this.contentEl).setName("Choose json file").setDesc("Select the exported .json file containing your Diarium journal");
        const jsonFile = jsonFileSetting.controlEl.createEl("input", {
            attr: {
                type: "file",
                multiple: false,
                accept: ".json"
            }
        });

        const attachFolderSetting = new Setting(this.contentEl).setName("Choose media folder").setDesc("Select the root folder labelled \'media\' containing your attachments.");
        const attachFolder = attachFolderSetting.controlEl.createEl("input", {
            attr: {
                type: "folder",
                multiple: false
            }
        });

        const importSetting = new Setting(this.contentEl).setName("Import").setDesc("Begin the importing process.");
        const importButton = importSetting.controlEl.createEl("button");
        importButton.textContent = "Import";

        const errorTextEl = contentEl.createEl('div', { cls: 'setting-error'});
        errorTextEl.empty();

        function setText(text: any, msg: string) {
            text.empty();
            text.createEl('span', { text: msg });
        }

        const importTextEl = contentEl.createEl('div');
        importTextEl.empty();

        importButton.onclick = async () => {
            const { files: datafiles } = jsonFile;
            if (datafiles === null || !datafiles.length) {
                const errorText = 'No json file has been selected.';
                printToConsole(logLevel.error, errorText);
                setText(errorTextEl, errorText);
                return;
            }
            const importText = 'Starting import...'
            setText(importTextEl, importText);
            new Notice(importText);
            
            for (let i = 0; i < datafiles.length; i++) {
                // console.log(`Processing input file ${datafiles[i].name}`);
                const srctext = await datafiles[i].text();
                // let is_json: boolean = datafiles[i].name.endsWith(".json");
                let objdataarray: Array<any> = JSON.parse(srctext);
                let { format, folder }: any = getDailyNoteSettings();
                for (const objdata of objdataarray) {
                    // printToConsole(logLevel.log, objdata.date);
                    // await callHandler.call(this, objdata, datafiles[i]);
                    if (format == '') {
                        /* const errorText = 'No date format is set in the Daily notes core plugin.';
                        printToConsole(logLevel.error, errorText);
                        setErrorText(errorText); */
                        format = DEFAULT_FORMAT;
                    }
                    const noteMoment = moment(objdata.date, 'YYYY-MM-DD[T]HH:mm:ss.SSSSSS');
                    const noteFormat = noteMoment.format(format);
                    // create the correct folder first.
                    const newPath = folder + '/' + noteFormat + '.md';
                    const folderPath = newPath.slice(0, newPath.lastIndexOf('/'));
                    if (this.app.vault.getFolderByPath(folderPath) === null) {
                        this.app.vault.createFolder(folderPath);
                    }
                    this.app.vault.create(newPath, formatContent(objdata), { ctime: Number.parseInt(noteMoment.format('x')) });
                    // printToConsole(logLevel.log, noteFormat);

                }

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