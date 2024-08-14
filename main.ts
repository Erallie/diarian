import { App, Editor, MarkdownView, moment, View, Modal, Plugin, Setting, Platform, ButtonComponent, TFile, WorkspaceLeaf } from 'obsidian';
import { CalendarView } from './src/react-nodes/calendar-view';
import { OnThisDayView } from './src/react-nodes/on-this-day-view';
import { ImportView } from './src/import-journal';
import { ViewType, printToConsole, logLevel } from './src/constants';
import { DiariumSettings, DiariumSettingTab, DEFAULT_SETTINGS } from 'src/settings';
import { getAllDailyNotes, isDailyNote, getDate, isSameDay, getModifiedFolderAndFormat } from './src/get-daily-notes';
import { NewDailyNote } from './src/react-nodes/new-note';


// Remember to rename these classes and interfaces!
export type EnhancedApp = App & {
    commands: { executeCommandById: Function };
};


const enum LeafType {
    tab = 'tab',
    right = 'right'
}

export default class Diarium extends Plugin {
    settings: DiariumSettings;
    view: View;
    app: App;
    dailyNotes: TFile[];

    async onload() {
        await this.loadSettings();

        this.app.workspace.onLayoutReady(() => {
            this.dailyNotes = getAllDailyNotes();

            this.registerEvent(
                this.app.vault.on('rename', (file, oldPath) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                        this.dailyNotes[this.dailyNotes.length] = file;
                        this.refreshViews(true, true);
                    }
                }));

            this.registerEvent(
                this.app.vault.on('create', (file) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                    // printToConsole(logLevel.log, isDailyNote(file, folder, format).toString());
                        this.dailyNotes[this.dailyNotes.length] = file;
                        this.refreshViews(true, true);
                    }
                }));

            this.registerEvent(
                this.app.vault.on('delete', (file) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                        this.dailyNotes = this.dailyNotes.filter(thisFile => {
                            return (thisFile != file);
                        })
                        this.refreshViews(true, true);
                    }
                }));


            this.registerView(ViewType.calendarView, (leaf) => new CalendarView(leaf, this, this.view, this.app));
            this.registerView(ViewType.onThisDayView, (leaf) => new OnThisDayView(leaf, this, this.view, this.app));
        })

        // This creates an icon in the left ribbon.
        const ribbonIconEl = this.addRibbonIcon('lucide-book-heart', 'Select Diarium view', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            // this.openCalendar();
            new SelectView(this.app, this).open();
            // console.log(momentToRegex('dddd, MMMM Do, YYYY NNNN [at] h:mm A'));
        });
        // Perform additional things with the ribbon
        // ribbonIconEl.addClass('my-plugin-ribbon-class');

        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
        /* const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('Status Bar Text'); */

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'insert-timestamp',
            name: 'Insert timestamp',
            icon: 'lucide-alarm-clock',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                // this.insertTimestamp();
                let dateString = '';
                const now = moment();

                const { folder, format }: any = getModifiedFolderAndFormat();

                let noteDate;
                if (view.file) {
                    noteDate = getDate(view.file, folder, format);

                    if (!isSameDay(noteDate, now))
                        dateString = now.format(this.settings.dateStampFormat) + ' ';

                    let fullString = `— ${dateString}${now.format(this.settings.timeStampFormat)} —`;

                    const cursor = editor.getCursor();
                    const cursorLine = editor.getLine(cursor.line);
                    const textBeforeCursor = cursorLine.slice(0, cursor.ch);

                    let newCursorLine = cursor.line;

                    if (textBeforeCursor != '') {
                        fullString = '\n\n' + fullString + '\n';
                        newCursorLine += 3;
                    }
                    else if (cursor.line - 1 >= 0 && editor.getLine(cursor.line - 1) != '') { //text before cursor is empty but line before cursor is not
                        fullString = '\n' + fullString + '\n';
                        newCursorLine += 2;
                    }
                    else {
                        fullString += '\n';
                        newCursorLine += 1;
                    }

                    editor.replaceRange(
                        fullString,
                        editor.getCursor()
                    );
                    editor.setCursor(newCursorLine, 0);
                }

            }
        })
        this.addCommand({
            id: 'new-note',
            name: 'New daily note',
            icon: 'lucide-file-plus',
            callback: () => {
                new NewDailyNote(this.app, this).open();
            }
        })
        this.addCommand({
            id: 'refresh-notes',
            name: 'Refresh daily notes',
            icon: 'lucide-refresh-ccw',
            callback: () => {
                this.dailyNotes = getAllDailyNotes();
                // printToConsole(logLevel.log, this.dailyNotes.length.toString());
                this.refreshViews(true, true);
                printToConsole(logLevel.info, 'Daily notes refreshed!');
            }
        })
        this.addCommand({
            id: 'select-view',
            name: 'Select Diarium view',
            icon: 'lucide-book-heart',
            callback: () => {
                new SelectView(this.app, this).open();
            }
        })

        this.addCommand({
            id: 'open-calendar',
            name: 'Open calendar',
            icon: 'lucide-calendar-search',
            callback: () => {
                this.openLeaf(ViewType.calendarView, LeafType.tab);
            }
        });

        this.addCommand({
            id: 'open-on-this-day',
            name: 'Open on this day',
            icon: 'lucide-history',
            callback: () => {
                // this.openOnThisDay();
                // this.openCalendar();
                // new SampleModal(this.app).open();
                this.openLeaf(ViewType.onThisDayView, LeafType.right);
            }
        });

        this.addCommand({
            id: 'open-importer',
            name: 'Open importer',
            icon: 'lucide-import',
            callback: () => {
                // this.openCalendar();
                new ImportView(this.app, this).open();
            }
        });

        // This adds an editor command that can perform some operation on the current editor instance
        /* this.addCommand({
            id: 'sample-editor-command',
            name: 'Sample editor command',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                console.log(editor.getSelection());
                editor.replaceSelection('Sample Editor Command');
            }
        }); */
        // This adds a complex command that can check whether the current state of the app allows execution of the command
        /* this.addCommand({
            id: 'open-sample-modal-complex',
            name: 'Open sample modal (complex)',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.
                    if (!checking) {
                        new SampleModal(this.app).open();
                    }

                    // This command will only show up in Command Palette when the check function returns true
                    return true;
                }
            }
        }); */

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new DiariumSettingTab(this.app, this));

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, info) => {
                const enhancedApp = this.app as EnhancedApp;

                menu.addItem(item => {
                    item
                        .setTitle('Insert timestamp')
                        .setIcon('lucide-alarm-clock')
                        .onClick(() => {
                            enhancedApp.commands.executeCommandById(`${this.manifest.id}:insert-timestamp`);
                        })
                })
            })
        );

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        /* this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            console.log('click', evt);
        }); */

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));


    }

    onunload() {
        // this.app.unregister()
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    /* async openCalendar() {

        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null;
        const leaves = workspace.getLeavesOfType(ViewType.calendarView);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            leaf = workspace.getLeaf(!Platform.isMobile);
            await leaf?.setViewState({ type: ViewType.calendarView, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf!);
    } */

    async openOnThisDay() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null;
        const leaves = workspace.getLeavesOfType(ViewType.onThisDayView);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        } else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it
            leaf = workspace.getRightLeaf(false);
            await leaf?.setViewState({ type: ViewType.onThisDayView, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf!);
    }

    async openLeaf(viewType: ViewType, leafType: LeafType) {

        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null;
        const leaves = workspace.getLeavesOfType(viewType);

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            leaf = leaves[0];
        }
        else {
            // Our view could not be found in the workspace, create a new leaf
            // in the right sidebar for it

            switch (leafType) {
                case LeafType.tab:
                    leaf = workspace.getLeaf(false);
                    break;
                case LeafType.right:
                    leaf = workspace.getRightLeaf(false);
                    break;
                default:
                    printToConsole(logLevel.error, 'Cannot open leaf:\nleafType is not properly defined!');
                    return;
            }

            await leaf?.setViewState({ type: viewType, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf!);
    }

    insertTimestamp() {

    }

    /* refreshNotes() {
        this.dailyNotes = getAllDailyNotes();
        // printToConsole(logLevel.log, this.dailyNotes.length.toString());
        this.refreshViews(true, true);
        printToConsole(logLevel.info, 'Daily notes refreshed!');
    } */

    refreshViews(refCalView: boolean, refRevView: boolean) {
        if (refCalView) {
            const calView = this.app.workspace.getLeavesOfType(ViewType.calendarView);
            for (let leaf of calView) {
                let view = leaf.view;
                if (view instanceof CalendarView) {
                    view.refresh(this);
                }
            }
        }

        if (refRevView) {
            const revView = this.app.workspace.getLeavesOfType(ViewType.onThisDayView);
            for (let leaf of revView) {
                let view = leaf.view;
                if (view instanceof OnThisDayView) {
                    view.refresh(this);
                }
            }
        }
    }
}

class SelectView extends Modal {
    plugin: Diarium;

    constructor(app: App, plugin: Diarium) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('Select Diarium view').setHeading()

        const enhancedApp = this.app as EnhancedApp;
        // contentEl.setText('Open view');

        // contentEl.createEl('br');

        /* const openCalendarButton = new DocumentFragment();
        openCalendarButton.createEl('img', {
            text: "Open calendar",
            attr: {
                src: "Attachments/icons/lucide-calendar-search.svg"
            },
        });
        // openCalendarButton.createEl('span', { text: ' Open calendar' }); */
        // const buttonContainer = contentEl.createEl('div');

        /* <svg xmlns="http://www.w3.org/2000/svg" width = "24" height = "24" viewBox = "0 0 24 24" fill = "none" stroke = "currentColor" stroke - width="2" stroke - linecap="round" stroke - linejoin="round" class="lucide lucide-file-plus" > <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /> <path d="M14 2v4a2 2 0 0 0 2 2h4" /> <path d="M9 15h6" /> <path d="M12 18v-6" /> </svg> */
        /* const newNoteText = new DocumentFragment();
        newNoteText.createSvg('svg', {
            attr: {
                xmlns: 'http://www.w3.org/2000/svg',
                width: 18,
                height: 18,
                viewBox: '0 0 24 24',
                fill: 'none',
                stroke: 'currentColor',
                strokeWidth: 1.5,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                class: 'lucide lucide-file-plus'
            }
        })
            .createSvg('path', 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z')
            .createSvg('path', 'M14 2v4a2 2 0 0 0 2 2h4')
            .createSvg('path', 'M9 15h6')
            .createSvg('path', 'M12 18v-6');
        newNoteText.createEl('span', { text: 'New daily note' });


        contentEl.createEl('button', {
            text: newNoteText,
            cls: 'select-view-button'
        }) */

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-file-plus')
            .setButtonText('New daily note')
            // .setTooltip('New daily note')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:new-note`);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-calendar-search')
            .setButtonText('Open calendar')
            // .setTooltip('Open calendar')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:open-calendar`);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-history')
            .setButtonText('Open on this day')
            // .setTooltip('Open on this day')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:open-on-this-day`);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-import')
            .setButtonText('Open importer')
            // .setTooltip('Open importer')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:open-importer`);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-refresh-ccw')
            .setButtonText('Refresh daily notes')
            .setTooltip('Search the entire vault for daily notes.\nUse this feature sparingly!')
            .setWarning()
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:refresh-notes`);
                this.close();
            })

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
