import { App, MarkdownView, Modal, Setting, TFile, setIcon } from 'obsidian';
import { isDailyNote, getModifiedFolderAndFormat } from '../get-daily-notes';
import { displayRating } from 'src/settings';
import type Diarian from 'src/main';

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
        const thisComp = this;

        let ratingStrokes: HTMLSpanElement[] = [];
        // const { filled, empty } = displayRating(this.defaultVal, this.maxValue, this.plugin.settings)

        const setDefaultStroke = (currentVal: number) => {
            // If filled stroke
            if (currentVal < this.defaultVal)
                return displayRating(this.plugin.settings).filled;
            // If empty stroke
            else
                return displayRating(this.plugin.settings).empty;
        }

        const setDefaultClass = (currentVal: number) => {
            // If filled stroke
            if (currentVal < this.defaultVal)
                return '';
            // If empty stroke
            else
                return 'text-faint';
        }

        function strokeHover(i: number) {
            for (let ii = 0; ii < thisComp.maxValue; ii++) {
                if (ii <= i) {
                    /* ratingStrokes[ii].empty();
                    ratingStrokes[ii].append(displayRating(this.defaultVal, this.maxValue, this.plugin.settings).filled) */
                    ratingStrokes[ii].setText(displayRating(thisComp.plugin.settings).filled);
                    ratingStrokes[ii].className = 'text-accent';
                }
                else {
                    /* ratingStrokes[ii].empty();
                    ratingStrokes[ii].append(displayRating(this.defaultVal, this.maxValue, this.plugin.settings).empty); */
                    ratingStrokes[ii].setText(displayRating(thisComp.plugin.settings).empty);
                    ratingStrokes[ii].className = 'text-faint';
                }
            }
        }

        function endClick(i: number) {
            let markdownView = thisComp.app.workspace.getActiveViewOfType(MarkdownView);
            const file = markdownView?.file;
            const { folder, format }: any = getModifiedFolderAndFormat();
            if (markdownView && file instanceof TFile && isDailyNote(file, folder, format)) {
                thisComp.app.fileManager.processFrontMatter(file, (frontmatter) => {
                    frontmatter[thisComp.plugin.settings.ratingProp] = `${i + 1}/${thisComp.maxValue}`;
                });
                thisComp.plugin.setStatBarText(thisComp.statBar, `${i + 1}/${thisComp.maxValue}`);
                thisComp.close();
            }
        }

        function getCurrentEl(ev: TouchEvent, func: Function) {
            // Get the current coordinates of the touch point
            const touchX = ev.touches[0].clientX;
            const touchY = ev.touches[0].clientY;

            // Get the current element at the touch point
            const newTarget = document.elementFromPoint(touchX, touchY);
            if (newTarget) {
                let id: string | number = newTarget.id.slice('rating-'.length);
                if (id == '0')
                    id = 0;
                else if (id)
                    id = Number.parseInt(id);

                if (typeof id === 'number')
                    func(id);
            }
        }

        for (let i = 0; i < this.maxValue; i++) {
            ratingStrokes[i] = rating.createEl('span', { text: setDefaultStroke(i), cls: setDefaultClass(i) });
            // ratingStrokes[i] = rating.appendChild(setDefaultStroke(i));
            ratingStrokes[i].id = `rating-${i}`;
            ratingStrokes[i].addEventListener('mouseenter', (ev) => {
                strokeHover(i);
            });
            ratingStrokes[i].addEventListener('touchstart', (ev) => {
                strokeHover(i);
            })
            ratingStrokes[i].addEventListener('touchmove', (ev) => {
                getCurrentEl(ev, strokeHover);
            })

            ratingStrokes[i].addEventListener('mouseup', (ev) => {
                endClick(i);
            });
            ratingStrokes[i].addEventListener('touchend', (ev) => {
                getCurrentEl(ev, endClick);
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


        function toggleSettings() {
            // console.log('got here');
            if (thisComp.settingsShown) {
                new Setting(settings)
                    .setName('Maximum value')
                    .setDesc('The maximum value the rating can have.')
                    .addSlider((slider) =>
                        slider
                            .setLimits(1, 10, 1)
                            .setValue(thisComp.maxValue)
                            .setDynamicTooltip()
                            .onChange((value) => {
                                thisComp.maxValue = value;
                                thisComp.onClose();
                                thisComp.onOpen();
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
            }//
        }

        toggleSettings();


        showSettingsEl.onClickEvent((ev) => {
            this.settingsShown = !this.settingsShown;
            // handleSettings();

            toggleSettings();
        })


    }

    onClose() {
        const { contentEl } = this;
        /* let ratingStrokes: HTMLElement[] | null[] = [];
        for (let i = 0; i < this.maxValue; i++) {
            ratingStrokes[i] = document.getElementById(`rating-${i}`);
        }
        const rating = document.getElementById('rating'); */
        //remove event listeners here
        contentEl.empty();

    }
}