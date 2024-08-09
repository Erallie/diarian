import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, ItemView, WorkspaceLeaf, Platform, FileView } from 'obsidian';
import { CalendarView } from './calendar-view';
import { getDailyNoteSettings, momentToRegex } from './get-daily-notes';


const CALENDAR_VIEW_TYPE = "calendar-view";
// Remember to rename these classes and interfaces!

export interface DiariumSettings {
    headerFormat: string;
}

const DEFAULT_SETTINGS: DiariumSettings = {
    headerFormat: 'dddd, MMMM Do, YYYY'
}

export default class Diarium extends Plugin {
    settings: DiariumSettings;

    async onload() {
        await this.loadSettings();

        this.registerView(CALENDAR_VIEW_TYPE, (leaf) => new CalendarView(leaf, this));

        // This creates an icon in the left ribbon.
        const ribbonIconEl = this.addRibbonIcon('lucide-calendar-search', 'Open calendar', (evt: MouseEvent) => {
            // Called when the user clicks the icon.
            this.openCalendar();
            // console.log(momentToRegex('dddd, MMMM Do, YYYY NNNN [at] h:mm A'));
        });
        // Perform additional things with the ribbon
        // ribbonIconEl.addClass('my-plugin-ribbon-class');

        // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
        /* const statusBarItemEl = this.addStatusBarItem();
        statusBarItemEl.setText('Status Bar Text'); */

        // This adds a simple command that can be triggered anywhere
        this.addCommand({
            id: 'open-calendar',
            name: 'Open calendar',
            icon: 'lucide-calendar-search',
            callback: () => {
                this.openCalendar();
                // new SampleModal(this.app).open();
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
        const workspace = this.app.workspace;
        workspace.detachLeavesOfType(CALENDAR_VIEW_TYPE);
        const leaf = workspace.getLeaf(
            !Platform.isMobile && workspace.activeLeaf && workspace.activeLeaf.view instanceof FileView,
        );
        await leaf.setViewState({ type: CALENDAR_VIEW_TYPE });
        workspace.revealLeaf(leaf);
    }
}

/* class SampleModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.setText('Woah!');
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
} */

class DiariumSettingTab extends PluginSettingTab {
    plugin: Diarium;

    constructor(app: App, plugin: Diarium) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Header format')
            .setDesc('The moment.js format for headings. See https://momentjs.com/docs/#/displaying/format/ for info on how to format this setting.')
            .addText(text => text
                .setPlaceholder('dddd, MMMM Do, YYYY')
                .setValue(this.plugin.settings.headerFormat)
                .onChange(async (value) => {
                    this.plugin.settings.headerFormat = value;
                    await this.plugin.saveSettings();
                    getDailyNoteSettings();
                    console.log("format = " + this.plugin.settings.format);
                }));

    }
}
