import { App, Editor, MarkdownView, moment, View, Plugin, TFile, WorkspaceLeaf, Menu, IconName, Platform, Notice } from 'obsidian';
import { CalendarView } from 'src/views/react-nodes/calendar-view';
import { OnThisDayView } from 'src/views/react-nodes/on-this-day-view';
import { ImportView } from 'src/import-journal';
import { ViewType, printToConsole, logLevel } from 'src/constants';
import { DiarianSettings, DiarianSettingTab, DEFAULT_SETTINGS, LeafType, leafTypeMap, notifTypeMap, NotifType, displayRating } from 'src/settings';
import { getAllDailyNotes, isDailyNote, getMoment, isSameDay, getModifiedFolderAndFormat, getPriorNotes } from 'src/get-daily-notes';
import { NewDailyNote } from 'src/views/react-nodes/new-note';
import { RatingView } from 'src/views/rating-view';
import { SelectView } from 'src/views/select-view';
import { Notification } from 'src/views/react-nodes/notification';


export default class Diarian extends Plugin {
    settings: DiarianSettings;
    dailyNotes: TFile[];
    defaultRating: number;
    defMaxRating: number;
    ratingStatBar: HTMLElement;
    reminderIntervalID: number;

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
                    if (file instanceof TFile) {
                        if (isDailyNote(file, folder, format, oldPath)) {
                            this.dailyNotes = this.dailyNotes.filter(thisFile => {
                                return (thisFile != file);
                            });
                            // if (this.app.workspace.layoutReady)
                            this.refreshViews(true, true);
                        }
                        if (isDailyNote(file, folder, format)) {
                            this.dailyNotes[this.dailyNotes.length] = file;
                            this.sortDailyNotes(folder, format);
                            // if (this.app.workspace.layoutReady)
                            this.refreshViews(true, true);
                        }
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


            if (this.settings.onThisDayStartup)
                this.openLeaf(ViewType.onThisDayView, this.settings.onThisDayLoc);
            if (this.settings.calStartup)
                this.openLeaf(ViewType.calendarView, this.settings.calLocation);

            this.openNotif();
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
            await this.onFileOpen(ratingStatBar, markdownView.file);
        }
        //#endregion


        // This creates an icon in the left ribbon.
        this.addRibbonIcon('lucide-book-heart', 'Select Diarian view', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            this.openSelectView(evt);
        });

        //#region Commands
        // This adds a simple command that can be triggered anywhere
        //#region editor commands
        this.addCommand({ // Insert timestamp
            id: 'insert-timestamp',
            name: 'Insert timestamp',
            icon: 'lucide-alarm-clock',
            editorCallback: (editor: Editor, view: MarkdownView) => {
                this.insertTimestamp(editor, view);
            }
        });

        //#region file commands
        this.addCommand({ // Insert rating
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

        this.addCommand({ // Select view
            id: 'select-view',
            name: 'Select view',
            icon: 'lucide-book-heart',
            callback: () => {
                this.openSelectView();
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
                this.openLeaf(ViewType.onThisDayView, this.settings.onThisDayLoc);
            }
        });

        this.addCommand({ // Open importer
            id: 'open-importer',
            name: 'Open importer',
            icon: 'lucide-import',
            callback: () => {
                new ImportView(this.app, this).open();
            }
        });
        //#endregion

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new DiarianSettingTab(this.app, this));

        this.registerEvent( //on editor menu
            this.app.workspace.on("editor-menu", (menu, editor, info) => {
                menu.addSeparator();

                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (view) {
                    menu.addItem(item => {
                        item
                            .setTitle('Insert timestamp')
                            .setIcon('lucide-alarm-clock')
                            .onClick(() => {
                                this.insertTimestamp(editor, view)
                            })
                    });
                }
                this.addMenuItem(menu, 'insert-rating', 'Insert rating', 'lucide-star');

                menu.addSeparator();

                this.addMenuItem(menu, 'show-in-calendar', 'Show daily note in calendar', 'lucide-calendar-search');
                this.addMenuItem(menu, 'previous-note', 'Go to previous daily note', 'lucide-chevrons-left');
                this.addMenuItem(menu, 'next-note', 'Go to next daily note', 'lucide-chevrons-right');

                menu.addSeparator();

            })

        );

        this.registerEvent( //on file menu
            this.app.workspace.on('file-menu', (menu, file, source) => {

                if (file instanceof TFile) {
                    menu.addSeparator();

                    this.addMenuItem(menu, 'show-in-calendar', 'Show daily note in calendar', 'lucide-calendar-search', file);
                    this.addMenuItem(menu, 'previous-note', 'Go to previous daily note', 'lucide-chevrons-left', file);
                    this.addMenuItem(menu, 'next-note', 'Go to next daily note', 'lucide-chevrons-right', file);

                    menu.addSeparator();

                    this.addMenuItem(menu, 'insert-rating', 'Insert rating', 'lucide-star');

                    menu.addSeparator();
                }
            })
        );


        this.registerEvent( //On file open
            this.app.workspace.on('file-open', async (file) => {
                await this.onFileOpen(ratingStatBar, file);
            }))

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        // printToConsole(logLevel.log, 'settings saved');
    }

    async onFileOpen(ratingStatBar: HTMLElement, file: TFile | null) {
        const { folder, format }: any = getModifiedFolderAndFormat();
        if (file instanceof TFile && isDailyNote(file, folder, format)) {
            this.refreshViews(true, false, getMoment(file, folder, format));
            const rating = await this.app.metadataCache.getCache(file.path)?.frontmatter?.[this.settings.ratingProp];
            if (!rating || rating === undefined || rating == '') {
                this.setStatBarText(ratingStatBar, `0/${this.settings.defaultMaxRating}`);
            }
            else {
                this.setStatBarText(ratingStatBar, rating);
            }

        }
        else ratingStatBar.setText('');
    }

    onunload() {
    }

    openSelectView(evt?: MouseEvent) {
        if (evt) {
            this.selectViewMenu().showAtMouseEvent(evt);
        }
        else if (Platform.isMobile) {
            this.selectViewMenu().showAtPosition({ x: 20, y: 20 })
        }
        else {
            new SelectView(this.app, this).open();
        }
    }

    selectViewMenu() {
        const menu = new Menu();
        menu.addItem((item) => // New daily note
            item
                .setTitle('New daily note')
                .setIcon('lucide-file-plus')
                .onClick(() => {
                    new NewDailyNote(this.app, this).open();
                }));

        menu.addItem((item) => // Open calendar
            item
                .setTitle('Open calendar')
                .setIcon('lucide-calendar')
                .onClick(() => {
                    this.openLeaf(ViewType.calendarView, this.settings.calLocation);
                }));

        menu.addItem((item) => // Open on this day
            item
                .setTitle('Open on this day')
                .setIcon('lucide-history')
                .onClick(() => {
                    this.openLeaf(ViewType.onThisDayView, this.settings.onThisDayLoc);
                }));

        menu.addItem((item) => // Open importer
            item
                .setTitle('Open importer')
                .setIcon('lucide-import')
                .onClick(() => {
                    new ImportView(this.app, this).open();
                }));

        return menu;
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
            const max = Number.parseInt(match[2]);
            this.defMaxRating = max;
            if (value > max) {
                printToConsole(logLevel.warn, 'The rating cannot be larger than the maximum!');
            }
            else {
                const fullRating = new DocumentFragment;
                displayRating(this.settings, value, max, fullRating);
                statBar.setText(fullRating);

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
                    this.openLeaf(ViewType.calendarView, this.settings.calLocation);
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
                        return (note == file);
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
            /* if (commandID == 'show-in-calendar') {
                if (checking) return true;
                const noteMoment = getMoment(file, folder, format);
                this.refreshViews(true, false, noteMoment);
                this.openLeaf(ViewType.calendarView, this.settings.calLocation);
            } */

        }
        else if (checking) return false;
    }

    addMenuItem(menu: Menu, commandID: string, title: string, icon: IconName, file?: TFile) {
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
                                if (markdownView.file instanceof TFile)
                                    this.checkCallback(false, commandID, markdownView.file, folder, format);
                            })
                    });
            }
        }

    }

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

    openNotif() {
        const mappedNotifType = notifTypeMap[this.settings.revNotifType as NotifType];
        switch (mappedNotifType) {
            case NotifType.none:
                break;
            case NotifType.modal:
                const notifInfo = this.settings.notifInfo;
                if (isSameDay(moment(), moment(notifInfo.lastNotified)) == false || (notifInfo.needToRemind && moment().isSameOrAfter(moment(notifInfo.reminderTime)))) {
                    const priorNotes = getPriorNotes(this.dailyNotes, this);
                    if (priorNotes && priorNotes.length > 0) {
                        new Notification(this.app, this).open();
                    }
                    else {
                        this.settings.notifInfo = {
                            lastNotified: moment(),
                            needToRemind: false
                        }
                        this.saveSettings();
                    }
                }
                else if (notifInfo.needToRemind) {
                    this.setReminder();
                }
                break;
            case NotifType.notice:
                const priorNotes = getPriorNotes(this.dailyNotes, this);
                if (priorNotes && priorNotes.length > 0) {
                    const notice = new DocumentFragment;
                    const noticeSpan = notice.createSpan()
                    noticeSpan.textContent = 'You have daily notes from on this day!';
                    noticeSpan.createEl('br');
                    let noticeClick: HTMLSpanElement;
                    if (Platform.isDesktop) {
                        noticeClick = noticeSpan.createEl('span', { text: 'Click here to view them!', cls: 'link' });
                        // noticeSpan.createEl('br');
                        // noticeSpan.createEl('span', { text: 'Click elsewhere to dismiss.' });
                    }
                    else if (Platform.isMobile) {
                        noticeClick = noticeSpan.createEl('span', { text: 'Tap here to view them!', cls: 'link' });
                        // noticeSpan.createEl('br');
                        // noticeSpan.createEl('span', { text: 'Tap elsewhere to dismiss.' });
                    }
                    noticeClick!.onClickEvent((ev) => {
                        this.openLeaf(ViewType.onThisDayView, this.settings.onThisDayLoc);
                    });
                    new Notice(notice, 0);
                }
                break;
            default:
                printToConsole(logLevel.warn, `Cannot set notification:\n"${this.settings.revNotifType}" is not a valid notification type!`);
        }

    }

    setReminder() {
        this.reminderIntervalID = window.setInterval(() => this.runInterval(), 60 * 1000); //Interval for every 1 minute
        this.registerInterval(this.reminderIntervalID);
    }

    runInterval() {
        const mappedNotifType = notifTypeMap[this.settings.revNotifType as NotifType];
        if (mappedNotifType !== NotifType.modal)
            clearInterval(this.reminderIntervalID);
        else if (moment().isSameOrAfter(moment(this.settings.notifInfo.reminderTime))) {
            new Notification(this.app, this).open();
            clearInterval(this.reminderIntervalID);
        }
    }

    insertTimestamp(editor: Editor, view: MarkdownView) {

        if (!view.file) {
            return;
        }

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
        //if the next line is the last line
        else if (cursor.line + 1 == editor.lastLine()) {
            fullString += '\n';
            newCursorLine += 2;
        }
        //if the next line is not empty
        else if (cursor.line + 1 < editor.lastLine() && editor.getLine(cursor.line + 1) != '') {
            fullString += '\n';
            newCursorLine += 2;
        }
        // if the next line is empty and there's a line after that.
        else if (cursor.line + 2 <= editor.lastLine() && editor.getLine(cursor.line + 1) == '') {
            newCursorLine += 2;
        }



        editor.replaceRange(
            fullString,
            editor.getCursor()
        );
        editor.setCursor(newCursorLine, 0);

    }
}//