import { App, PluginSettingTab, SettingDefinitionItem, moment } from 'obsidian';
import type Diarian from 'src/main';
import { Unit } from './constants';
import { getDeclarativeSettings } from './settings-declarative';


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

export enum NotificationTime {
    vaultLaunch = 'At vault launch',
    specificTime = 'At a specific time'
}

export const notificationTimeMap: { [key: string]: NotificationTime } = {
    vaultLaunch: NotificationTime.vaultLaunch,
    specificTime: NotificationTime.specificTime
};

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
    calRotateImages: boolean;
    calImageRotationInterval: number;
    calStartup: boolean;
    calShowPastYears: boolean;

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
    notificationTime: NotificationTime;
    dailyNotificationTime: string;
    notifInfo: NotifInfo;

    onThisDayLoc: LeafType;
    onThisDayStartup: boolean;
    onThisDaySyncSelectedDate: boolean;

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
    calRotateImages: true,
    calImageRotationInterval: 1,
    calLocation: 'tab' as LeafType.tab,
    calStartup: false,
    calShowPastYears: true,

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
    notificationTime: 'vaultLaunch' as NotificationTime,
    dailyNotificationTime: '09:00',
    notifInfo: DEFAULT_NOTIF_INFO,

    onThisDayLoc: 'right' as LeafType,
    onThisDayStartup: false,
    onThisDaySyncSelectedDate: false,

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

    getSettingDefinitions(): SettingDefinitionItem[] {
        return getDeclarativeSettings(this);
    }

    async setControlValue(key: string, value: unknown) {
        (this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
        await this.plugin.saveSettings();

        const refreshCalendar = ['calendarType', 'disableFuture', 'calRotateImages', 'calImageRotationInterval', 'calShowPastYears'];
        const refreshBoth = ['calDisableBanners', 'showNoteTitle', 'previewLength', 'notePrevDisplay', 'prevDisableBanners'];
        const refreshOnThisDay = ['reviewInterval', 'reviewIntervalUnit', 'reviewDelay', 'reviewDelayUnit'];
        const updateDefinitions = ['calendarType', 'reviewInterval', 'reviewIntervalUnit', 'reviewDelay', 'reviewDelayUnit', 'filledType', 'emptyType', 'filledText', 'filledImage', 'filledIcon', 'emptyText', 'emptyImage', 'emptyIcon'];

        if (refreshCalendar.includes(key)) this.plugin.refreshViews(true, false);
        if (refreshBoth.includes(key)) this.plugin.refreshViews(true, true);
        if (refreshOnThisDay.includes(key)) this.plugin.refreshViews(false, true);

        if (key === 'onThisDaySyncSelectedDate' && value === false) {
            this.plugin.refreshViews(false, true, moment());
        }

        if (['revNotifType', 'notificationTime'].includes(key)) {
            this.plugin.configureNotificationSchedule();
        }

        if (['overrideFolder', 'overrideFormat', 'calRotateImages', 'notificationTime', 'filledType', 'emptyType'].includes(key)) {
            this.refreshDomState();
        }

        if (updateDefinitions.includes(key)) this.update();
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