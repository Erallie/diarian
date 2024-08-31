import { App, Modal, Setting, ButtonComponent } from 'obsidian';
import type Diarian from 'main';
import type { EnhancedApp } from 'main';

export class SelectView extends Modal {
    plugin: Diarian;

    constructor(app: App, plugin: Diarian) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('Select Diarian view').setHeading();

        const enhancedApp = this.app as EnhancedApp;

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-file-plus')
            .setButtonText('New daily note')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:new-note`);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-calendar')
            .setButtonText('Open calendar')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:open-calendar`);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-history')
            .setButtonText('Open on this day')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:open-on-this-day`);
                this.close();
            });

        new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-import')
            .setButtonText('Open importer')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:open-importer`);
                this.close();
            });

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}