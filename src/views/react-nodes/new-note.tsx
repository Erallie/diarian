import { StrictMode, useEffect, useState } from "react";
import { Root, createRoot } from "react-dom/client";
import { App, Modal, TFile, TFolder, normalizePath } from "obsidian";
import type Diarian from 'src/main';
import moment from 'moment';
import { writeNote, DupEntry, DupProps } from 'src/import-journal';
import { getDailyNoteSettings, getModifiedFolderAndFormat } from 'src/get-daily-notes';
import { printToConsole, logLevel } from "src/constants";

const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'kk:mm:ss';

/* interface TemplateChoicesProps {
    templates: any;
    app: App;
} */

export class NewDailyNote extends Modal {
    root: Root | null = null;
    plugin: Diarian;
    dateString: string;
    timeString: string;

    constructor(app: App, plugin: Diarian, date?: moment.Moment) {
        super(app);
        this.plugin = plugin;

        if (date) this.dateString = moment(date).format(DATE_FORMAT);
        else this.dateString = moment().format(DATE_FORMAT);

        this.timeString = moment().format(TIME_FORMAT);
    }

    onOpen() {
        this.root = createRoot(this.containerEl.children[1]);

        const modal = this;

        let dateString = this.dateString;
        let timeString = this.timeString;
        const plugin = this.plugin;
        const app = this.app;

        function setDate(event: React.ChangeEvent<HTMLInputElement>) {
            dateString = event.target.value;
            // printToConsole(logLevel.log, dateString);
        }

        function setTime(event: React.ChangeEvent<HTMLInputElement>) {
            timeString = event.target.value;
            // printToConsole(logLevel.log, timeString);
        }

        let templates: any = [];

        const { defaultTemplate, templateFolder } = getDailyNoteSettings();

        let templateValue = "none";

        const TemplateChoices = () => {
            // printToConsole(logLevel.log, defaultTemplate);
            let i = 0;

            function setTemplate(file: TFile) {
                templates[i] = {
                    id: i,
                    value: file.basename,
                    file: file
                }
                i++
            }

            function getTemplates(folder: TFolder) {
                for (let file of folder.children) {
                    if (file instanceof TFolder)
                        getTemplates(file);
                    else if (file instanceof TFile && !templates.find((data: any) => {
                        return file == data.file;
                    }))
                        setTemplate(file);
                }
            }

            let hasDefault;

            if (defaultTemplate) {
                // printToConsole(logLevel.log, defaultTemplate);
                const template = app.vault.getFileByPath(normalizePath(defaultTemplate + '.md'));
                if (template instanceof TFile) {
                    // printToConsole(logLevel.log, template.name);
                    setTemplate(template);
                    hasDefault = true;
                }
            }

            if (templateFolder) {
                const folder = app.vault.getFolderByPath(normalizePath(templateFolder));
                if (folder instanceof TFolder)
                    getTemplates(folder);
            }

            if (templates.length != 0) {
                if (hasDefault) {
                    templateValue = "0";
                    return (
                        <>
                            {templates.map((option: any) =>
                                <option key={option.id} value={option.id}>
                                    {option.value}
                                </option>)}
                            <option value="none">None</option>
                        </>
                    )
                }
                else return (
                    <>
                        <option value="none">None</option>
                        {templates.map((option: any) =>
                            <option key={option.id} value={option.id}>
                                {option.value}
                            </option>)}
                    </>
                )
            }
            else return (<>
                <option /* hidden={true} */ value="none">No templates found</option>
            </>
            )
        }
        // const [templateIndex, setTemplateIndex] = useState(0);

        function setTemplate(event: React.ChangeEvent<HTMLSelectElement>) {
            templateValue = event.target.value;
            // printToConsole(logLevel.log, templateValue);
        }


        async function createNote() {
            // printToConsole(logLevel.log, dateString + timeString);
            const noteDate = moment(dateString + timeString, DATE_FORMAT + TIME_FORMAT);

            const { format, folder } = getModifiedFolderAndFormat();

            let content = '';

            async function addTemplate(index: number) {
                await app.vault.cachedRead(templates[index].file).then((data) => {
                    const { dateFormat, timeFormat } = getDailyNoteSettings();
                    content = data.replaceAll("{{date}}", noteDate.format(dateFormat));
                    content = content.replaceAll('{{time}}', noteDate.format(timeFormat));

                    let dateMatch;
                    while ((dateMatch = /{{date:(((?!}}).)+)}}/g.exec(content)) !== null) {
                        content = content.replace(dateMatch[0], noteDate.format(dateMatch[1]));
                    }

                    let timeMatch;
                    while ((timeMatch = /{{time:(((?!}}).)+)}}/g.exec(content)) !== null) {
                        content = content.replace(timeMatch[0], noteDate.format(timeMatch[1]));
                    }
                })
            }

            switch (templateValue) {
                case "none":
                    content = "";
                    break;
                case "0":
                    await addTemplate(0)
                    break;
                default:
                    const index = Number.parseInt(templateValue);
                    if (!index) {
                        printToConsole(logLevel.error, 'Cannot create new note:\nThe templateIndex is not properly defined!')
                        return;
                    }
                    await addTemplate(index);
            }

            writeNote(noteDate, { frontmatter: '', frontmatterObj: {}, body: content }, format, folder, 'firstEntry' as DupEntry, 'firstEntry' as DupProps, true, plugin);
            modal.close();
        }


        this.root.render(
            <StrictMode>

                <div className="new-note-div">
                    <label htmlFor='date' className='new-note-label'>Date</label>
                    <input id='date' className='new-note-input' type="date" onChange={setDate} defaultValue={dateString} />
                </div>
                <div className="new-note-div">
                    <label htmlFor='time' className='new-note-label'>Time</label>
                    <input id='time' className='new-note-input' type="time" onChange={setTime} defaultValue={timeString} />
                </div>
                <div className="new-note-div">
                    <label htmlFor='template' className='new-note-label'>Template</label>
                    <select id='template' className="new-note-input dropdown" onChange={setTemplate}>
                        <TemplateChoices />
                    </select>
                </div>
                <button onClick={createNote} >Create note</button>
                {/* </div> */}

            </StrictMode >
        );


    }

    onClose() {
        this.root?.unmount();
    }
}

/* const TemplateChoices = ({ templates, app }: TemplateChoicesProps) => {
    let { defaultTemplate, templateFolder } = getDailyNoteSettings();
    // printToConsole(logLevel.log, defaultTemplate);
    let i = 0;

    function setTemplate(file: TFile) {
        templates[i] = {
            id: i,
            value: file.basename
        }
        i++
    }

    function getTemplates(folder: TFolder) {
        for (let file of folder.children) {
            if (file instanceof TFolder)
                getTemplates(file);
            else if (file instanceof TFile)
                setTemplate(file);
        }
    }

    const [hasDefault, setHasDefault] = useState(false);

    useEffect(() => {
        const createOptions = async () => {
            if (defaultTemplate) {
                // printToConsole(logLevel.log, defaultTemplate);
                const template = await app.vault.getAbstractFileByPath(normalizePath(defaultTemplate));
                if (template instanceof TFile) {
                    printToConsole(logLevel.log, template.name);
                    setTemplate(template);
                    setHasDefault(true);
                }
            }

            if (templateFolder) {
                const folder = app.vault.getFolderByPath(normalizePath(templateFolder));
                if (folder instanceof TFolder)
                    getTemplates(folder);
            }
        }
        createOptions();
    }, [hasDefault]);



    if (templates) {
        if (hasDefault)
            return (
                <>
                    {templates.map((option: any) =>
                        <option key={option.id} value={option.id}>
                            {option.value}
                        </option>)}
                </>
            )
        else return (
            <>
                <option value="none">None</option>
                {templates.map((option: any) =>
                    <option key={option.id} value={option.id}>
                        {option.value}
                    </option>)}
            </>
        )
    }
    else return (<>
        <option hidden={true} value="none">No templates found</option>
    </>
    )
} */