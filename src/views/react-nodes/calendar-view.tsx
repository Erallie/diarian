import { StrictMode, useState, useEffect } from "react";
import { App, ItemView, WorkspaceLeaf, TFile, View, moment } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar, OnArgs } from 'react-calendar';
import type Diarian from 'src/main';
import { getMoments, getNoteByMoment, isSameDay, getModifiedFolderAndFormat } from "src/get-daily-notes";
import NotePreview from './note-preview';
import { ViewType, printToConsole, logLevel } from 'src/constants';
import { NewDailyNote } from "./new-note";
import { convertCalType } from 'src/settings';

interface ContainerProps {
    view: View;
    plugin: Diarian;
    app: App;
    thisComp: CalendarView;
    monthStep: number;
}

interface ImageProps {
    filteredDates: moment.Moment[];
    folder: string;
    format: string;
    app: App;
    plugin: Diarian;
    bannerKey: string;
    rotationIndex: number;
}

export class CalendarView extends ItemView {
    root: Root | null = null;
    plugin: Diarian;
    app: App;
    startDate: Date;
    bannerKey: string;
    monthStep: number = 1;
    viewWidth: number | null = null;

    constructor(leaf: WorkspaceLeaf, plugin: Diarian, app: App) {
        super(leaf);
        this.plugin = plugin;
        this.app = app;
        this.startDate = new Date();
        this.bannerKey = getBannerProperty();
    }

    getViewType() {
        return ViewType.calendarView;
    }

    getDisplayText() {
        return "Calendar";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.icon = 'lucide-calendar';
        this.viewWidth = this.containerEl.getBoundingClientRect().width;

        if (this.viewWidth > 322) {
            this.monthStep = 1;
        }
        else if (this.viewWidth > 292) {
            this.monthStep = 2;
        }
        else if (this.viewWidth > 285) {
            this.monthStep = 3;
        }
        else {
            this.monthStep = 4;
        }

        this.root.render(
            <StrictMode>
                <CalendarContainer view={this} plugin={this.plugin} app={this.app} thisComp={this} monthStep={this.monthStep} />
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }

    onResize() {
        const width = this.containerEl.getBoundingClientRect().width;
        console.log(width); //

        let monthStepNew;

        if (width > 322) {
            monthStepNew = 1;
        }
        else if (width > 292) {
            monthStepNew = 2;
        }
        else if (width > 285) {
            monthStepNew = 3;
        }
        else {
            monthStepNew = 4;
        }

        if (monthStepNew != this.monthStep) {
            this.refresh(this.plugin)
        }
    }

    async refresh(plugin: Diarian, newDate?: Date) {
        this.plugin = plugin;
        this.bannerKey = getBannerProperty();
        if (newDate && newDate !== undefined) this.startDate = newDate;
        this.onClose();
        this.onOpen();
    }

}

const CalendarContainer = ({ view, plugin, app, thisComp, monthStep }: ContainerProps) => {
    const headingFormat = plugin.settings.headingFormat;
    const dailyNotes = plugin.dailyNotes;
    const bannerKey = thisComp.bannerKey;
    const { folder, format }: any = getModifiedFolderAndFormat(plugin.settings);
    const filledDates = getMoments(dailyNotes, folder, format);


    let maxDate: Date | undefined = new Date();
    const today = moment(maxDate);
    if (plugin.settings.disableFuture == false) maxDate = undefined;

    const [selectedDate, innerSetDate] = useState(thisComp.startDate);
    const [rotationIndex, setRotationIndex] = useState(0);

    useEffect(() => {
        if (!plugin.settings.calRotateImages) {
            setRotationIndex(0);
            return;
        }

        const intervalSeconds = Math.max(1, plugin.settings.calImageRotationInterval);
        const intervalId = window.setInterval(() => {
            setRotationIndex(currentIndex => currentIndex + 1);
        }, intervalSeconds * 1000);

        return () => window.clearInterval(intervalId);
    }, [plugin.settings.calRotateImages, plugin.settings.calImageRotationInterval]);

    function tileClassName({ date, view }: any) {
        // Add class to tiles in month view only
        if (view === 'month') {
            // Check if a date React-Calendar wants to check is on the list of dates to add class to
            if (filledDates.find(dDate => isSameDay(moment(date), dDate))) {
                return 'filled-date';
            }
            else if (isSameDay(moment(date), today)) { //DON'T KNOW IF I NEED THIS
                return 'react-calendar__tile--now';
            }
            else {
                return 'react-calendar__tile';
            }
        }
        else {
            return 'react-calendar__tile';
        }
    }
    function outerSetDate(nextDate: Date) {
        innerSetDate(nextDate);
        thisComp.startDate = nextDate;
    }

    function tileContent({ date, view }: any) {
        if (view === 'month') {
            let filteredDates: moment.Moment[] = [];
            if ((filteredDates = filledDates.filter(
                dDate => isSameDay(moment(date), dDate)))
                .length !== 0) {
                let content: any = [];
                let i = 0;
                for (let date of filteredDates) {
                    content[i] = {
                        id: i,
                        date: date
                    }
                    i++;
                }

                const Dots = () => content.map((innerContent: any) =>
                    <span key={innerContent.id} className='calendar-dot'>
                        •
                    </span>
                );


                /*
                if (imgPath != '') {
                    return (
                        <div className='dot-container'>
                            <Dots />
                            <img src={imgPath} className='calendar-attachment' />
                        </div>
                    )
                }
                else
                    return (
                        <div className='dot-container'>
                            <Dots />
                        </div>
                    ) */

                return (
                    <>
                        <div className='dot-container'>
                            <Dots />
                        </div>
                        <Image filteredDates={filteredDates} folder={folder} format={format} app={app} plugin={plugin} bannerKey={bannerKey} rotationIndex={rotationIndex} />
                    </>
                )
            }

        }
    }

    let filteredDates = [];
    let showNotesNode;
    if ((filteredDates = filledDates.filter(
        dDate => isSameDay(moment(selectedDate), dDate)))
        .length !== 0) {

        const { folder, format }: any = getModifiedFolderAndFormat(plugin.settings);

        let i = 0;
        let notesToShow: any = [];
        for (let date of filteredDates) {
            let note: TFile = getNoteByMoment(date, folder, format);
            notesToShow[i] = {
                note: note,
                id: i
            };
            i++;
        }

        showNotesNode = notesToShow.map((note: any) =>
            <div key={note.name}>
                <NotePreview note={note.note} view={view} plugin={plugin} app={app} />
            </div>
        );
    }
    else {
        showNotesNode = <p>There are no notes on this day.</p>;
    }

    function newDailyNote() {
        new NewDailyNote(app, plugin, moment(selectedDate)).open();
    }

    const [navLabel, setNavLabel] = useState('Show months');
    const [jumpAmount, setJumpAmount] = useState(' a year');

    function onViewChange({ view }: OnArgs) {
        switch (view) {
            case 'month':
                setNavLabel('Show months');
                setJumpAmount(' a year');
                break;
            case 'year':
                setNavLabel('Show years');
                setJumpAmount(' a decade');
                break;
            case 'decade':
                setNavLabel('Show decades');
                setJumpAmount(' a century');
                break;
            case 'century':
                setNavLabel('Cannot jump further out');
                setJumpAmount('');
                break;
            default:
                printToConsole(logLevel.warn, 'Cannot set navigationAriaLabel:\nview is not properly defined!')
        }
    }

    function formatMonthYear(locale: string | undefined, date: Date) {
        const width = view.containerEl.getBoundingClientRect().width;
        switch (monthStep) {
            case 1:
                return moment(date).format('MMMM YYYY');
            case 2:
                return moment(date).format('MMM YYYY');
            case 3:
                return moment(date).format('M/YYYY');
            case 4:
                return moment(date).format('M/YY');
            default:
                return moment(date).format('MMMM YYYY')
        }
    }

    const jumpLabel = (jumpType: string) => {
        switch (jumpType) {
            case 'next':
                return 'Jump ahead' + jumpAmount;
            case 'prev':
                return 'Jump back' + jumpAmount;
            default:
                printToConsole(logLevel.warn, 'Cannot set next2AriaLabel or prev2AriaLabel:\njumpType is not properly defined!')
                return '';
        }
    }

    function jumpToToday() {
        thisComp.refresh(plugin, new Date());
    }

    function refresh() {
        thisComp.refresh(plugin);
    }

    const calType = convertCalType[plugin.settings.calendarType];
    return (
        <div className='calendar-container'>
            <div className='calendar-custom-buttons'>
                <button onClick={jumpToToday} aria-label='Jump to today' className='today-cal-button' >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-clock"
                    >
                        <circle cx={12} cy={12} r={10} />
                        <path d="M12 6L12 12 16 14" />
                    </svg></button>
                <button onClick={refresh} aria-label='Refresh calendar' className='refresh-cal-button' >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-refresh-ccw"
                    >
                        <path d="M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                        <path d="M3 3v5h5M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                    </svg></button>
            </div>
            <Calendar onClickDay={outerSetDate} onViewChange={onViewChange} navigationAriaLabel={navLabel} next2AriaLabel={jumpLabel('next')} nextAriaLabel='Next' prev2AriaLabel={jumpLabel('prev')} prevAriaLabel='Previous' calendarType={calType} maxDate={maxDate} value={selectedDate} tileClassName={tileClassName} tileContent={tileContent} formatMonthYear={formatMonthYear} />
            <div className='cal-date-heading-container'>
                <h1>{moment(selectedDate).format(headingFormat)}</h1>
                <button onClick={newDailyNote} className='cal-new-note-button' aria-label='Create new daily note' >
                    {/* <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg> */}
                    {/* <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file-plus-2"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M3 15h6" /><path d="M6 12v6" /></svg> */}
                    {/* <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-file-plus"
                    >
                        <path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7z" />
                        <path d="M14 2v4a2 2 0 002 2h4M9 15h6M12 18v-6" />
                    </svg> */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={18}
                        height={18}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-plus"
                    >
                        <path d="M5 12h14M12 5v14" />
                    </svg>
                    {/* {' '}Create new daily note */}</button>
            </div>
            <div className='note-preview-container'>
                {showNotesNode}
            </div>
        </div>
    )
};

const Image = ({ filteredDates, folder, format, app, plugin, bannerKey, rotationIndex }: ImageProps) => {
    const [imagePaths, setImagePaths] = useState<string[]>([]);

    useEffect(() => {
        let cancelled = false;

        const resolveImagePath = (imagePath: string, thisNote: TFile) => {
            const imageFile = app.metadataCache.getFirstLinkpathDest(imagePath, thisNote.path);
            return imageFile ? app.vault.getResourcePath(imageFile) : null;
        };

        const addUniqueImage = (paths: string[], imagePath: string | null) => {
            if (imagePath && !paths.includes(imagePath)) {
                paths.push(imagePath);
            }
        };

        const getWikiLinkImages = (value: string, thisNote: TFile, regex: RegExp) => {
            const paths: string[] = [];
            let match: RegExpExecArray | null;

            regex.lastIndex = 0;
            while ((match = regex.exec(value)) !== null) {
                addUniqueImage(paths, resolveImagePath(match[1], thisNote));
            }

            return paths;
        };

        const getMarkdownImages = (value: string, thisNote: TFile) => {
            const paths: string[] = [];
            const markdownImageRegex = /!\[[^\]]*]\(([^)]+\.(?:avif|bmp|gif|jpeg|jpg|png|svg|webp)(?:\?[^)]*)?)\)/gi;
            let match: RegExpExecArray | null;

            while ((match = markdownImageRegex.exec(value)) !== null) {
                const rawPath = match[1].trim().replace(/^<|>$/g, '');
                const localPath = resolveImagePath(decodeURIComponent(rawPath), thisNote);
                addUniqueImage(paths, localPath ?? rawPath);
            }

            return paths;
        };

        const loadImagePaths = async () => {
            const paths: string[] = [];

            for (const date of filteredDates) {
                const thisNote = getNoteByMoment(date, folder, format);
                const cache = app.metadataCache.getCache(thisNote.path);
                const bannerValue = bannerKey
                    ? cache?.frontmatter?.[bannerKey]
                    : undefined;

                if (!plugin.settings.calDisableBanners && typeof bannerValue === 'string') {
                    const bannerImages = getWikiLinkImages(
                        bannerValue,
                        thisNote,
                        /!?\[\[([^*"<>:|?#^[\]]+\.(?:avif|bmp|gif|jpeg|jpg|png|svg|webp))(?:[|#](?:(?!\[\[|]]).)*)*]]/gi
                    );

                    if (bannerImages.length > 0) {
                        bannerImages.forEach(path => addUniqueImage(paths, path));
                    }
                    else {
                        addUniqueImage(paths, bannerValue);
                    }
                }

                const content = await app.vault.cachedRead(thisNote);
                let wikiImageRegex = /!\[\[([^*"<>:|?#^[\]]+\.(?:avif|bmp|gif|jpeg|jpg|png|svg|webp))(?:[|#](?:(?!\[\[|]]).)*)?]]/gi;
                const classes = cache?.frontmatter?.['cssclasses'];
                const hasCSSBanner = Array.isArray(classes) && classes.includes('banner');

                if (hasCSSBanner && plugin.settings.calDisableBanners) {
                    wikiImageRegex = /!\[\[([^*"<>:|?#^[\]]+\.(?:avif|bmp|gif|jpeg|jpg|png|svg|webp))(?:#(?:(?!\[\[|]]|\|).)*)?(?!\|banner)(?:\|(?:(?!\[\[|]]).)*)?]]/gi;
                }

                getWikiLinkImages(content, thisNote, wikiImageRegex)
                    .forEach(path => addUniqueImage(paths, path));
                getMarkdownImages(content, thisNote)
                    .forEach(path => addUniqueImage(paths, path));

                if (!plugin.settings.calRotateImages && paths.length > 0) {
                    break;
                }
            }

            if (!cancelled) {
                setImagePaths(plugin.settings.calRotateImages ? paths : paths.slice(0, 1));
            }
        };

        void loadImagePaths();

        return () => {
            cancelled = true;
        };
    }, [filteredDates, folder, format, app, plugin, bannerKey]);

    if (imagePaths.length === 0) {
        return (<></>);
    }

    const imageIndex = plugin.settings.calRotateImages
        ? rotationIndex % imagePaths.length
        : 0;

    return (
        <img src={imagePaths[imageIndex]} className='calendar-attachment' />
    );
}

export function getBannerProperty() {
    /* from: https://github.com/liamcain/obsidian-daily-notes-interface/blob/123969e461b7b0927c91fe164a77da05f43aba6a/src/settings.ts#L22 */
    try {
        const pluginManager = (this.app).plugins;

        const settings =
            pluginManager.getPlugin("obsidian-banners")?.settings || {};

        if (!settings.frontmatterField || settings.frontmatterField === undefined || settings.frontmatterField == '') {
            printToConsole(logLevel.info, 'No frontmatter field name found in any custom Banner settings!', true);
            return 'banner';
        }

        return settings.frontmatterField as string;
    } catch (err) {
        const errorText = "No custom Banner settings found!"
        printToConsole(logLevel.info, `${errorText}\n${err}`, true);
        return '';
    }
}