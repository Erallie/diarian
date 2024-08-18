import { App, Editor, MarkdownView, moment, View, Modal, Plugin, Setting, ButtonComponent, TFile, WorkspaceLeaf, Menu, IconName, ToggleComponent, TAbstractFile } from 'obsidian';
import { CalendarView } from 'src/views/react-nodes/calendar-view';
import { OnThisDayView } from 'src/views/react-nodes/on-this-day-view';
import { ImportView } from 'src/import-journal';
import { ViewType, printToConsole, logLevel } from 'src/constants';
import { DiarianSettings, DiarianSettingTab, DEFAULT_SETTINGS, LeafType, leafTypeMap } from 'src/settings';
import { getAllDailyNotes, isDailyNote, getMoment, isSameDay, getModifiedFolderAndFormat } from 'src/get-daily-notes';
import { NewDailyNote } from 'src/views/react-nodes/new-note';
import { RatingView } from 'src/views/rating-view';
import { SelectView } from 'src/views/select-view';


export type EnhancedApp = App & {
    commands: { executeCommandById: Function };
};


export default class Diarian extends Plugin {
    settings: DiarianSettings;
    view: View;
    app: App;
    dailyNotes: TFile[];
    defaultRating: number;
    defMaxRating: number;
    ratingStatBar: HTMLElement;

    async onload() {
        await this.loadSettings();


        this.app.workspace.onLayoutReady(() => {

            const { folder, format }: any = getModifiedFolderAndFormat();
            this.dailyNotes = getAllDailyNotes(folder, format);
            this.sortDailyNotes(folder, format);

            this.registerView(ViewType.calendarView, (leaf) => new CalendarView(leaf, this, this.app));
            this.registerView(ViewType.onThisDayView, (leaf) => new OnThisDayView(leaf, this, this.app));
            // this.refreshViews(true, true);


            //#region Events for updating notes
            this.registerEvent( //on rename
                this.app.vault.on('rename', (file, oldPath) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                        this.dailyNotes[this.dailyNotes.length] = file;
                        this.sortDailyNotes(folder, format);
                        // if (this.app.workspace.layoutReady)
                        this.refreshViews(true, true);
                    }
                }));

            this.registerEvent( //on create
                this.app.vault.on('create', (file) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                        // printToConsole(logLevel.log, isDailyNote(file, folder, format).toString());
                        this.dailyNotes[this.dailyNotes.length] = file;
                        this.sortDailyNotes(folder, format);
                        // if (this.app.workspace.layoutReady)
                        this.refreshViews(true, true);
                    }
                }));

            this.registerEvent( //on delete
                this.app.vault.on('delete', (file) => {
                    const { folder, format }: any = getModifiedFolderAndFormat();
                    if (file instanceof TFile && isDailyNote(file, folder, format)) {
                        this.dailyNotes = this.dailyNotes.filter(thisFile => {
                            return (thisFile != file);
                        });
                        // if (this.app.workspace.layoutReady)
                        this.refreshViews(true, true);
                    }
                }));

            //#endregion


            const enhancedApp = this.app as EnhancedApp;

            if (this.settings.onThisDayStartup)
                enhancedApp.commands.executeCommandById(`${this.manifest.id}:open-on-this-day`);
            if (this.settings.calStartup)
                enhancedApp.commands.executeCommandById(`${this.manifest.id}:open-calendar`);

        });

        //#region Add rating status bar
        const ratingStatBar = this.addStatusBarItem();
        ratingStatBar.classList.add('rating-status-bar');
        ratingStatBar.setText('');
        ratingStatBar.onClickEvent((ev) => {
            this.openRatingView(ratingStatBar);
        });
        this.ratingStatBar = ratingStatBar;


        const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (markdownView) {
            this.changeStatBar(ratingStatBar, markdownView.file);
        }
        //#endregion


        // This creates an icon in the left ribbon.
        const ribbonIconEl = this.addRibbonIcon('lucide-book-heart', 'Select Diarian view', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            // this.openCalendar();
            const enhancedApp = this.app as EnhancedApp;
            const menu = new Menu();
            menu.addItem((item) => // New daily note
                item
                    .setTitle('New daily note')
                    .setIcon('lucide-file-plus')
                    .onClick(() => {
                        enhancedApp.commands.executeCommandById(`${this.manifest.id}:new-note`);
                    }));

            menu.addItem((item) => // Open calendar
                item
                    .setTitle('Open calendar')
                    .setIcon('lucide-calendar')
                    .onClick(() => {
                        enhancedApp.commands.executeCommandById(`${this.manifest.id}:open-calendar`);
                    }));

            menu.addItem((item) => // Open on this day
                item
                    .setTitle('Open on this day')
                    .setIcon('lucide-history')
                    .onClick(() => {
                        enhancedApp.commands.executeCommandById(`${this.manifest.id}:open-on-this-day`);
                    }));

            menu.addItem((item) => // Open importer
                item
                    .setTitle('Open importer')
                    .setIcon('lucide-import')
                    .onClick(() => {
                        enhancedApp.commands.executeCommandById(`${this.manifest.id}:open-importer`);
                    }));


            menu.showAtMouseEvent(evt);
        });
        // Perform additional things with the ribbon
        // ribbonIconEl.addClass('my-plugin-ribbon-class');

        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
        /* const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('Status Bar Text'); */

        //#region Commands
        // This adds a simple command that can be triggered anywhere
        //#region editor commands
        this.addCommand({ // Insert timestamp
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

        //#region file commands
        this.addCommand({ // Show in calendar
            id: 'insert-rating',
            name: 'Insert rating',
            icon: 'lucide-star',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView && markdownView.file instanceof TFile) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.

                    const { folder, format }: any = getModifiedFolderAndFormat();
                    // printToConsole(logLevel.log, 'can open view');
                    return this.checkCallback(checking, 'insert-rating', markdownView.file, folder, format, ratingStatBar);
                    // This command will only show up in Command Palette when the check function returns true
                }
                else if (checking) return false;
            }
        });

        this.addCommand({ // Show in calendar
            id: 'show-in-calendar',
            name: 'Show daily note in calendar',
            icon: 'lucide-calendar-search',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView && markdownView.file instanceof TFile) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.

                    const { folder, format }: any = getModifiedFolderAndFormat();
                    // printToConsole(logLevel.log, 'can open view');
                    return this.checkCallback(checking, 'show-in-calendar', markdownView.file, folder, format);
                    // This command will only show up in Command Palette when the check function returns true
                }
                else if (checking) return false;
            }
        });

        this.addCommand({ // Next note
            id: 'next-note',
            name: 'Go to next daily note',
            icon: 'lucide-chevrons-right',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView && markdownView.file instanceof TFile) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.

                    const { folder, format }: any = getModifiedFolderAndFormat();

                    // printToConsole(logLevel.log, 'can open view');
                    return this.checkCallback(checking, 'next-note', markdownView.file, folder, format);
                    // This command will only show up in Command Palette when the check function returns true
                }
                else if (checking) return false;
            }
        });

        this.addCommand({ // Previous note
            id: 'previous-note',
            name: 'Go to previous daily note',
            icon: 'lucide-chevrons-left',
            checkCallback: (checking: boolean) => {
                // Conditions to check
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (markdownView && markdownView.file instanceof TFile) {
                    // If checking is true, we're simply "checking" if the command can be run.
                    // If checking is false, then we want to actually perform the operation.

                    const { folder, format }: any = getModifiedFolderAndFormat();
                    // printToConsole(logLevel.log, 'can open view');
                    return this.checkCallback(checking, 'previous-note', markdownView.file, folder, format);
                    // This command will only show up in Command Palette when the check function returns true
                }
                else if (checking) return false;
            }
        });

        //#endregion

        //#endregion

        this.addCommand({ // New note
            id: 'new-note',
            name: 'New daily note',
            icon: 'lucide-file-plus',
            callback: () => {
                new NewDailyNote(this.app, this).open();
            }
        });

        /* this.addCommand({ // Refresh notes
            id: 'refresh-notes',
            name: 'Refresh daily notes',
            icon: 'lucide-refresh-ccw',
            callback: () => {
                this.dailyNotes = getAllDailyNotes();
                // printToConsole(logLevel.log, this.dailyNotes.length.toString());
                this.refreshViews(true, true);
                printToConsole(logLevel.info, 'Daily notes refreshed!');
            }
        }); */

        this.addCommand({ // Select view
            id: 'select-view',
            name: 'Select Diarian view',
            icon: 'lucide-book-heart',
            callback: () => {
                new SelectView(this.app, this).open();
            }
        });

        this.addCommand({ // Open Calendar
            id: 'open-calendar',
            name: 'Open calendar',
            icon: 'lucide-calendar',
            callback: () => {
                this.openLeaf(ViewType.calendarView, this.settings.calLocation);
            }
        });

        this.addCommand({ // Open on this day
            id: 'open-on-this-day',
            name: 'Open on this day',
            icon: 'lucide-history',
            callback: () => {
                // this.openOnThisDay();
                // this.openCalendar();
                // new SampleModal(this.app).open();
                this.openLeaf(ViewType.onThisDayView, this.settings.onThisDayLoc);
            }
        });

        this.addCommand({ // Open importer
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
        this.addSettingTab(new DiarianSettingTab(this.app, this));

        this.registerEvent( //on editor menu
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
                this.addMenuItem(menu, 'insert-rating', 'Insert rating', 'lucide-star', enhancedApp);

                menu.addSeparator();

                this.addMenuItem(menu, 'show-in-calendar', 'Show daily note in calendar', 'lucide-calendar-search', enhancedApp);
                this.addMenuItem(menu, 'previous-note', 'Go to previous daily note', 'lucide-chevrons-left', enhancedApp);
                this.addMenuItem(menu, 'next-note', 'Go to next daily note', 'lucide-chevrons-right', enhancedApp);

                menu.addSeparator();

            })

        );

        this.registerEvent( //on file menu
            this.app.workspace.on('file-menu', (menu, file, source) => {
                const enhancedApp = this.app as EnhancedApp;

                if (file instanceof TFile) {
                    menu.addSeparator();

                    this.addMenuItem(menu, 'show-in-calendar', 'Show daily note in calendar', 'lucide-calendar-search', enhancedApp, file);
                    this.addMenuItem(menu, 'previous-note', 'Go to previous daily note', 'lucide-chevrons-left', enhancedApp, file);
                    this.addMenuItem(menu, 'next-note', 'Go to next daily note', 'lucide-chevrons-right', enhancedApp, file);

                    menu.addSeparator();

                    this.addMenuItem(menu, 'insert-rating', 'Insert rating', 'lucide-star', enhancedApp);

                    menu.addSeparator();
                }
            })
        );


        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.

        this.registerEvent(
            this.app.workspace.on('file-open', (file) => {
                this.changeStatBar(ratingStatBar, file);
            }))
        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        /* this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            console.log('click', evt);
        }); */

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    changeStatBar(ratingStatBar: HTMLElement, file: TFile | null) {
        const { folder, format }: any = getModifiedFolderAndFormat();
        if (file instanceof TFile && isDailyNote(file, folder, format)) {
            this.app.fileManager.processFrontMatter(
                file,
                (frontmatter) => {
                    const rating: string = frontmatter[this.settings.ratingProp];

                    if (rating === undefined || rating == '') {
                        // printToConsole(logLevel.log, 'Rating is blank!');
                        //Add functionality to insert rating here.
                        this.setStatBarText(ratingStatBar, `0/${this.settings.defaultMaxRating}`);
                        //Add functionality to insert rating here.
                    }
                    else {
                        this.setStatBarText(ratingStatBar, rating);
                    }
                }
            );

        }
        else ratingStatBar.setText('');
    }

    onunload() {
        // this.ratingStatBar.removeEventListener('click', null, true);
        // this.ratingStatBar.removeEventListener('click', () => { this.openRatingView(this.ratingStatBar) });
        // this.app.unregister()
    }

    openRatingView(statBar: HTMLElement) {
        new RatingView(this.app, this, statBar, this.defaultRating, this.defMaxRating).open();
    }

    setStatBarText(statBar: HTMLElement, rating: string) {

        const match = /^(\d+)\/(\d+)$/.exec(rating);
        if (match === null) {
            printToConsole(logLevel.warn, `'${rating}' is not a valid rating property!`);
        }
        else {
            const value = Number.parseInt(match[1]);
            this.defaultRating = value;
            let filled = value;
            const max = Number.parseInt(match[2]);
            this.defMaxRating = max;
            if (filled > max) {
                printToConsole(logLevel.warn, 'The rating cannot be larger than the maximum!');
            }
            else {
                let empty = max - filled;
                let ratingText = '';
                while (filled > 0) {
                    ratingText += this.settings.filledStroke;
                    filled--;
                }
                while (empty > 0) {
                    ratingText += this.settings.emptyStroke;
                    empty--;
                }
                statBar.setText(ratingText);

            }
        }
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

    checkCallback(checking: boolean, commandID: string, file: TFile, folder: string, format: string, statBar?: HTMLElement) {
        if (isDailyNote(file, folder, format)) {
            // printToConsole(logLevel.log, 'can open view');
            switch (commandID) {
                case 'show-in-calendar':
                    if (checking) return true;
                    const noteMoment = getMoment(file, folder, format);
                    this.refreshViews(true, false, noteMoment);
                    this.openLeaf(ViewType.calendarView, LeafType.tab);
                    break;
                case 'insert-rating':
                    if (checking) return true;
                    // if (statBar)
                    if (statBar)
                        this.openRatingView(statBar);
                    else
                        this.openRatingView(this.ratingStatBar);
                default:
                    const index = this.dailyNotes.findIndex((note) => {
                        return (note == file as TFile);
                    });
                    switch (commandID) {
                        case 'next-note':
                            if (checking) {
                                if (index != this.dailyNotes.length - 1) return true;
                                else return false;
                            }
                            void this.app.workspace.getLeaf(false).openFile(this.dailyNotes[index + 1]);
                            break;
                        case 'previous-note':
                            if (checking) {
                                if (index != 0) return true;
                                else return false;
                            }
                            void this.app.workspace.getLeaf(false).openFile(this.dailyNotes[index - 1]);
                            break;
                    }
            }
            if (commandID == 'show-in-calendar') {
                if (checking) return true;
                const noteMoment = getMoment(file, folder, format);
                this.refreshViews(true, false, noteMoment);
                this.openLeaf(ViewType.calendarView, LeafType.tab);
            }

        }
        else if (checking) return false;
    }

    addMenuItem(menu: Menu, commandID: string, title: string, icon: IconName, enhancedApp: EnhancedApp, file?: TFile) {
        let isAvailable = false;
        const { folder, format }: any = getModifiedFolderAndFormat();
        if (file) {
            isAvailable = this.checkCallback(true, commandID, file, folder, format) || false;
            if (isAvailable) {
                menu.addItem(item => {
                    item
                        .setTitle(title)
                        .setIcon(icon)
                        .onClick(() => {
                            this.checkCallback(false, commandID, file, folder, format);
                        })
                });
            }
        }
        else {
            const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (markdownView && markdownView.file) {
                isAvailable = this.checkCallback(true, commandID, markdownView.file, folder, format) || false;
                if (isAvailable)
                    menu.addItem(item => {
                        item
                            .setTitle(title)
                            .setIcon(icon)
                            .onClick(() => {
                                this.checkCallback(false, commandID, markdownView.file as TFile, folder, format);
                            })
                    });
            }
        }

    }

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