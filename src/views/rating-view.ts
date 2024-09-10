import { App, MarkdownView, Modal, Setting, TFile, setIcon } from 'obsidian';
import { isDailyNote, getModifiedFolderAndFormat } from '../get-daily-notes';
import { displayRating } from 'src/settings';
import type Diarian from 'main';

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

        const rating = contentEl.createEl('p', { cls: 'rating' });
        rating.id = 'rating';

        let ratingStrokes: HTMLSpanElement[] = [];
        // const { filled, empty } = displayRating(this.defaultVal, this.maxValue, this.plugin.settings)

        const setDefaultStroke = (currentVal: number) => {
            // console.log(filled);
            // If filled stroke
            if (currentVal < this.defaultVal)
                return displayRating(this.defaultVal, this.maxValue, this.plugin.settings).filled;
            // If empty stroke
            else
                return displayRating(this.defaultVal, this.maxValue, this.plugin.settings).empty;
        }

        const setDefaultClass = (currentVal: number) => {
            // If filled stroke
            if (currentVal < this.defaultVal)
                return '';
            // If empty stroke
            else
                return 'text-faint';
        }


        for (let i = 0; i < this.maxValue; i++) {
            ratingStrokes[i] = rating.createEl('span', { text: setDefaultStroke(i), cls: setDefaultClass(i) });
            // ratingStrokes[i] = rating.appendChild(setDefaultStroke(i));
            ratingStrokes[i].id = `rating-${i}`;
            ratingStrokes[i].addEventListener('mouseenter', (ev) => {
                for (let ii = 0; ii < this.maxValue; ii++) {
                    if (ii <= i) {
                        /* ratingStrokes[ii].empty();
                        ratingStrokes[ii].append(displayRating(this.defaultVal, this.maxValue, this.plugin.settings).filled) */
                        ratingStrokes[ii].setText(displayRating(this.defaultVal, this.maxValue, this.plugin.settings).filled);
                        ratingStrokes[ii].className = 'text-accent';
                    }
                    else {
                        /* ratingStrokes[ii].empty();
                        ratingStrokes[ii].append(displayRating(this.defaultVal, this.maxValue, this.plugin.settings).empty); */
                        ratingStrokes[ii].setText(displayRating(this.defaultVal, this.maxValue, this.plugin.settings).empty);
                        ratingStrokes[ii].className = 'text-faint';
                    }
                }
            });
            ratingStrokes[i].onClickEvent((ev) => {
                let markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
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
            /* (ratingStrokes[i].firstChild as HTMLElement)?.onClickEvent((ev) => {
                console.log('got here');
                let markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
                const file = markdownView?.file;
                const { folder, format }: any = getModifiedFolderAndFormat();
                if (markdownView && file instanceof TFile && isDailyNote(file, folder, format)) {
                    this.app.fileManager.processFrontMatter(file, (frontmatter) => {
                        frontmatter[this.plugin.settings.ratingProp] = `${i + 1}/${this.maxValue}`;
                    });
                    this.plugin.setStatBarText(this.statBar, `${i + 1}/${this.maxValue}`);
                    this.close();
                }
            }); */
        }

        rating.addEventListener('mouseleave', (ev) => {
            for (let i = 0; i < this.maxValue; i++) {
                /* ratingStrokes[i].empty();
                ratingStrokes[i].append(setDefaultStroke(i)); */
                ratingStrokes[i].setText(setDefaultStroke(i));
                ratingStrokes[i].className = setDefaultClass(i);
            }
        })

        const showSettingsEl = contentEl.createEl('p', { cls: 'rating-show-settings-text' });

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
            //#region hideText
            const hideText = new DocumentFragment;
            const icon = hideText.createSpan({ cls: 'rating-settings-svg' });
            setIcon(icon, 'lucide-chevron-down');

            hideText.createEl('span', { text: 'Hide settings' });
            //#endregion
            showSettingsEl.setText(hideText);
        }
        else {

            //#region showText
            const showText = new DocumentFragment;
            const icon = showText.createSpan({ cls: 'rating-settings-svg' });
            setIcon(icon, 'lucide-chevron-right');

            showText.createEl('span', { text: 'Show settings' });
            //#endregion
            showSettingsEl.setText(showText);
            settings.empty();
        }


        showSettingsEl.onClickEvent((ev) => {
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
                //#region hideText
                const hideText = new DocumentFragment;
                const icon = hideText.createSpan({ cls: 'rating-settings-svg' });
                setIcon(icon, 'lucide-chevron-down');

                hideText.createEl('span', { text: 'Hide settings' });
                //#endregion
                showSettingsEl.setText(hideText);
            }
            else {

                //#region showText
                const showText = new DocumentFragment;
                const icon = showText.createSpan({ cls: 'rating-settings-svg' });
                setIcon(icon, 'lucide-chevron-right');

                showText.createEl('span', { text: 'Show settings' });
                //#endregion
                showSettingsEl.setText(showText);
                settings.empty();
            }
        })


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