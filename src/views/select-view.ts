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

        /* new ButtonComponent(contentEl)
            .setClass('select-view-button')
            .setIcon('lucide-refresh-ccw')
            .setButtonText('Refresh daily notes')
            .setTooltip('Search the entire vault for daily notes.\nUse this feature sparingly!')
            .setWarning()
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:refresh-notes`);
                this.close();
            }) */

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}