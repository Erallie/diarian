import { App, View, Modal, Plugin, Setting, Platform, ButtonComponent, TFile, WorkspaceLeaf } from 'obsidian';
import { CalendarView } from './src/react-nodes/calendar-view';
import { OnThisDayView } from './src/react-nodes/on-this-day-view';
import { ImportView } from './src/import-journal';
import { ViewType, printToConsole, logLevel } from './src/constants';
import { DiariumSettings, DiariumSettingTab, DEFAULT_SETTINGS } from 'src/settings';
import { getAllDailyNotes } from './src/get-daily-notes';


// Remember to rename these classes and interfaces!


export default class Diarium extends Plugin {
    settings: DiariumSettings;
    view: View;
    app: App;
    dailyNotes: TFile[];

    async onload() {
        await this.loadSettings();

        this.dailyNotes = getAllDailyNotes();

        this.registerView(ViewType.calendarView, (leaf) => new CalendarView(leaf, this, this.view, this.app));
        this.registerView(ViewType.onThisDayView, (leaf) => new OnThisDayView(leaf, this, this.view, this.app));

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
            id: 'refresh-notes',
            name: 'Refresh daily notes',
            icon: 'lucide-refresh-ccw',
            callback: () => {
                this.refreshNotes();
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
                this.openCalendar();
                // new SampleModal(this.app).open();
            }
        });

        this.addCommand({
            id: 'open-on-this-day',
            name: 'Open on this day',
            icon: 'lucide-clock',
            callback: () => {
                this.openOnThisDay();
                // this.openCalendar();
                // new SampleModal(this.app).open();
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

        // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
        // Using this function will automatically remove the event listener when this plugin is disabled.
        /* this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
            console.log('click', evt);
        }); */

        // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
        // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
    }

    onunload() {

    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async openCalendar() {
        /* const workspace = this.app.workspace;
        workspace.detachLeavesOfType(ViewType.calendarView);
        const leaf = workspace.getLeaf(
            // (!Platform.isMobile && workspace.activeLeaf && workspace.activeLeaf.view instanceof FileView) || true,
            !Platform.isMobile
        );
        await leaf.setViewState({ type: ViewType.calendarView });
        workspace.revealLeaf(leaf); */

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
    }

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

    refreshNotes() {
        this.dailyNotes = getAllDailyNotes();

        // printToConsole(logLevel.log, this.dailyNotes.length.toString());
        const calView = this.app.workspace.getLeavesOfType(ViewType.calendarView);
        for (let leaf of calView) {
            let view = leaf.view;
            if (view instanceof CalendarView) {
                view.refresh(this);
            }
        }

        const revView = this.app.workspace.getLeavesOfType(ViewType.onThisDayView);
        for (let leaf of revView) {
            let view = leaf.view;
            if (view instanceof OnThisDayView) {
                view.refresh(this);
            }
        }

        printToConsole(logLevel.info, 'Daily notes refreshed!');
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
        // contentEl.setText('Open view');

        // contentEl.createEl('br');

        /* const openCalendarButton = new DocumentFragment();
        openCalendarButton.createEl('img', {
            text: "Open calendar",
            attr: {
                src: "Attachments/icons/lucide-calendar-search.svg"
            },
        });
        openCalendarButton.createEl('span', { text: ' Open calendar' }); */

        new ButtonComponent(contentEl)
            .setIcon('lucide-calendar-search')
            .setButtonText('Open calendar')
            .onClick(() => {
                this.plugin.openCalendar();
                this.close();
            });

        new ButtonComponent(contentEl)
            // .setIcon('lucide-rotate-cw')
            .setIcon('lucide-clock')
            .setButtonText('Open on this day')
            .onClick(() => {
                // this.plugin.openCalendar();
                this.plugin.openOnThisDay();
                this.close();
            });

        new ButtonComponent(contentEl)
            // .setIcon('lucide-rotate-cw')
            // .setIcon('lucide-clock')
            .setButtonText('Open importer')
            .onClick(() => {
                new ImportView(this.app, this.plugin).open();
                this.close();
            });

        new ButtonComponent(contentEl)
            // .setIcon('lucide-rotate-cw')
            // .setIcon('lucide-clock')
            .setButtonText('Refresh daily notes')
            .setTooltip('This feature queries the entire vault for daily notes.\nUse this feature sparingly!')
            .setWarning()
            .onClick(() => {
                this.plugin.refreshNotes();
                this.close();
            })

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
