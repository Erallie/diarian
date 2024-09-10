import { App, Modal, Setting, ButtonComponent } from 'obsidian';
import type Diarian from 'src/main';
import { NewDailyNote } from 'src/views/react-nodes/new-note';
import { ViewType, printToConsole, logLevel } from 'src/constants';
import { ImportView } from 'src/import-journal';

export class SelectView extends Modal {
    plugin: Diarian;

    constructor(app: App, plugin: Diarian) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('Select Diarian view').setHeading();


        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-file-plus')
            .setButtonText('New daily note')
            .onClick(() => {
                new NewDailyNote(this.app, this.plugin).open();
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-calendar')
            .setButtonText('Open calendar')
            .onClick(() => {
                this.plugin.openLeaf(ViewType.calendarView, this.plugin.settings.calLocation);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-history')
            .setButtonText('Open on this day')
            .onClick(() => {
                this.plugin.openLeaf(ViewType.onThisDayView, this.plugin.settings.onThisDayLoc);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-import')
            .setButtonText('Open importer')
            .onClick(() => {
                new ImportView(this.app, this.plugin).open();
                this.close();
            });

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}