import { App, PluginSettingTab, Setting, Platform, moment } from 'obsidian';
import type Diarian from 'src/main';
import { Unit, getTimeSpanTitle, printToConsole, logLevel } from './constants';
import { getAllDailyNotes, getModifiedFolderAndFormat } from './get-daily-notes';
import { RatingStroke, displayRating } from './views/rating-view';


//#region constants
//#region enums & values

//#region Calendar type
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
//#endregion

//#region Leaf type
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
//#endregion

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

//#region Notifications

//#region Notification type
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
//#endregion

//#region Notification info
export interface NotifInfo {
    lastNotified: moment.Moment;
    needToRemind: boolean;
    reminderTime?: moment.Moment;
}

export const DEFAULT_NOTIF_INFO: NotifInfo = {
    lastNotified: moment().subtract(1, 'day'),
    needToRemind: false,
}
//#endregion

//#region Reminder delay
export enum ReminderDelay {
    fiveMin = 'In 5 minutes',
    tenMin = 'In 10 minutes',
    thirtyMin = 'In 30 minutes',
    oneHr = 'In 1 hour',
    twoHr = 'In 2 hours',
    fourHr = 'In 4 hours'
}

export const reminderDelayMap: { [key: string]: ReminderDelay } = {
    fiveMin: ReminderDelay.fiveMin,
    tenMin: ReminderDelay.tenMin,
    thirtyMin: ReminderDelay.thirtyMin,
    oneHr: ReminderDelay.oneHr,
    twoHr: ReminderDelay.twoHr,
    fourHr: ReminderDelay.fourHr
};
//#endregion

//#endregion

//#region Note preview display
export enum NotePrevDisplay {
    callout = 'Callouts',
    quote = 'Blockquotes',
    text = 'Regular text'
}

export const notePrevDisplayMap: { [key: string]: NotePrevDisplay } = {
    callout: NotePrevDisplay.callout,
    quote: NotePrevDisplay.quote,
    text: NotePrevDisplay.text
};
//#endregion

//#region New note mode
export enum NewNoteMode {
    reading = "Reading",
    source = "Source mode",
    live = "Live preview"
}

export const newNoteModeMap: { [key: string]: NewNoteMode } = {
    reading: NewNoteMode.reading,
    source: NewNoteMode.source,
    live: NewNoteMode.live
};
//#endregion

//#region Rating type
export enum RatingType {
    text = "Unicode character or emoji",
    image = "Image",
    icon = "Lucide icon"//,
    // svg = "Custom svg"
}

export const ratingTypeMap: { [key: string]: RatingType } = {
    text: RatingType.text,
    image: RatingType.image,
    icon: RatingType.icon//,
    //svg: RatingType.svg
};
//#endregion

//#endregion

//#region Setting defaults
export interface DiarianSettings {
    newNoteMode: NewNoteMode;
    overrideFolder: boolean;
    overriddenFolder: string;
    overrideFormat: boolean;
    overriddenFormat: string;

    calendarType: CalType;
    disableFuture: boolean;
    headingFormat: string;
    calLocation: LeafType;
    calDisableBanners: boolean;
    calStartup: boolean;

    previewLength: number;
    openInNewPane: boolean;
    notePrevDisplay: NotePrevDisplay;
    prevDisableBanners: boolean;
    showNoteTitle: boolean;

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
    filledType: RatingType;
    emptyType: RatingType;
    filledText: string;
    emptyText: string;
    filledImage: string;
    emptyImage: string;
    filledIcon: string;
    emptyIcon: string;

}

export const DEFAULT_SETTINGS: DiarianSettings = {
    newNoteMode: 'live' as NewNoteMode,
    overrideFolder: false,
    overriddenFolder: "",
    overrideFormat: false,
    overriddenFormat: "",

    calendarType: 'iso8601' as CalType,
    disableFuture: false,
    headingFormat: 'dddd, MMMM Do, YYYY',
    calDisableBanners: false,
    calLocation: 'tab' as LeafType.tab,
    calStartup: false,

    previewLength: 250,
    openInNewPane: false,
    notePrevDisplay: 'callout' as NotePrevDisplay,
    prevDisableBanners: true,
    showNoteTitle: true,

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
    filledType: 'text' as RatingType,
    emptyType: 'text' as RatingType,
    filledText: '★',
    emptyText: '☆',
    filledImage: 'https://i.ibb.co/4gvm0FT/Heart-cropped.png',
    emptyImage: 'https://i.ibb.co/d59d4zH/Heart-cropped-empty.png',
    filledIcon: 'lucide-star',
    emptyIcon: 'lucide-star-off'

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
        const plugin = this.plugin;
        // const app = this.app;

        containerEl.empty();

        // new Setting(containerEl).setName('On startup').setHeading();
        new Setting(containerEl).setName('Open new daily notes in')
            .setDesc('The mode new daily notes created by Diarian will open in.')
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions(NewNoteMode)
                    .setValue(this.plugin.settings.newNoteMode)
                    .onChange((value) => {
                        this.plugin.settings.newNoteMode = value as NewNoteMode;
                        void this.plugin.saveSettings();
                    })
            })

        //#region Path Overrides


        const overrideError = new DocumentFragment;
        const overrideErrorSpan = overrideError.createEl('span', { text: 'You must trigger ', cls: 'setting-error' });
        overrideErrorSpan.createEl('strong', { text: 'Refresh daily notes' });
        overrideErrorSpan.appendText(" at the bottom of this page before these settings take effect!");

        new Setting(containerEl).setName('Daily notes overrides').setHeading().setDesc(overrideError);

        //#region Override Folder
        //#region Toggle
        const overrideFolderFrag = new DocumentFragment();
        overrideFolderFrag.textContent =
            "Enable this to override the folder path for your daily notes.";
        overrideFolderFrag.createEl("br");
        overrideFolderFrag.appendText("Disabling this will use your settings from the Daily notes plugin, which can be found under ");
        overrideFolderFrag.createEl("strong", { text: "Settings → Daily notes → New file location" });
        overrideFolderFrag.appendText(".")

        new Setting(containerEl).setName('Override daily notes folder')
            .setDesc(overrideFolderFrag)
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.overrideFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.overrideFolder = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            })
        //#endregion
        //#region Path
        if (this.plugin.settings.overrideFolder) {
            const overriddenFolderFrag = new DocumentFragment();
            overriddenFolderFrag.textContent = "The new path for the folder that contains your daily notes.";
            overriddenFolderFrag.createEl("br");
            overriddenFolderFrag.appendText("Leave this blank to use your vault's root folder.")

            new Setting(containerEl).setName('New daily notes folder')
                .setDesc(overriddenFolderFrag)
                .addText(text =>
                    text
                        .setPlaceholder("Journal")
                        .setValue(this.plugin.settings.overriddenFolder)
                        .onChange(async (value) => {
                            this.plugin.settings.overriddenFolder = value;
                            await this.plugin.saveSettings();
                        })
                )
        }
        //#endregion
        //#endregion

        //#region Override Format
        //#region Toggle
        const overrideFormatFrag = new DocumentFragment();
        overrideFormatFrag.textContent =
            "Enable this to override the date format for your daily notes.";
        overrideFormatFrag.createEl("br");
        overrideFormatFrag.appendText("Disabling this will use your settings from the Daily notes plugin, which can be found under ");
        overrideFormatFrag.createEl("strong", { text: "Settings → Daily notes → Date format" });
        overrideFormatFrag.appendText(".")

        new Setting(containerEl).setName('Override daily notes date format')
            .setDesc(overrideFormatFrag)
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.overrideFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.overrideFormat = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            })
        //#endregion
        //#region Path
        if (this.plugin.settings.overrideFormat) {
            const overriddenFormatFrag = new DocumentFragment();
            overriddenFormatFrag.textContent = "The new date format for your daily notes";
            overriddenFormatFrag.createEl("br");
            overriddenFormatFrag.appendText("Follow ")
            overriddenFormatFrag.createEl("a", {
                text: "these instructions", attr: {
                    href: "https://github.com/Erallie/diarian?tab=readme-ov-file#multiplenested-daily-notes"
                }
            })
            overriddenFormatFrag.appendText(" if you want to use multiple/nested daily notes.")

            new Setting(containerEl).setName('New daily notes folder')
                .setDesc(overriddenFormatFrag)
                .addText(text =>
                    text
                        .setPlaceholder("YYYY-MM-DD")
                        .setValue(this.plugin.settings.overriddenFormat)
                        .onChange(async (value) => {
                            this.plugin.settings.overriddenFormat = value;
                            await this.plugin.saveSettings();
                        })
                )
        }
        //#endregion
        //#endregion

        //#endregion

        //#region Calendar
        new Setting(containerEl).setName('Calendar').setHeading();

        //#region Calendar type
        const calTypeDesc = new DocumentFragment;
        calTypeDesc.textContent = 'The type of calendar that will be displayed.';
        calTypeDesc.createEl('br');
        calTypeDesc.appendText('This will affect the starting weekday. Currently, the week starts on ')/* .createEl('br');
        calTypeDesc.createEl('span', { text: "Currently, the week starts on " }) */;
        const startWeekday = calTypeDesc.createSpan({ cls: 'text-accent' });
        calTypeDesc.appendText('.');


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
        disableFutureDesc.appendText(" view.");

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
        headingFormatDesc.appendText(" format for headings in the ")
        headingFormatDesc.createEl('strong', { text: "Calendar" });
        headingFormatDesc.appendText(" view.")
        headingFormatDesc.createEl("br");
        headingFormatDesc.appendText('Headings will appear as: ');
        const headingFormat = headingFormatDesc.createSpan({ cls: 'text-accent' });

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

        //#region Disable Banner Plugin images
        const calBannerDesc = new DocumentFragment;
        calBannerDesc.textContent = 'Disable showing banner images using the ';
        calBannerDesc.createEl("a", {
            text: "Banner plugin",
            attr: {
                href: "obsidian://show-plugin?id=obsidian-banners",
            },
        });
        calBannerDesc.appendText(' or the ')
        calBannerDesc.createEl("a", {
            text: "CSS snippet",
            attr: {
                href: "https://github.com/HandaArchitect/obsidian-banner-snippet",
            },
        });
        calBannerDesc.appendText(' in ')
        calBannerDesc.createEl('strong', { text: 'Calendar' });
        calBannerDesc.appendText(' view tiles.');

        new Setting(containerEl)
            .setName('Disable banner images')
            .setDesc(calBannerDesc)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.calDisableBanners)
                    .onChange((value) => {
                        this.plugin.settings.calDisableBanners = value;
                        void this.plugin.saveSettings();
                        this.plugin.refreshViews(true, true);
                    }));
        //#endregion

        //#region Calendar location
        const calLocDesc = new DocumentFragment;
        calLocDesc.textContent = 'The location the  ';
        calLocDesc.createEl('strong', { text: "Calendar" });
        calLocDesc.appendText(" view will open in");
        if (Platform.isDesktop) {
            calLocDesc.appendText(" by default");
        };
        calLocDesc.appendText('.');

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
        const openCalDesc = new DocumentFragment;
        openCalDesc.textContent = 'Open the ';
        openCalDesc.createEl('strong', { text: "Calendar" });
        openCalDesc.appendText(" view on startup.");

        new Setting(containerEl)
            .setName('Open on startup')
            .setDesc(openCalDesc)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.calStartup)
                    .onChange((value) => {
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
        intervalDescription.appendText('Currently set to ')
        intervalDescription.createEl("span", {
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
        delayDescription.appendText(" view.");
        delayDescription.createEl("br");
        delayDescription.appendText('Currently set to ')
        delayDescription.createEl("span", {
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
        revNotifTypeDesc.appendText(" to review.");

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
        onThisDayLocDesc.appendText(" view will open in.");

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
        openOnThisDayDesc.appendText(" view on startup.");


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

        //#region display
        const notePrevDispDesc = new DocumentFragment();

        notePrevDispDesc.textContent =
            "Whether to use ";
        notePrevDispDesc.createEl("a", {
            text: "callouts",
            attr: {
                href: "https://help.obsidian.md/Editing+and+formatting/Callouts",
            },
        });
        notePrevDispDesc.appendText(", blockquotes, or regular text to render note previews.")

        new Setting(containerEl)
            .setName("How to display content")
            .setDesc(notePrevDispDesc)
            .addDropdown((dropdown) => {
                dropdown
                    .addOptions(NotePrevDisplay)
                    .setValue(this.plugin.settings.notePrevDisplay)
                    .onChange((value) => {
                        this.plugin.settings.notePrevDisplay = value as NotePrevDisplay;
                        void this.plugin.saveSettings();
                        this.plugin.refreshViews(true, true);
                    })
            })

        //#endregion


        //#region Disable Banner Plugin images
        const notePrevBannerDesc = new DocumentFragment;
        notePrevBannerDesc.textContent = 'Disable showing banner images using the ';
        notePrevBannerDesc.createEl("a", {
            text: "CSS snippet",
            attr: {
                href: "https://github.com/HandaArchitect/obsidian-banner-snippet",
            },
        });
        notePrevBannerDesc.appendText(' in note previews.');

        new Setting(containerEl)
            .setName('Disable banner images')
            .setDesc(notePrevBannerDesc)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.prevDisableBanners)
                    .onChange((value) => {
                        this.plugin.settings.prevDisableBanners = value;
                        void this.plugin.saveSettings();
                        this.plugin.refreshViews(true, true);
                    }));
        //#endregion


        /* if (!this.plugin.settings.useCallout) {
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
        } */

        //#region New Tab
        let notePaneTitle = 'Open in a new tab';

        const notePaneDesc = new DocumentFragment();
        notePaneDesc.textContent =
            "When clicked, notes will open in a new tab when possible";
        if (Platform.isDesktop) {
            notePaneDesc.appendText(' by default.')
            notePaneDesc.createEl("br");
            notePaneDesc.appendText('Middle-clicking a note will ');
            notePaneDesc.createEl('em', { text: 'always' });
            notePaneDesc.appendText(' open it in a new tab regardless of this setting.');
        }
        else {
            notePaneDesc.appendText('.')
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
        dateStampDesc.appendText(" format for the date part of timestamps.");

        const timeStampDesc = new DocumentFragment();
        timeStampDesc.textContent =
            "The ";
        timeStampDesc.createEl("a", {
            text: "moment.js",
            attr: {
                href: "https://momentjs.com/docs/#/displaying/format/",
            },
        });
        timeStampDesc.appendText(" format for the time part of timestamps.");


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
        timeStampFormatContainer.appendText(' ');
        const timeStampFormat = timeStampFormatContainer.createSpan({ cls: 'text-accent' });
        timeStampFormatContainer.appendText(' —');

        const timeStampPrevDesc = new DocumentFragment();

        timeStampPrevDesc.textContent = 'If the active note is from the current day, only the time will be inserted.';
        timeStampPrevDesc.createEl('br');
        timeStampPrevDesc.appendText('Otherwise, both the date and the time will be inserted.')

        new Setting(containerEl)
            .setName(timeStampPreview)
            .setDesc(timeStampPrevDesc);

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

        //#region settings
        new Setting(containerEl)
            .setName('Default maximum') //Default maximum
            .setDesc('The default maximum value a rating can have.')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(this.plugin.settings.defaultMaxRating)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.defaultMaxRating = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl) //Property name
            .setName('Property name')
            .setDesc('The name of the property ratings will be stored in.')
            .addText(text => text
                .setPlaceholder('rating')
                .setValue(this.plugin.settings.ratingProp)
                .onChange(async (value) => {
                    this.plugin.settings.ratingProp = value;
                    await this.plugin.saveSettings();
                }));

        const filledType = new Setting(containerEl)
            .setName('Filled rating type')
            .setDesc('Whether to use a text character, an image, or a Lucide icon for the filled rating item.')

        const filledStroke = new Setting(containerEl)
            .setName('Filled rating item')
            .setDesc('Enter the unicode character or emoji you\'d like to represent a filled rating item.');


        const emptyType = new Setting(containerEl)
            .setName('Empty rating type')
            .setDesc('Whether to use a text character, an image, or a Lucide icon for the empty rating item.')

        const emptyStroke = new Setting(containerEl)
            .setName('Empty rating item')
            .setDesc('Enter the unicode character or emoji you\'d like to represent an empty rating item.');

        const ratingPreviewSetting = new Setting(containerEl);

        //#endregion


        function setRatingPrev() {
            const ratingPreview = new DocumentFragment();

            ratingPreview.textContent = 'Ratings will appear as:';
            ratingPreview.createEl('br');
            const ratingPrevDisplay = new DocumentFragment();
            displayRating(plugin.settings, ratingPrevDisplay, RatingStroke.combined, '', 3, 5);
            ratingPreview.append(ratingPrevDisplay);

            ratingPreviewSetting.setName(ratingPreview);
        }

        function setRatingSetting(setting: Setting, value: RatingType, which: RatingStroke) {
            setting.clear();

            let article: string;

            switch (which) {
                case RatingStroke.empty:
                    article = 'an';
                    break;
                case RatingStroke.filled:
                    article = 'a';
                    break;
                default:
                    printToConsole(logLevel.error, `Cannot set rating setting:\n${which} is not a valid rating stroke!`);
                    return;
            }

            const desc = new DocumentFragment();

            const valueMapped = ratingTypeMap[value as RatingType];
            switch (valueMapped) {
                case RatingType.text:
                    setting
                        .setDesc(`Enter the unicode character or emoji you'd like to represent ${article} ${which} rating item.`)
                    switch (which) {
                        case 'filled':
                            setting.addText(text => text
                                .setPlaceholder(DEFAULT_SETTINGS.filledText)
                                .setValue(plugin.settings.filledText)
                                .onChange(async (value) => {
                                    plugin.settings.filledText = value;
                                    await plugin.saveSettings();
                                    setRatingPrev();
                                }));
                            break;
                        case 'empty':
                            setting.addText(text => text
                                .setPlaceholder(DEFAULT_SETTINGS.emptyText)
                                .setValue(plugin.settings.emptyText)
                                .onChange(async (value) => {
                                    plugin.settings.emptyText = value;
                                    await plugin.saveSettings();
                                    setRatingPrev();
                                }));
                            break;
                    }
                    break;
                case RatingType.image:
                    desc.textContent = `Enter the path to the image you'd like to represent ${article} ${which} rating item.`
                    desc.createEl('br');
                    desc.appendText('Can be a local path to an image in your vault or a url to an image online.');
                    setting
                        .setDesc(desc)
                    switch (which) {
                        case 'filled':
                            setting.addText(text => text
                                .setPlaceholder(DEFAULT_SETTINGS.filledImage)
                                .setValue(plugin.settings.filledImage)
                                .onChange(async (value) => {
                                    plugin.settings.filledImage = value;
                                    await plugin.saveSettings();
                                    setRatingPrev();
                                }));
                            /* setting.addSearch((cb) => {
                                const suggest = new SuggestImages(app, cb.inputEl, plugin)
                                cb.setPlaceholder(DEFAULT_SETTINGS.filledImage)
                                    .setValue(plugin.settings.filledImage)
                                    .onChange(async (value) => {
                                        plugin.settings.filledImage = value;
                                        await plugin.saveSettings();
                                        setRatingPrev();
                                    })
                            }) */
                            break;
                        case 'empty':
                            setting.addText(text => text
                                .setPlaceholder(DEFAULT_SETTINGS.emptyImage)
                                .setValue(plugin.settings.emptyImage)
                                .onChange(async (value) => {
                                    plugin.settings.emptyImage = value;
                                    await plugin.saveSettings();
                                    setRatingPrev();
                                }));
                            /* setting.addSearch((cb) => {
                                new SuggestImages(app, cb.inputEl, plugin)
                                cb.setPlaceholder(DEFAULT_SETTINGS.emptyImage)
                                    .setValue(plugin.settings.emptyImage)
                                    .onChange(async (value) => {
                                        plugin.settings.emptyImage = value;
                                        await plugin.saveSettings();
                                        setRatingPrev();
                                    })
                            }) */
                            break;
                    }
                    break;
                case RatingType.icon:
                    desc.textContent = `Enter the name of the `;
                    desc.createEl('a', { text: 'Lucide', attr: { href: 'https://lucide.dev/' } });
                    desc.appendText(` icon you'd like to represent ${article} ${which} rating item.`)
                    setting
                        .setDesc(desc)
                    switch (which) {
                        case 'filled':
                            setting.addText(text => text
                                .setPlaceholder(DEFAULT_SETTINGS.filledIcon)
                                .setValue(plugin.settings.filledIcon)
                                .onChange(async (value) => {
                                    plugin.settings.filledIcon = value;
                                    await plugin.saveSettings();
                                    setRatingPrev();
                                }));
                            break;
                        case 'empty':
                            setting.addText(text => text
                                .setPlaceholder(DEFAULT_SETTINGS.emptyIcon)
                                .setValue(plugin.settings.emptyIcon)
                                .onChange(async (value) => {
                                    plugin.settings.emptyIcon = value;
                                    await plugin.saveSettings();
                                    setRatingPrev();
                                }));
                            break;
                    }
                    break;
                default:
                    printToConsole(logLevel.error, `Cannot set rating setting:\n${value} is not a valid RatingType!`);
            }

            setRatingPrev();
        }

        filledType
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(RatingType)
                    .setValue(this.plugin.settings.filledType)
                    .onChange(async (value) => {
                        this.plugin.settings.filledType = value as RatingType;
                        void this.plugin.saveSettings();
                        setRatingSetting(filledStroke, value as RatingType, RatingStroke.filled);
                    }));

        emptyType
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions(RatingType)
                    .setValue(this.plugin.settings.emptyType)
                    .onChange(async (value) => {
                        this.plugin.settings.emptyType = value as RatingType;
                        void this.plugin.saveSettings();
                        setRatingSetting(emptyStroke, value as RatingType, RatingStroke.empty);
                    }));

        setRatingSetting(filledStroke, this.plugin.settings.filledType as RatingType, RatingStroke.filled);
        setRatingSetting(emptyStroke, this.plugin.settings.emptyType as RatingType, RatingStroke.empty);

        setRatingPrev();

        //#endregion

        //#region Danger zone

        new Setting(containerEl).setName('Danger zone').setHeading();

        const refreshDesc = new DocumentFragment();

        refreshDesc.textContent = 'Diarian usually only checks notes you ';
        refreshDesc.createEl('strong', { text: 'create' });
        refreshDesc.appendText(', ')
        refreshDesc.createEl('strong', { text: 'delete' });
        refreshDesc.appendText(', ')
        refreshDesc.createEl('strong', { text: 'rename' });
        refreshDesc.appendText(', or ')
        refreshDesc.createEl('strong', { text: 'move' });
        refreshDesc.appendText(' to update the list of Daily notes.')
        refreshDesc.createEl('br');
        refreshDesc.appendText('This feature retrieves ')
        refreshDesc.createEl('strong', { text: 'all notes' });
        refreshDesc.appendText(' from your vault and filters it for Daily notes.')
        refreshDesc.createEl('br');
        const refreshDescError = refreshDesc.createEl('span', { text: 'Only use this feature if there are daily notes missing in the ', cls: 'setting-error' })
        refreshDescError.createEl('strong', { text: 'Calendar' });
        refreshDescError.appendText(' view or the ')
        refreshDescError.createEl('strong', { text: 'On this day' });
        refreshDescError.appendText(' view.')

        new Setting(containerEl)
            .setName('Refresh daily notes')
            .setDesc(refreshDesc)
            .addButton((button) =>
                button
                    .setIcon('lucide-refresh-ccw')
                    .setTooltip('Search the entire vault for daily notes.\nUse this feature sparingly!')
                    .setWarning()
                    .onClick(() => {
                        const { folder, format }: any = getModifiedFolderAndFormat(this.plugin.settings);
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
/* class SuggestImages extends SuggestModal<any> {
    // inputEl: HTMLInputElement;
    plugin: Diarian;
    // options?: { title: string, placeholder: string }

    getSuggestions(query: string): TFile[] {
        const abstractFiles = this.app.vault.getAllLoadedFiles();
        const files: TFile[] = [];
        const lowerCaseInputStr = query.toLowerCase();
        abstractFiles.forEach((file: TAbstractFile) => {
            if (
                file instanceof TFile &&
                (file.extension == 'avif' || file.extension == 'bmp' || file.extension == 'gif' || file.extension == 'jpeg' || file.extension == 'jpg' || file.extension == "png" || file.extension == 'svg' || file.extension == 'webp') &&
                file.path.toLowerCase().contains(lowerCaseInputStr)
            ) {
                files.push(file);
            }
        });
        return files;
        // throw new Error('Method not implemented.');
    }
    renderSuggestion(file: TFile, el: HTMLElement) {
        el.setText(file.path)
        // throw new Error('Method not implemented.');
    }
    onChooseSuggestion(file: TFile) {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
        // throw new Error('Method not implemented.');
    }
    constructor(app: App, inputEl: HTMLInputElement, plugin: Diarian) {
        super(app);
        this.inputEl = inputEl;
        this.plugin = plugin;
    }
} */