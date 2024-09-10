import { App, MarkdownView, Modal, Setting, TFile } from 'obsidian';
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
        const { filled, empty } = displayRating(this.defaultVal, this.maxValue, this.plugin.settings)

        const setDefaultStroke = (currentVal: number) => {
            // console.log(filled);
            // If filled stroke
            if (currentVal <= this.defaultVal)
                return filled;
            // If empty stroke
            else
                return empty;
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
                        ratingStrokes[ii].setText(filled);
                        ratingStrokes[ii].className = 'text-accent';
                    }
                    else {
                        ratingStrokes[ii].setText(empty);
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
            const hideSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            hideSvg.setAttribute('width', '18');
            hideSvg.setAttribute('height', '18');
            hideSvg.setAttribute('viewBox', '0 0 24 24');
            hideSvg.setAttribute('fill', 'none');
            hideSvg.setAttribute('stroke', 'currentColor');
            hideSvg.setAttribute('stroke-width', '1.5');
            hideSvg.setAttribute('stroke-linecap', 'round');
            hideSvg.setAttribute('stroke-linejoin', 'round');
            hideSvg.setAttribute('class', 'lucide lucide-chevron-right');

            const hidePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            hidePath.setAttribute('d',
                'm6 9 6 6 6-6');


            // Append elements
            hideSvg.appendChild(hidePath);
            hideText.appendChild(hideSvg);

            hideText.createEl('span', { text: 'Hide settings' });
            //#endregion
            showSettingsEl.setText(hideText);
        }
        else {

            //#region showText
            const showText = new DocumentFragment;
            const showSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            showSvg.setAttribute('width', '18');
            showSvg.setAttribute('height', '18');
            showSvg.setAttribute('viewBox', '0 0 24 24');
            showSvg.setAttribute('fill', 'none');
            showSvg.setAttribute('stroke', 'currentColor');
            showSvg.setAttribute('stroke-width', '1.5');
            showSvg.setAttribute('stroke-linecap', 'round');
            showSvg.setAttribute('stroke-linejoin', 'round');
            showSvg.setAttribute('class', 'lucide lucide-chevron-right');

            const showPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            showPath.setAttribute('d',
                'm9 18 6-6-6-6');


            // Append elements
            showSvg.appendChild(showPath);
            showText.appendChild(showSvg);

            showText.createEl('span', { text: 'Show settings' });
            //#endregion
            showSettingsEl.setText(showText);
            settings.empty();
        }

        /* function handleSettings() {
        };

        handleSettings(); */


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
                const hideSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                hideSvg.setAttribute('width', '18');
                hideSvg.setAttribute('height', '18');
                hideSvg.setAttribute('viewBox', '0 0 24 24');
                hideSvg.setAttribute('fill', 'none');
                hideSvg.setAttribute('stroke', 'currentColor');
                hideSvg.setAttribute('stroke-width', '1.5');
                hideSvg.setAttribute('stroke-linecap', 'round');
                hideSvg.setAttribute('stroke-linejoin', 'round');
                hideSvg.setAttribute('class', 'lucide lucide-chevron-right');

                const hidePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                hidePath.setAttribute('d',
                    'm6 9 6 6 6-6');


                // Append elements
                hideSvg.appendChild(hidePath);
                hideText.appendChild(hideSvg);

                hideText.createEl('span', { text: 'Hide settings' });
                //#endregion
                showSettingsEl.setText(hideText);
            }
            else {

                //#region showText
                const showText = new DocumentFragment;
                const showSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                showSvg.setAttribute('width', '18');
                showSvg.setAttribute('height', '18');
                showSvg.setAttribute('viewBox', '0 0 24 24');
                showSvg.setAttribute('fill', 'none');
                showSvg.setAttribute('stroke', 'currentColor');
                showSvg.setAttribute('stroke-width', '1.5');
                showSvg.setAttribute('stroke-linecap', 'round');
                showSvg.setAttribute('stroke-linejoin', 'round');
                showSvg.setAttribute('class', 'lucide lucide-chevron-right');

                const showPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                showPath.setAttribute('d',
                    'm9 18 6-6-6-6');


                // Append elements
                showSvg.appendChild(showPath);
                showText.appendChild(showSvg);

                showText.createEl('span', { text: 'Show settings' });
                //#endregion
                showSettingsEl.setText(showText);
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