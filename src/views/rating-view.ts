import { App, MarkdownView, Modal, Setting, TFile, setIcon, normalizePath } from 'obsidian';
import { isDailyNote, getModifiedFolderAndFormat } from '../get-daily-notes';
import { DiarianSettings, RatingType, ratingTypeMap } from 'src/settings';
import type Diarian from 'src/main';
import { printToConsole, logLevel } from 'src/constants';

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

        const setDefaultStroke = (currentVal: number, element: HTMLElement) => {
            // If filled stroke
            if (currentVal < this.defaultVal)
                displayRating(this.plugin.settings, element, RatingStroke.filled, '')
            // return displayRating(this.plugin.settings).filled;
            // If empty stroke
            else
                displayRating(this.plugin.settings, element, RatingStroke.empty, 'text-faint')
            // return displayRating(this.plugin.settings).empty;
        }

        /* const setDefaultClass = (currentVal: number) => {
            // If filled stroke
            if (currentVal < this.defaultVal)
                return '';
            // If empty stroke
            else
                return 'text-faint';
        } */

        function strokeHover(i: number) {
            for (let ii = 0; ii < thisComp.maxValue; ii++) {
                if (ii <= i) {
                    /* ratingStrokes[ii].empty();
                    ratingStrokes[ii].append(displayRating(this.defaultVal, this.maxValue, this.plugin.settings).filled) */
                    displayRating(thisComp.plugin.settings, ratingStrokes[ii], RatingStroke.filled, 'text-accent');
                    /* ratingStrokes[ii].setText(displayRating(thisComp.plugin.settings).filled);
                    ratingStrokes[ii].className = 'text-accent'; */
                }
                else {
                    /* ratingStrokes[ii].empty();
                    ratingStrokes[ii].append(displayRating(this.defaultVal, this.maxValue, this.plugin.settings).empty); */
                    /* ratingStrokes[ii].setText(displayRating(thisComp.plugin.settings).empty);
                    ratingStrokes[ii].className = 'text-faint'; */
                    displayRating(thisComp.plugin.settings, ratingStrokes[ii], RatingStroke.empty, 'text-faint');
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

        let currentId: number | undefined;

        function getCurrentEl(ev: TouchEvent, func: Function) {
            // Get the current coordinates of the touch point
            const touchX = ev.touches[0].clientX;
            const touchY = ev.touches[0].clientY;

            // Get the current element at the touch point
            const newTarget = document.elementFromPoint(touchX, touchY);

            function resetID() {
                currentId = undefined;
                for (let i = 0; i < thisComp.maxValue; i++) {
                    setDefaultStroke(i, ratingStrokes[i]);
                }
            }

            if (newTarget) {
                let id: string | number = newTarget.id;
                /* if (newTarget.id === undefined || newTarget.id === null || newTarget.id === "") {
                    resetID();
                    return;
                } */

                if (id && id.startsWith('rating-'))
                    id = id.slice('rating-'.length);
                else if (newTarget.parentElement?.id.startsWith('rating-')) {
                    id = newTarget.parentElement.id.slice('rating-'.length);
                }
                else {
                    printToConsole(logLevel.warn, `Invalid id: ${id}`)
                    resetID();
                    return;
                }

                if (id == '0')
                    id = 0;
                else if (id)
                    id = Number.parseInt(id);

                if (typeof id === 'number') {
                    currentId = id;
                    func(id);
                }
                else {
                    resetID();
                }
            }
        }

        for (let i = 0; i < this.maxValue; i++) { // Create ratingStrokes
            // ratingStrokes[i] = rating.createEl('span', { text: setDefaultStroke(i), cls: setDefaultClass(i) });
            ratingStrokes[i] = rating.createSpan();
            setDefaultStroke(i, ratingStrokes[i]);
            // ratingStrokes[i] = rating.appendChild(setDefaultStroke(i));
            ratingStrokes[i].id = `rating-${i}`;
            ratingStrokes[i].addEventListener('mouseenter', (ev) => {
                // currentId = i;
                strokeHover(i);
            });
            ratingStrokes[i].addEventListener('touchstart', (ev) => {
                ev.preventDefault();
                currentId = i;
                strokeHover(i);
            });
            ratingStrokes[i].addEventListener('touchmove', (ev) => {
                getCurrentEl(ev, strokeHover);
            });

            ratingStrokes[i].addEventListener('mousedown', (ev) => {
                ev.preventDefault();
            });

            ratingStrokes[i].addEventListener('mouseup', (ev) => {
                // if (currentId !== undefined)
                endClick(i);
            });
            ratingStrokes[i].addEventListener('touchend', (ev) => {
                if (currentId !== undefined)
                    endClick(currentId);
                // getCurrentEl(ev, endClick);
            });
        }

        rating.addEventListener('mouseleave', (ev) => {
            for (let i = 0; i < this.maxValue; i++) {
                setDefaultStroke(i, ratingStrokes[i]);
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

export enum RatingStroke {
    filled = 'filled',
    empty = 'empty',
    combined = 'combined'
}

export function displayRating(settings: DiarianSettings, element: DocumentFragment | HTMLElement, type: RatingStroke, className: string, value?: number, maxValue?: number) {
    /* let filledItem;
    let emptyItem; */
    const app: App = this.app;

    const filledCombined = new DocumentFragment();
    const emptyCombined = new DocumentFragment();

    function setText(text: string, className: string, newValue?: number, combinedFrag?: DocumentFragment) {//
        if (element instanceof HTMLElement) {
            element.setText(text);
            element.removeClasses(['text-accent', 'text-faint']);
            if (className)
                element.addClass(className);
        }

        if (typeof newValue === 'number' && combinedFrag && type == RatingStroke.combined)
            combinedFrag.createEl('span', { text: text.repeat(newValue), cls: className });
    }

    function setImage(path: string, newValue?: number, combinedFrag?: DocumentFragment) {
        let source: string;
        const imgFile = app.vault.getFileByPath(normalizePath(path));
        if (imgFile)
            source = app.vault.getResourcePath(imgFile);
        else
            source = path;

        function appendImg(docFrag: DocumentFragment | HTMLElement) {
            docFrag.createEl('img', { cls: 'rating-stroke', attr: { src: source } });
        }

        if (element instanceof HTMLElement) {
            element.empty();
            appendImg(element);
        }

        /* const item = new DocumentFragment();
        appendImg(item); */

        if (combinedFrag && typeof newValue == 'number' && type == RatingStroke.combined)
            for (let i = 0; i < newValue; i++) {
                appendImg(combinedFrag);
            }

        // return item;
    }

    function setLucideIcon(icon: string, className: string, newValue?: number, combinedFrag?: DocumentFragment) {
        function appendIcon(docFrag: DocumentFragment, className?: string) {
            let cls = 'rating-stroke'
            if (className)
                cls += ' ' + className;
            const iconSpan = docFrag.createSpan({ cls: cls });
            setIcon(iconSpan, icon);
        }

        if (element instanceof HTMLElement) {
            element.empty();
            element.removeClasses(['text-accent', 'text-faint']);
            if (className)
                element.addClass(className);
            setIcon(element, icon);
        }
        /* const item = new DocumentFragment();
        appendIcon(item); */

        if (combinedFrag && typeof newValue === 'number' && type == RatingStroke.combined)
            for (let i = 0; i < newValue; i++) {
                appendIcon(combinedFrag, className);
            }

        /* return item; */
    }

    /* function setText(value: number, text: string, className: string, combinedFrag?: DocumentFragment) {
        filledCombined.createEl('span', { text: text.repeat(value), cls: className });

        const item = new DocumentFragment();
        item.createEl('span', { text: text, cls: className });
        return item;
    } */

    if (type == RatingStroke.combined || type == RatingStroke.filled) {
        const filledTypeMapped = ratingTypeMap[settings.filledType as RatingType];
        switch (filledTypeMapped) {
            case RatingType.text:
                setText(settings.filledText, ((type == RatingStroke.filled) ? className : 'text-accent'), value, filledCombined);
                // filledItem = setText(value, settings.filledText, 'text-accent', filledCombined);
                // filledItem = settings.filledText;
                // if (value)
                //     filledCombined.createEl('span', { text: (filledItem as string).repeat(value), cls: 'text-accent' });
                break;
            case RatingType.image:
                setImage(settings.filledImage, value, filledCombined);
                break;
            case RatingType.icon:
                setLucideIcon(settings.filledIcon, ((type == RatingStroke.filled) ? className : 'text-accent'), value, filledCombined);
                break;
            default:
                printToConsole(logLevel.error, `Cannot display rating:\n${settings.filledType} is not a valid filled RatingType!`);
        }
    }


    if (type == RatingStroke.combined || type == RatingStroke.empty) {
        const emptyTypeMapped = ratingTypeMap[settings.emptyType as RatingType];
        switch (emptyTypeMapped) {
            case RatingType.text:
                setText(settings.emptyText, ((type == RatingStroke.empty) ? className : 'text-faint'), ((maxValue && typeof value == 'number') ? maxValue - value : undefined), emptyCombined);
                // emptyItem = setText(maxValue - value, settings.emptyText, 'text-faint', emptyCombined);
                /* emptyItem = settings.emptyText;
                if (value && maxValue)
                    emptyCombined.createEl('span', { text: (emptyItem as string).repeat(maxValue - value), cls: 'text-faint' }); */
                break;
            case RatingType.image:
                setImage(settings.emptyImage, ((maxValue && typeof value == 'number') ? maxValue - value : undefined), emptyCombined);
                break;
            case RatingType.icon:
                setLucideIcon(settings.emptyIcon, ((type == RatingStroke.empty) ? className : 'text-faint'), ((maxValue && typeof value == 'number') ? maxValue - value : undefined), filledCombined);
                break;
            default:
                printToConsole(logLevel.error, `Cannot display rating:\n${settings.emptyType} is not a valid empty RatingType!`);
        }
    }

    if (type == RatingStroke.combined && element instanceof DocumentFragment) {
        element.append(filledCombined);
        element.append(emptyCombined);
    }

    /* return {
        filled: filledItem || new DocumentFragment,
        empty: emptyItem || new DocumentFragment
    } */
    /* return {
        filled: filledItem || '',
        empty: emptyItem || ''
    } */
}
