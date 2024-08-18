import { App, MarkdownView, Modal, Setting, TFile } from 'obsidian';
import { isDailyNote, getModifiedFolderAndFormat } from '../get-daily-notes';
import type Diarian from 'main';
import type { EnhancedApp } from 'main';

export class RatingView extends Modal {
    plugin: Diarian;
    maxValue: number;
    defaultVal: number;
    statBar: HTMLElement;
    settingsShown: boolean;

    constructor(app: App, plugin: Diarian, statBar: HTMLElement, defaultVal?: number, defMax?: number) {
        super(app);
        this.plugin = plugin;
        if (defMax)
            this.maxValue = defMax;
        else
            this.maxValue = this.plugin.settings.defaultMaxRating;
        this.statBar = statBar;
        this.settingsShown = false;
        if (defaultVal)
            this.defaultVal = defaultVal;
        else
            this.defaultVal = 0;
    }

    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('How are you feeling right now?').setHeading();

        const enhancedApp = this.app as EnhancedApp;
        // contentEl.setText('Open view');

        // contentEl.createEl('br');


        const rating = contentEl.createEl('p', { cls: 'rating' });
        rating.id = 'rating';

        let ratingStrokes: HTMLSpanElement[] = [];

        const setDefaultStroke = (currentVal: number) => {
            // If filled stroke
            if (currentVal <= this.defaultVal)
                return this.plugin.settings.filledStroke;
            // If empty stroke
            else
                return this.plugin.settings.emptyStroke;
        }

        const setDefaultClass = (currentVal: number) => {
            // If filled stroke
            if (currentVal <= this.defaultVal)
                return '';
            // If empty stroke
            else
                return 'text-faint';
        }


        for (let i = 0; i < this.maxValue; i++) {
            ratingStrokes[i] = rating.createEl('span', { text: setDefaultStroke(i + 1), cls: setDefaultClass(i + 1) });
            ratingStrokes[i].id = `rating-${i}`;
            ratingStrokes[i].addEventListener('mouseenter', (ev) => {
                for (let ii = 0; ii < this.maxValue; ii++) {
                    if (ii <= i) {
                        ratingStrokes[ii].setText(this.plugin.settings.filledStroke);
                        ratingStrokes[ii].className = 'text-accent';
                    }
                    else {
                        ratingStrokes[ii].setText(this.plugin.settings.emptyStroke);
                        ratingStrokes[ii].className = 'text-faint';
                    }
                }
            });
            ratingStrokes[i].onClickEvent((ev) => {
                const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                const file = markdownView?.file;
                const { folder, format }: any = getModifiedFolderAndFormat();
                if (markdownView && file instanceof TFile && isDailyNote(file, folder, format)) {
                    this.app.fileManager.processFrontMatter(file, (frontmatter) => {
                        frontmatter[this.plugin.settings.ratingProp] = `${i + 1}/${this.maxValue}`;
                    });
                    this.plugin.setStatBarText(this.statBar, `${i + 1}/${this.maxValue}`);
                    this.close();
                }
            });
        }

        rating.addEventListener('mouseleave', (ev) => {
            for (let i = 0; i < this.maxValue; i++) {
                ratingStrokes[i].setText(setDefaultStroke(i + 1));
                ratingStrokes[i].className = setDefaultClass(i + 1);
            }
        })

        // const showSettings = new ToggleComponent(contentEl);
        const showSettingsText = contentEl.createEl('p', { cls: 'rating-show-settings-text' });
        const settings = contentEl.createDiv();

        if (this.settingsShown) {
            new Setting(settings)
                .setName('Maximum value')
                .setDesc('The maximum value the rating can have.')
                .addSlider((slider) =>
                    slider
                        .setLimits(1, 10, 1)
                        .setValue(this.maxValue)
                        .setDynamicTooltip()
                        .onChange((value) => {
                            this.maxValue = value;
                            this.onClose();
                            this.onOpen();
                        }));
            showSettingsText.setText('Hide settings');
        }
        else {
            showSettingsText.setText('Show settings');
            settings.empty();
        }

        /* function handleSettings() {
        };

        handleSettings(); */


        showSettingsText.onClickEvent((ev) => {
            this.settingsShown = !this.settingsShown;
            // handleSettings();

            if (this.settingsShown) {
                new Setting(settings)
                    .setName('Maximum value')
                    .setDesc('The maximum value the rating can have.')
                    .addSlider((slider) =>
                        slider
                            .setLimits(1, 10, 1)
                            .setValue(this.maxValue)
                            .setDynamicTooltip()
                            .onChange((value) => {
                                this.maxValue = value;
                                this.onClose();
                                this.onOpen();
                            }));
                showSettingsText.setText('Hide settings');
            }
            else {
                showSettingsText.setText('Show settings');
                settings.empty();
            }
        })

        /* showSettings.setValue(false)
            .setTooltip('Show extra settings')
            .onChange((value) => {
                if (value) {
                }
                else settings.empty();
            }) */


    }

    onClose() {
        const { contentEl } = this;
        let ratingStrokes: HTMLElement[] | null[] = [];
        for (let i = 0; i < this.maxValue; i++) {
            ratingStrokes[i] = document.getElementById(`rating-${i}`);
        }
        const rating = document.getElementById('rating');
        //remove event listeners here
        contentEl.empty();

    }
}