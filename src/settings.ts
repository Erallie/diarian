import { App, PluginSettingTab, Setting, Platform } from 'obsidian';
import type Diarian from 'main';
import { Unit, getTimeSpanTitle, printToConsole, logLevel } from './constants';
import { getAllDailyNotes, getModifiedFolderAndFormat } from './get-daily-notes';
import moment from 'moment';


//#region constants
//#region enums & values
export enum CalType {
    /* gregory = 'gregory',
    hebrew = 'hebrew',
    islamic = 'islamic',
    iso8601 = 'iso8601' */
    gregory = 'Gregorian',
    hebrew = 'Hebrew',
    islamic = 'Islamic',
    iso8601 = 'ISO 8601'
}

export enum CalendarType {
    /* gregory = 'gregory',
    hebrew = 'hebrew',
    islamic = 'islamic',
    iso8601 = 'iso8601' */
    gregory = 'gregory',
    hebrew = 'hebrew',
    islamic = 'islamic',
    iso8601 = 'iso8601'
}


export const calendarTypeMap: { [key: string]: CalType } = {
    gregory: CalType.gregory,
    hebrew: CalType.hebrew,
    islamic: CalType.islamic,
    iso8601: CalType.iso8601
};

export const convertCalType: { [key: string]: CalendarType } = {
    gregory: CalendarType.gregory,
    hebrew: CalendarType.hebrew,
    islamic: CalendarType.islamic,
    iso8601: CalendarType.iso8601
};

export enum LeafType {
    tab = 'Tab',
    right = 'Right sidebar',
    left = 'Left sidebar'
};


export const leafTypeMap: { [key: string]: LeafType } = {
    tab: LeafType.tab,
    right: LeafType.right,
    left: LeafType.left
};

const getMaxTimeSpan = (unit: Unit) => {
    switch (unit) {
        case Unit.day:
            return 31;
        case Unit.week:
            return 52;
        case Unit.month:
            return 24;
        case Unit.year:
            return 100;
    }
};

export enum NotifType {
    none = 'None',
    modal = 'Pop-up modal',
    notice = 'Notice'
}

export const notifTypeMap: { [key: string]: NotifType } = {
    none: NotifType.none,
    modal: NotifType.modal,
    notice: NotifType.notice
};

export interface NotifInfo {
    lastNotified: moment.Moment;
    needToRemind: boolean;
    reminderTime?: moment.Moment;
}

export const DEFAULT_NOTIF_INFO: NotifInfo = {
    lastNotified: moment().subtract(1, 'day'),
    needToRemind: false,
}

export enum ReminderDelay {
    fiveMin = 'In 5 minutes',
    tenMin = 'In 10 minutes',
    thirtyMin = 'In 30 minutes',
    oneHr = 'In 1 hour',
    twoHr = 'In 2 hours'
}

export const reminderDelayMap: { [key: string]: ReminderDelay } = {
    fiveMin: ReminderDelay.fiveMin,
    tenMin: ReminderDelay.tenMin,
    thirtyMin: ReminderDelay.thirtyMin,
    oneHr: ReminderDelay.oneHr,
    twoHr: ReminderDelay.twoHr
};
//#endregion

//#region Setting defaults
export interface DiarianSettings {
    calendarType: CalType;
    disableFuture: boolean;
    headingFormat: string;
    calLocation: LeafType;
    calStartup: boolean;

    previewLength: number;
    openInNewPane: boolean;
    useCallout: boolean;
    showNoteTitle: boolean;
    useQuote: boolean;

    reviewInterval: number;
    reviewIntervalUnit: Unit;
    reviewDelay: number;
    reviewDelayUnit: Unit;
    revNotifType: NotifType;
    notifInfo: NotifInfo;

    onThisDayLoc: LeafType;
    onThisDayStartup: boolean;

    dateStampFormat: string;
    timeStampFormat: string;

    defaultMaxRating: number;
    ratingProp: string;
    filledStroke: string;
    emptyStroke: string;

}

export const DEFAULT_SETTINGS: DiarianSettings = {
    calendarType: 'iso8601' as CalType,
    disableFuture: false,
    headingFormat: 'dddd, MMMM Do, YYYY',
    calLocation: 'tab' as LeafType.tab,
    calStartup: false,

    previewLength: 250,
    openInNewPane: false,
    useCallout: true,
    showNoteTitle: true,
    useQuote: true,

    reviewInterval: 3,
    reviewIntervalUnit: Unit.month,
    reviewDelay: 6,
    reviewDelayUnit: Unit.month,
    revNotifType: 'none' as NotifType,
    notifInfo: DEFAULT_NOTIF_INFO,

    onThisDayLoc: 'right' as LeafType,
    onThisDayStartup: false,

    dateStampFormat: 'M/D/YYYY',
    timeStampFormat: 'h:mm A',

    defaultMaxRating: 5,
    ratingProp: 'daily rating',
    filledStroke: '★',
    emptyStroke: '☆'

}
//#endregion

//#endregion

export class DiarianSettingTab extends PluginSettingTab {
    plugin: Diarian;

    constructor(app: App, plugin: Diarian) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        // new Setting(containerEl).setName('On startup').setHeading();

        //#region Calendar
        new Setting(containerEl).setName('Calendar').setHeading();

        //#region Calendar type
        const calTypeDesc = new DocumentFragment;
        calTypeDesc.textContent = 'The type of calendar that will be displayed.';
        calTypeDesc.createEl('br');
        calTypeDesc.createEl('span', { text: 'This will affect the starting weekday. Currently, the week starts on ' })/* .createEl('br');
        calTypeDesc.createEl('span', { text: "Currently, the week starts on " }) */;
        const startWeekday = calTypeDesc.createSpan({ cls: 'text-accent' });
        calTypeDesc.createEl('span', { text: '.' });


        function setWeekdayText(value: string) {
            const mappedCalType = calendarTypeMap[value as CalType];
            switch (mappedCalType) {
                case CalType.gregory:
                    startWeekday.textContent = 'Sunday'
                    break;
                case CalType.hebrew:
                    startWeekday.textContent = 'Sunday'
                    break;
                case CalType.islamic:
                    startWeekday.textContent = 'Saturday'
                    break;
                case CalType.iso8601:
                    startWeekday.textContent = 'Monday'
                    break;
            }
        }

        setWeekdayText(this.plugin.settings.calendarType);

        new Setting(containerEl)
            .setName('Calendar type')
            .setDesc(calTypeDesc)
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(CalType)
                    .setValue(this.plugin.settings.calendarType)
                    .onChange((value) => {
                        this.plugin.settings.calendarType = value as CalType;
                        void this.plugin.saveSettings();
                        this.plugin.refreshViews(true, false);
                        setWeekdayText(value);
                        // this.display();
                    }));

        //#endregion

        //#region Disable future dates
        const disableFutureDesc = new DocumentFragment;
        disableFutureDesc.textContent = 'Disable accessing future dates in the ';
        disableFutureDesc.createEl('strong', { text: "Calendar" });
        disableFutureDesc.createEl('span', { text: " view." });

        new Setting(containerEl)
            .setName('Disable future dates')
            .setDesc(disableFutureDesc)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.disableFuture).onChange((value) => {
                    this.plugin.settings.disableFuture = value;
                    void this.plugin.saveSettings();
                    this.plugin.refreshViews(true, false);
                }));

        //#endregion

        //#region Heading format
        const headingFormatDesc = new DocumentFragment();
        headingFormatDesc.textContent =
            "The ";
        headingFormatDesc.createEl("a", {
            text: "moment.js",
            attr: {
                href: "https://momentjs.com/docs/#/displaying/format/",
            },
        });
        headingFormatDesc.createEl("span", { text: " format for headings in the " })
            .createEl('strong', { text: "Calendar" });
        headingFormatDesc.createEl('span', { text: " view." })
            .createEl("br");
        const headingFormatContainer = headingFormatDesc.createEl('span', { text: 'Headings will appear as: ' });
        const headingFormat = headingFormatContainer.createSpan({ cls: 'text-accent' });

        new Setting(containerEl)
            .setName('Heading format')
            .setDesc(headingFormatDesc)
            .addMomentFormat(text => text
                .setDefaultFormat(DEFAULT_SETTINGS.headingFormat)
                .setValue(this.plugin.settings.headingFormat)
                .setSampleEl(headingFormat)
                .onChange(async (value) => {
                    this.plugin.settings.headingFormat = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews(true, false);
                }));

        //#endregion

        //#region Calendar location
        const calLocDesc = new DocumentFragment;
        calLocDesc.textContent = 'The location the  ';
        calLocDesc.createEl('strong', { text: "Calendar" });
        calLocDesc.createEl('span', { text: " view will open in." });

        new Setting(containerEl)
            .setName('Leaf location')
            .setDesc(calLocDesc)
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(LeafType)
                    .setValue(this.plugin.settings.calLocation)
                    .onChange((value) => {
                        this.plugin.settings.calLocation = value as LeafType;
                        void this.plugin.saveSettings();
                        // this.plugin.refreshViews(true, false);
                        // this.display();
                    }));

        //#endregion

        //#region Open on startup
        /* const openCalName = new DocumentFragment;
        openCalName.textContent = 'Open ';
        openCalName.createEl('strong', { text: "Calendar" });
        openCalName.createEl('span', { text: ' on startup' }); */

        const openCalDesc = new DocumentFragment;
        openCalDesc.textContent = 'Open the ';
        openCalDesc.createEl('strong', { text: "Calendar" });
        openCalDesc.createEl('span', { text: " view on startup." });

        new Setting(containerEl)
            .setName('Open on startup')
            .setDesc(openCalDesc)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.calStartup).onChange((value) => {
                    this.plugin.settings.calStartup = value;
                    void this.plugin.saveSettings();
                }));
        //#endregion

        //#endregion

        //#region On this day
        new Setting(containerEl).setName('On this day').setHeading();

        //#region Review interval
        const intervalDescription = new DocumentFragment();
        intervalDescription.textContent =
            "Notes will be displayed in intervals of this amount of time before the current day.";
        intervalDescription.createEl("br");
        /* intervalDescription.createEl('span', { text: 'For example, if this is set to every 3 months, notes will be displayed from 3 months ago, 6 months ago, 9 months ago, and so on.' }).createEl('br'); */
        intervalDescription.createEl('span', { text: 'Currently set to ' }).createEl("span", {
            text: "every " + getTimeSpanTitle(this.plugin.settings.reviewInterval, this.plugin.settings.reviewIntervalUnit), cls: 'text-accent'

        });

        new Setting(containerEl)
            .setName('Review interval')
            .setDesc(intervalDescription)
            .addSlider((slider) =>
                slider
                    .setValue(this.plugin.settings.reviewInterval)
                    .setLimits(1, (getMaxTimeSpan(this.plugin.settings.reviewIntervalUnit)), 1)
                    .setDynamicTooltip()
                    .onChange(
                        /* debounce(
                            (value) => {
                                this.plugin.settings.timeSpans[index].number = value;
                                void this.plugin.saveSettings();
                                this.display();
                            },
                            DEBOUNCE_DELAY,
                            true,
                        ), */
                        async (value) => {
                            this.plugin.settings.reviewInterval = value;
                            await this.plugin.saveSettings();
                            this.plugin.refreshViews(false, true);
                            this.display();
                        }
                    ),
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(Unit)
                    .setValue(this.plugin.settings.reviewIntervalUnit)
                    .onChange((value) => {
                        this.plugin.settings.reviewIntervalUnit = value as Unit;
                        void this.plugin.saveSettings();
                        this.plugin.refreshViews(false, true);
                        this.display();
                    }),
            );
        //#endregion

        //#region Review delay
        const delayDescription = new DocumentFragment();
        delayDescription.textContent =
            "Only notes from this long ago or earlier will be included in the ";
        delayDescription.createEl('strong', { text: "On this day" });
        delayDescription.createEl('span', { text: " view." });
        delayDescription.createEl("br");
        delayDescription.createEl('span', { text: 'Currently set to ' }).createEl("span", {
            text: getTimeSpanTitle(this.plugin.settings.reviewDelay, this.plugin.settings.reviewDelayUnit) + " ago or earlier", cls: 'text-accent'

        });

        new Setting(containerEl)
            .setName('Review delay')
            .setDesc(delayDescription)
            .addSlider((slider) =>
                slider
                    .setValue(this.plugin.settings.reviewDelay)
                    .setLimits(1, (getMaxTimeSpan(this.plugin.settings.reviewDelayUnit)), 1)
                    .setDynamicTooltip()
                    .onChange(
                        /* debounce(
                            (value) => {
                                this.plugin.settings.timeSpans[index].number = value;
                                void this.plugin.saveSettings();
                                this.display();
                            },
                            DEBOUNCE_DELAY,
                            true,
                        ), */
                        async (value) => {
                            this.plugin.settings.reviewDelay = value;
                            await this.plugin.saveSettings();
                            this.plugin.refreshViews(false, true);
                            this.display();
                        }
                    ),
            )
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(Unit)
                    .setValue(this.plugin.settings.reviewDelayUnit)
                    .onChange((value) => {
                        this.plugin.settings.reviewDelayUnit = value as Unit;
                        void this.plugin.saveSettings();
                        this.plugin.refreshViews(false, true);
                        this.display();
                    }),
            );

        //#endregion

        //#region Notification
        const revNotifTypeDesc = new DocumentFragment;
        revNotifTypeDesc.textContent = 'Receive a notification via this method when there are notes from ';
        revNotifTypeDesc.createEl('strong', { text: "On this day" });
        revNotifTypeDesc.createEl('span', { text: " to review." });

        new Setting(containerEl)
            .setName('Notifications')
            .setDesc(revNotifTypeDesc)
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(NotifType)
                    .setValue(this.plugin.settings.revNotifType)
                    .onChange((value) => {
                        this.plugin.settings.revNotifType = value as NotifType;
                        void this.plugin.saveSettings();
                        // this.plugin.refreshViews(false, true);
                        this.display();
                    }));
        //#endregion

        //#region On this day location
        const onThisDayLocDesc = new DocumentFragment;
        onThisDayLocDesc.textContent = 'The location the  ';
        onThisDayLocDesc.createEl('strong', { text: "On this day" });
        onThisDayLocDesc.createEl('span', { text: " view will open in." });

        new Setting(containerEl)
            .setName('Leaf location')
            .setDesc(onThisDayLocDesc)
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(LeafType)
                    .setValue(this.plugin.settings.onThisDayLoc)
                    .onChange((value) => {
                        this.plugin.settings.onThisDayLoc = value as LeafType;
                        void this.plugin.saveSettings();
                        // this.plugin.refreshViews(false, true);
                        // this.display();
                    }));

        //#endregion

        //#region Open on startup
        /* const openOnThisDayName = new DocumentFragment;
        openOnThisDayName.textContent = 'Open ';
        openOnThisDayName.createEl('strong', { text: "On this day" });
        openOnThisDayName.createEl('span', { text: ' on startup' }); */

        const openOnThisDayDesc = new DocumentFragment;
        openOnThisDayDesc.textContent = 'Open the ';
        openOnThisDayDesc.createEl('strong', { text: "On this day" });
        openOnThisDayDesc.createEl('span', { text: " view on startup." });


        new Setting(containerEl)
            .setName('Open on startup')
            .setDesc(openOnThisDayDesc)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.onThisDayStartup).onChange((value) => {
                    this.plugin.settings.onThisDayStartup = value;
                    void this.plugin.saveSettings();
                }));

        //#endregion

        //#endregion

        //#region Note previews
        new Setting(containerEl).setName('Note previews')/* .setDesc('Settings that will apply to note previews in the Calendar view and the \'On this day\' view.') */.setHeading();

        new Setting(containerEl)
            .setName("Display note name")
            .setDesc(
                "Render the note name above the preview text when showing note previews.",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showNoteTitle)
                    .onChange((value) => {
                        this.plugin.settings.showNoteTitle = value;
                        void this.plugin.saveSettings();
                        this.plugin.refreshViews(true, true);
                    }),
            );

        new Setting(containerEl)
            .setName('Preview length')
            .setDesc('The maximum number of characters of content a note preview should display.')
            .addSlider(slider => slider
                .setLimits(0, 1000, 10)
                .setValue(this.plugin.settings.previewLength)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.previewLength = value;
                    await this.plugin.saveSettings();
                    this.plugin.refreshViews(true, true);
                })
            )

        //#region Callouts
        const calloutsDescription = new DocumentFragment();
        /* calloutsDescription.textContent =
            "Use callouts to render note previews, using their styles based on the current theme. ";
        calloutsDescription.createEl("a", {
            text: "More info",
            attr: {
                href: "https://help.obsidian.md/Editing+and+formatting/Callouts",
            },
        }); */


        calloutsDescription.textContent =
            "Use ";
        calloutsDescription.createEl("a", {
            text: "callouts",
            attr: {
                href: "https://help.obsidian.md/Editing+and+formatting/Callouts",
            },
        });
        calloutsDescription.createEl("span", {
            text: " to render note previews, using their styles based on the current theme."
        })

        new Setting(containerEl)
            .setName("Use callouts to display content")
            .setDesc(calloutsDescription)
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.useCallout).onChange((value) => {
                    this.plugin.settings.useCallout = value;
                    void this.plugin.saveSettings();
                    this.plugin.refreshViews(true, true);
                    this.display();
                }),
            );

        //#endregion

        if (!this.plugin.settings.useCallout) {
            new Setting(containerEl)
                .setName("Use quote elements to display content")
                .setDesc("Format note previews using the HTML quote element.")
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.useQuote).onChange((value) => {
                        this.plugin.settings.useQuote = value;
                        void this.plugin.saveSettings();
                        this.plugin.refreshViews(true, true);
                    }),
                );
        }

        //#region New Tab
        let notePaneTitle = 'Open in a new tab';

        const notePaneDesc = new DocumentFragment();
        notePaneDesc.textContent =
            "When clicked, notes will open in a new tab when possible";
        if (Platform.isDesktop) {
            notePaneDesc.createEl('span', { text: ' by default.' })
            notePaneDesc.createEl("br");
            notePaneDesc.createEl('span', { text: 'Middle-clicking a note will ' }).createEl('em', { text: 'always' });
            notePaneDesc.createEl('span', { text: ' open it in a new tab regardless of this setting.' });
        }
        else {
            notePaneDesc.createEl('span', { text: '.' })
        }
        new Setting(containerEl)
            .setName(notePaneTitle)
            .setDesc(notePaneDesc)
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.openInNewPane)
                    .onChange((value) => {
                        this.plugin.settings.openInNewPane = value;
                        void this.plugin.saveSettings();
                    });
            });

        //#endregion

        //#endregion

        //#region Timestamps
        new Setting(containerEl).setName('Timestamps').setHeading();

        //#region Setup
        const dateStampDesc = new DocumentFragment();
        dateStampDesc.textContent =
            "The ";
        dateStampDesc.createEl("a", {
            text: "moment.js",
            attr: {
                href: "https://momentjs.com/docs/#/displaying/format/",
            },
        });
        dateStampDesc.createEl("span", { text: " format for the date part of timestamps." });

        const timeStampDesc = new DocumentFragment();
        timeStampDesc.textContent =
            "The ";
        timeStampDesc.createEl("a", {
            text: "moment.js",
            attr: {
                href: "https://momentjs.com/docs/#/displaying/format/",
            },
        });
        timeStampDesc.createEl("span", { text: " format for the time part of timestamps." });


        const dateStampSetting = new Setting(containerEl)
            .setName('Date format')
            .setDesc(dateStampDesc);

        const timeStampSetting = new Setting(containerEl)
            .setName('Time format')
            .setDesc(timeStampDesc);


        /* containerEl.createEl('span', { text: 'Timestamps will appear as:'}).createEl('br');
        const timeStampFormatContainer = containerEl.createEl('span', { text: '— ', cls: 'text-accent' });
        const dateStampFormat = timeStampFormatContainer.createSpan({ cls: 'text-accent' });
        timeStampFormatContainer.createEl('span', { text: ' ', cls: 'text-accent' });
        const timeStampFormat = timeStampFormatContainer.createSpan({ cls: 'text-accent' });
        timeStampFormatContainer.createEl('span', { text: ' —', cls: 'text-accent' }); */



        const timeStampPreview = new DocumentFragment();

        timeStampPreview.textContent = 'Timestamps will appear as:';
        timeStampPreview.createEl('br');
        const timeStampFormatContainer = timeStampPreview.createEl('span', { text: '— ', cls: 'text-accent' });
        const dateStampFormat = timeStampFormatContainer.createSpan({ cls: 'text-accent' });
        timeStampFormatContainer.createEl('span', { text: ' ', cls: 'text-accent' });
        const timeStampFormat = timeStampFormatContainer.createSpan({ cls: 'text-accent' });
        timeStampFormatContainer.createEl('span', { text: ' —', cls: 'text-accent' });

        new Setting(containerEl)
            .setName(timeStampPreview)
        // .setDesc(timeStampPreview);

        //#endregion

        dateStampSetting.addMomentFormat(text => text
            .setDefaultFormat(DEFAULT_SETTINGS.dateStampFormat)
            .setValue(this.plugin.settings.dateStampFormat)
            .setSampleEl(dateStampFormat)
            .onChange(async (value) => {
                this.plugin.settings.dateStampFormat = value;
                await this.plugin.saveSettings();
            }));

        timeStampSetting.addMomentFormat(text => text
            .setDefaultFormat(DEFAULT_SETTINGS.timeStampFormat)
            .setValue(this.plugin.settings.timeStampFormat)
            .setSampleEl(timeStampFormat)
            .onChange(async (value) => {
                this.plugin.settings.timeStampFormat = value;
                await this.plugin.saveSettings();
            }));

        //#endregion

        //#region Rating
        new Setting(containerEl).setName('Rating').setHeading();

        new Setting(containerEl)
            .setName('Default Maximum')
            .setDesc('The default maximum value a rating can have.')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.defaultMaxRating)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.defaultMaxRating = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Property name')
            .setDesc('The name of the property ratings will be stored in.')
            .addText(text => text
                .setPlaceholder('rating')
                .setValue(this.plugin.settings.ratingProp)
                .onChange(async (value) => {
                    this.plugin.settings.ratingProp = value;
                    await this.plugin.saveSettings();
                }));

        const filledStroke = new Setting(containerEl)
            .setName('Filled Rating Item')
            .setDesc('Enter the unicode character or emoji you\'d like to represent a filled rating item.');

        const emptyStroke = new Setting(containerEl)
            .setName('Empty Rating Item')
            .setDesc('Enter the unicode character or emoji you\'d like to represent an empty rating item.');

        // const ratingPreview = containerEl.createEl('p');
        const ratingPreviewSetting = new Setting(containerEl);

        const ratingPreview = new DocumentFragment();

        ratingPreview.textContent = 'Ratings will apear as:';
        ratingPreview.createEl('br');
        // ratingPreview.createEl('span', { text: 'Ratings will apear as:' }).createEl('br');
        ratingPreview.createEl('span', { text: this.plugin.settings.filledStroke.repeat(3), cls: 'text-accent' });
        ratingPreview.createEl('span', { text: this.plugin.settings.emptyStroke.repeat(2), cls: 'text-faint' });

        ratingPreviewSetting.setName(ratingPreview);


        filledStroke.addText(text => text
            .setPlaceholder('★')
            .setValue(this.plugin.settings.filledStroke)
            .onChange(async (value) => {
                this.plugin.settings.filledStroke = value;
                await this.plugin.saveSettings();

                const ratingPreview = new DocumentFragment();

                ratingPreview.textContent = 'Ratings will apear as:';
                ratingPreview.createEl('br');
                // ratingPreview.createEl('span', { text: 'Ratings will apear as:' }).createEl('br');
                ratingPreview.createEl('span', { text: this.plugin.settings.filledStroke.repeat(3), cls: 'text-accent' });
                ratingPreview.createEl('span', { text: this.plugin.settings.emptyStroke.repeat(2), cls: 'text-faint' });

                ratingPreviewSetting.setName(ratingPreview);
            }));

        emptyStroke.addText(text => text
            .setPlaceholder('☆')
            .setValue(this.plugin.settings.emptyStroke)
            .onChange(async (value) => {
                this.plugin.settings.emptyStroke = value;
                await this.plugin.saveSettings();

                const ratingPreview = new DocumentFragment();

                ratingPreview.textContent = 'Ratings will apear as:';
                ratingPreview.createEl('br');
                // ratingPreview.createEl('span', { text: 'Ratings will apear as:' }).createEl('br');
                ratingPreview.createEl('span', { text: this.plugin.settings.filledStroke.repeat(3), cls: 'text-accent' });
                ratingPreview.createEl('span', { text: this.plugin.settings.emptyStroke.repeat(2), cls: 'text-faint' });

                ratingPreviewSetting.setName(ratingPreview);
            }));
        //#endregion

        //#region Danger zone

        new Setting(containerEl).setName('Danger zone').setHeading();

        const refreshDesc = new DocumentFragment();

        refreshDesc.textContent = 'Diarian usually only checks notes you ';
        refreshDesc.createEl('strong', { text: 'create' });
        refreshDesc.createEl('span', { text: ', ' }).createEl('strong', { text: 'delete' });
        refreshDesc.createEl('span', { text: ', ' }).createEl('strong', { text: 'rename' });
        refreshDesc.createEl('span', { text: ', or ' }).createEl('strong', { text: 'move' });
        refreshDesc.createEl('span', { text: ' to update the list of Daily notes.' }).createEl('br');
        refreshDesc.createEl('span', { text: 'This feature retrieves ' })
            .createEl('strong', { text: 'all notes' });
        refreshDesc.createEl('span', { text: ' from your vault and filters it for Daily notes.' })
            .createEl('br');
        refreshDesc.createEl('span', { text: 'Only use this feature if there are daily notes missing in the ', cls: 'setting-error' })
            .createEl('strong', { text: 'Calendar' });
        refreshDesc.createEl('span', { text: ' view or the ', cls: 'setting-error' })
            .createEl('strong', { text: 'On this day' });
        refreshDesc.createEl('span', { text: ' view.', cls: 'setting-error' })

        new Setting(containerEl)
            .setName('Refresh daily notes')
            .setDesc(refreshDesc)
            .addButton((button) =>
                button
                    .setIcon('lucide-refresh-ccw')
                    .setTooltip('Search the entire vault for daily notes.\nUse this feature sparingly!')
                    .setWarning()
                    .onClick(() => {
                        const { folder, format }: any = getModifiedFolderAndFormat();
                        this.plugin.dailyNotes = getAllDailyNotes(folder, format);
                        this.plugin.sortDailyNotes(folder, format);
                        // printToConsole(logLevel.log, this.dailyNotes.length.toString());
                        this.plugin.refreshViews(true, true);
                        printToConsole(logLevel.info, 'Daily notes refreshed!');
                    })
            )

        /* new ButtonComponent(containerEl)
            .setIcon('lucide-refresh-ccw')
            .setButtonText('Refresh daily notes')
            .setTooltip('Search the entire vault for daily notes.\nUse this feature sparingly!')
            .setWarning()
            .onClick(() => {
                this.plugin.dailyNotes = getAllDailyNotes();
                // printToConsole(logLevel.log, this.dailyNotes.length.toString());
                this.plugin.refreshViews(true, true);
                printToConsole(logLevel.info, 'Daily notes refreshed!');
            }) */
        //#endregion
    }
}
