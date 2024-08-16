import { App, Editor, MarkdownView, moment, View, Modal, Plugin, Setting, Platform, ButtonComponent, TFile, WorkspaceLeaf } from 'obsidian';
import { CalendarView } from './src/react-nodes/calendar-view';
import { OnThisDayView } from './src/react-nodes/on-this-day-view';
import { ImportView } from './src/import-journal';
import { ViewType, printToConsole, logLevel } from './src/constants';
import { DiariumSettings, DiariumSettingTab, DEFAULT_SETTINGS, LeafType, leafTypeMap } from 'src/settings';
import { getAllDailyNotes, isDailyNote, getMoment, isSameDay, getModifiedFolderAndFormat } from './src/get-daily-notes';
import { NewDailyNote } from './src/react-nodes/new-note';


export type EnhancedApp = App & {
    commands: { executeCommandById: Function };
};


export default class Diarium extends Plugin {
    settings: DiariumSettings;
    view: View;
    app: App;
    dailyNotes: TFile[];

    async onload() {
        await this.loadSettings();

        this.app.workspace.onLayoutReady(() => {
            this.dailyNotes = getAllDailyNotes();

            const { folder, format }: any = getModifiedFolderAndFormat();
            this.sortDailyNotes(folder, format);


            this.registerEvent(
                this.app.vault.on('rename', (file, oldPath) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                        this.dailyNotes[this.dailyNotes.length] = file;
                        this.sortDailyNotes(folder, format);
                        this.refreshViews(true, true);
                    }
                }));

            this.registerEvent(
                this.app.vault.on('create', (file) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                        // printToConsole(logLevel.log, isDailyNote(file, folder, format).toString());
                        this.dailyNotes[this.dailyNotes.length] = file;
                        this.sortDailyNotes(folder, format);
                        this.refreshViews(true, true);
                    }
                }));

            this.registerEvent(
                this.app.vault.on('delete', (file) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                        this.dailyNotes = this.dailyNotes.filter(thisFile => {
                            return (thisFile != file);
                        });
                        this.refreshViews(true, true);
                    }
                }));


            this.registerView(ViewType.calendarView, (leaf) => new CalendarView(leaf, this, this.view, this.app));
            this.registerView(ViewType.onThisDayView, (leaf) => new OnThisDayView(leaf, this, this.view, this.app));

            const enhancedApp = this.app as EnhancedApp;

            if (this.settings.calStartup)
                enhancedApp.commands.executeCommandById(`${this.manifest.id}:open-calendar`);

            if (this.settings.onThisDayStartup)
                enhancedApp.commands.executeCommandById(`${this.manifest.id}:open-on-this-day`);
        });

        // This creates an icon in the left ribbon.
        const ribbonIconEl = this.addRibbonIcon('lucide-book-heart', 'Select Diarium view', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            // this.openCalendar();
            const enhancedApp = this.app as EnhancedApp;
            enhancedApp.commands.executeCommandById(`${this.manifest.id}:select-view`);
            // console.log(momentToRegex('dddd, MMMM Do, YYYY NNNN [at] h:mm A'));
        });
        // Perform additional things with the ribbon
        // ribbonIconEl.addClass('my-plugin-ribbon-class');

        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
        /* const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('Status Bar Text'); */

        //#region Commands
        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'insert-timestamp',
            name: 'Insert timestamp',
            icon: 'lucide-alarm-clock',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                if (view.file) {
                    let dateString = '';
                    const now = moment();

                    const { folder, format }: any = getModifiedFolderAndFormat();
                    const noteDate = getMoment(view.file, folder, format);

                    if (!isSameDay(noteDate, now))
                        dateString = now.format(this.settings.dateStampFormat) + ' ';

                    let fullString = `— ${dateString}${now.format(this.settings.timeStampFormat)} —`;

                    const cursor = editor.getCursor();
                    // if (editor.getLine(cursor.line) == '' && editor.getLine(cursor.line + 1) == '' && editor.getLine(cursor.line + 2) == '')
                    const cursorLine = editor.getLine(cursor.line);
                    const textBeforeCursor = cursorLine.slice(0, cursor.ch);

                    let newCursorLine = cursor.line;

                    if (textBeforeCursor != '') {
                        fullString = '\n\n' + fullString/*  + '\n\n' */;
                        // newCursorLine += 4;
                        newCursorLine += 2;
                    }
                    //if text before cursor is empty but line before cursor is not
                    else if (cursor.line - 1 >= 0 && editor.getLine(cursor.line - 1) != '') {
                        fullString = '\n' + fullString /* + '\n\n' */;
                        // newCursorLine += 3;
                        newCursorLine += 1;
                    }
                    /* else {
                        fullString += '\n\n';
                        newCursorLine += 2;
                    } */


                    //if text after cursor is empty
                    const textAfterCursor = cursorLine.slice(cursor.ch);
                    if (textAfterCursor != '' || cursor.line == editor.lastLine() /* || cursor.line + 1 == editor.lastLine() */) {
                        fullString += '\n\n';
                        newCursorLine += 2;
                    }
                    //if the next line is not empty
                    else if (cursor.line + 1 <= editor.lastLine() && editor.getLine(cursor.line + 1) != '') {
                        fullString += '\n';
                        newCursorLine += 2;
                    }
                    // if the next line is empty but the following line is not
                    else if (cursor.line + 2 <= editor.lastLine() && editor.getLine(cursor.line + 1) == '') {
                        newCursorLine += 2;
                    }



                    editor.replaceRange(
                        fullString,
                        editor.getCursor()
                    );
                    editor.setCursor(newCursorLine, 0);
                }

            }
        });

        this.addCommand({
            id: 'show-in-calendar',
            name: 'Show daily note in calendar',
            icon: 'lucide-calendar-search',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.

                    const { folder, format }: any = getModifiedFolderAndFormat();

                    if (markdownView.file && isDailyNote(markdownView.file, folder, format)) {
                        // printToConsole(logLevel.log, 'can open view');
                        if (checking) return true;
                        const { folder, format }: any = getModifiedFolderAndFormat();
                        const noteMoment = getMoment(markdownView.file, folder, format);
                        this.refreshViews(true, false, noteMoment);
                        this.openLeaf(ViewType.calendarView, LeafType.tab);
                    }
                    else if (checking) return false;
                    // This command will only show up in Command Palette when the check function returns true
                }
            }
        });

        this.addCommand({
            id: 'next-note',
            name: 'Go to next daily note',
            icon: 'lucide-chevrons-right',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
        // If checking is true, we're simply "checking" if the command can be run.
        // If checking is false, then we want to actually perform the operation.

                    const { folder, format }: any = getModifiedFolderAndFormat();

                    if (markdownView.file && isDailyNote(markdownView.file, folder, format)) {
                        // printToConsole(logLevel.log, 'can open view');
                        const index = this.dailyNotes.findIndex((note) => {
                            return (note == markdownView.file as TFile);
                        });
                        if (checking && index != this.dailyNotes.length - 1) return true;
                        else if (checking) return false;
                        void this.app.workspace.getLeaf(false).openFile(this.dailyNotes[index + 1]);
                    }
                    else if (checking) return false;
                    // This command will only show up in Command Palette when the check function returns true
                }
            }
        });


        this.addCommand({
            id: 'previous-note',
            name: 'Go to previous daily note',
            icon: 'lucide-chevrons-left',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.

                    const { folder, format }: any = getModifiedFolderAndFormat();

                    if (markdownView.file && isDailyNote(markdownView.file, folder, format)) {
                        // printToConsole(logLevel.log, 'can open view');
                        const index = this.dailyNotes.findIndex((note) => {
                            return (note == markdownView.file as TFile);
                        });

                        if (checking && index != 0) return true;
                        else if (checking) return false;
                        void this.app.workspace.getLeaf(false).openFile(this.dailyNotes[index - 1]);
                    }
                    else if (checking) return false;
        // This command will only show up in Command Palette when the check function returns true
                }
            }
        });

        this.addCommand({
            id: 'new-note',
            name: 'New daily note',
            icon: 'lucide-file-plus',
            callback: () => {
                new NewDailyNote(this.app, this).open();
            }
        });

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
        });

        this.addCommand({
            id: 'select-view',
            name: 'Select Diarium view',
            icon: 'lucide-book-heart',
            callback: () => {
                new SelectView(this.app, this).open();
            }
        });

        this.addCommand({
            id: 'open-calendar',
            name: 'Open calendar',
            icon: 'lucide-calendar',
            callback: () => {
                this.openLeaf(ViewType.calendarView, this.settings.calLocation);
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
        //#endregion

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new DiariumSettingTab(this.app, this));

        this.registerEvent(
            this.app.workspace.on("editor-menu", (menu, editor, info) => {
                const enhancedApp = this.app as EnhancedApp;

                menu.addSeparator();

                menu.addItem(item => {
                    item
                        .setTitle('Insert timestamp')
                        .setIcon('lucide-alarm-clock')
                        .onClick(() => {
                            enhancedApp.commands.executeCommandById(`${this.manifest.id}:insert-timestamp`);
                        })
                });

                if (this.checkCallback('show-in-calendar'))
                    menu.addItem(item => {
                        item
                            .setTitle('Show daily note in calendar')
                            .setIcon('lucide-calendar-search')
                            .onClick(() => {
                                enhancedApp.commands.executeCommandById(`${this.manifest.id}:show-in-calendar`);
                            })
                    });

                if (this.checkCallback('next-note'))
                    menu.addItem(item => {
                        item
                            .setTitle('Go to next daily note')
                            .setIcon('lucide-chevrons-right')
                            .onClick(() => {
                                enhancedApp.commands.executeCommandById(`${this.manifest.id}:next-note`);
                            })
                    });


                if (this.checkCallback('previous-note'))
                    menu.addItem(item => {
                        item
                            .setTitle('Go to previous daily note')
                            .setIcon('lucide-chevrons-left')
                            .onClick(() => {
                                enhancedApp.commands.executeCommandById(`${this.manifest.id}:previous-note`);
                            })
                    });
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

            const mappedLeafType = leafTypeMap[leafType as LeafType];
            switch (mappedLeafType) {
                case LeafType.tab:
                    leaf = workspace.getLeaf(false);
                    break;
                case LeafType.right:
                    leaf = workspace.getRightLeaf(false);
                    break;
                case LeafType.left:
                    leaf = workspace.getLeftLeaf(false);
                    break;
                default:
                    printToConsole(logLevel.error, `Cannot open leaf:\nleafType '${mappedLeafType}' is not a valid LeafType!`);
                    return;
            }

            await leaf?.setViewState({ type: viewType, active: true });
        }

        // "Reveal" the leaf in case it is in a collapsed sidebar
        workspace.revealLeaf(leaf!);
    }

    checkCallback(commandID: string) {
        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
            // If checking is true, we're simply "checking" if the command can be run.
            // If checking is false, then we want to actually perform the operation.

            const { folder, format }: any = getModifiedFolderAndFormat();

            if (markdownView.file && isDailyNote(markdownView.file, folder, format)) {
                // printToConsole(logLevel.log, 'can open view');
                if (commandID == 'show-in-calendar') return true;

                const index = this.dailyNotes.findIndex((note) => {
                    return (note == markdownView.file as TFile);
                });
                if (commandID == 'next-note' && index != this.dailyNotes.length - 1) return true;
                if (commandID == 'previous-note' && index != 0) return true;
                return false;
            }
            else return false;
            // This command will only show up in Command Palette when the check function returns true
        }
    }

    /* refreshNotes() {
        this.dailyNotes = getAllDailyNotes();
        // printToConsole(logLevel.log, this.dailyNotes.length.toString());
        this.refreshViews(true, true);
        printToConsole(logLevel.info, 'Daily notes refreshed!');
    } */

    /* setCalDate(date: Date) {
        const calView = this.app.workspace.getLeavesOfType(ViewType.calendarView);
        for (let leaf of calView) {
            let view = leaf.view;
            if (view instanceof CalendarView) {
                view.startDate = date;
            }
        }
    } */

    refreshViews(refCalView: boolean, refRevView: boolean, startMoment?: moment.Moment) {
        if (refCalView) {
            const calView = this.app.workspace.getLeavesOfType(ViewType.calendarView);
            for (let leaf of calView) {
                let view = leaf.view;
                if (view instanceof CalendarView) {
                    view.refresh(this, startMoment?.toDate());
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

    sortDailyNotes(folder: string, format: string) {
        this.dailyNotes.sort(function (fileA, fileB) {
            const momentA = getMoment(fileA, folder, format);
            const momentB = getMoment(fileB, folder, format);
            return momentA.diff(momentB);
        });
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
        new Setting(contentEl).setName('Select Diarium view').setHeading();

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
            .setIcon('lucide-calendar')
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
