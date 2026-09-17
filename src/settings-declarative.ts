import { moment, Platform, SettingDefinitionItem } from 'obsidian';
import { Unit, getTimeSpanTitle, logLevel, printToConsole } from './constants';
import { getAllDailyNotes, getModifiedFolderAndFormat } from './get-daily-notes';
import { displayRating, RatingStroke } from './views/rating-view';
import type Diarian from './main';

export interface DeclarativeSettingsHost {
    plugin: Diarian;
    update(): void;
    refreshDomState(): void;
}

const options = {
    newNoteMode: { reading: 'Reading', source: 'Source mode', live: 'Live preview' },
    calendarType: { gregory: 'Gregorian', hebrew: 'Hebrew', islamic: 'Islamic', iso8601: 'ISO 8601' },
    leaf: { tab: 'Tab', right: 'Right sidebar', left: 'Left sidebar' },
    unit: { day: 'day', week: 'week', month: 'month', year: 'year' },
    notification: { none: 'None', modal: 'Pop-up modal', notice: 'Notice' },
    notificationTime: { vaultLaunch: 'At vault launch', specificTime: 'At a specific time' },
    preview: { callout: 'Callouts', quote: 'Blockquotes', text: 'Regular text' },
    rating: { text: 'Unicode character or emoji', image: 'Image', icon: 'Lucide icon' }
};

const rich = (build: (fragment: DocumentFragment) => void) => createFragment(build);
const viewDescription = (before: string, view: string, after: string) => rich((fragment) => {
    fragment.appendText(before);
    fragment.createEl('strong', { text: view });
    fragment.appendText(after);
});

const maxTimeSpan = (unit: Unit) => ({ day: 31, week: 52, month: 24, year: 100 }[unit]);

export function getDeclarativeSettings(host: DeclarativeSettingsHost): SettingDefinitionItem[] {
    const { plugin } = host;
    const settings = plugin.settings;
    const calendarStartDay = ({ gregory: 'Sunday', hebrew: 'Sunday', islamic: 'Saturday', iso8601: 'Monday' } as Record<string, string>)[settings.calendarType];
    const boldOnThisDay = (before: string, after: string) => viewDescription(before, 'On this day', after);

    return [
        {
            name: 'Open new daily notes in',
            desc: 'The mode new daily notes created by Diarian will open in.',
            control: { type: 'dropdown', key: 'newNoteMode', options: options.newNoteMode, defaultValue: 'live' }
        },
        {
            type: 'group',
            heading: 'Daily notes overrides',
            items: [
                {
                    name: 'Refresh required',
                    desc: rich((fragment) => {
                        const warning = fragment.createSpan();
                        warning.appendText('Select ');
                        warning.createEl('strong', { text: 'Refresh daily notes' });
                        warning.appendText(' in the Danger zone before override changes take effect.');
                    })
                },
                {
                    name: 'Override daily notes folder',
                    desc: 'Override the folder path supplied by the Daily notes plugin.',
                    control: { type: 'toggle', key: 'overrideFolder', defaultValue: false }
                },
                {
                    name: 'New daily notes folder',
                    desc: "The folder containing daily notes. Leave blank to use the vault's root folder.",
                    visible: () => settings.overrideFolder,
                    control: { type: 'folder', key: 'overriddenFolder', placeholder: 'Journal', includeRoot: true }
                },
                {
                    name: 'Override daily notes date format',
                    desc: 'Override the date format supplied by the Daily notes plugin.',
                    control: { type: 'toggle', key: 'overrideFormat', defaultValue: false }
                },
                {
                    name: 'New daily notes date format',
                    desc: 'The Moment.js date format used to recognize and create daily notes.',
                    visible: () => settings.overrideFormat,
                    control: { type: 'text', key: 'overriddenFormat', placeholder: 'YYYY-MM-DD' }
                }
            ]
        },
        {
            type: 'group',
            heading: 'Calendar',
            items: [
                {
                    name: 'Calendar type',
                    desc: `Controls the starting weekday. The selected calendar starts on ${calendarStartDay}.`,
                    control: { type: 'dropdown', key: 'calendarType', options: options.calendarType, defaultValue: 'iso8601' }
                },
                {
                    name: 'Disable future dates',
                    desc: viewDescription('Disable access to future dates in the ', 'Calendar', ' view.'),
                    control: { type: 'toggle', key: 'disableFuture', defaultValue: false }
                },
                {
                    name: 'Heading format',
                    desc: viewDescription('The Moment.js date format used for headings in the ', 'Calendar', ' view.'),
                    render: (setting) => {
                        setting.addMomentFormat((text) => text
                            .setDefaultFormat('dddd, MMMM Do, YYYY')
                            .setValue(settings.headingFormat)
                            .onChange(async (value) => {
                                settings.headingFormat = value;
                                await plugin.saveSettings();
                                plugin.refreshViews(true, false);
                            }));
                    }
                },
                {
                    name: 'Disable banner images',
                    desc: viewDescription('Disable banner images in ', 'Calendar', ' view tiles.'),
                    control: { type: 'toggle', key: 'calDisableBanners', defaultValue: false }
                },
                {
                    name: 'Rotate images',
                    desc: viewDescription('Rotate through all images found on a day in ', 'Calendar', ' view tiles.'),
                    control: { type: 'toggle', key: 'calRotateImages', defaultValue: true }
                },
                {
                    name: 'Image rotation interval',
                    desc: 'The number of seconds each calendar image remains visible.',
                    visible: () => settings.calRotateImages,
                    control: { type: 'slider', key: 'calImageRotationInterval', min: 0.25, max: 5, step: 0.25, displayFormat: (value) => `${value} s` }
                },
                {
                    name: 'Leaf location',
                    desc: viewDescription('The default location where the ', 'Calendar', ' view opens.'),
                    control: { type: 'dropdown', key: 'calLocation', options: options.leaf, defaultValue: 'tab' }
                },
                {
                    name: 'Open on startup',
                    desc: viewDescription('Open the ', 'Calendar', ' view when the vault starts.'),
                    control: { type: 'toggle', key: 'calStartup', defaultValue: false }
                },
                {
                    name: 'Display past notes',
                    desc: viewDescription('Show notes from the selected date in past years beneath the ', 'Calendar', ' view.'),
                    control: { type: 'toggle', key: 'calShowPastYears', defaultValue: true }
                }
            ]
        },
        {
            type: 'group',
            heading: 'On this day',
            items: [
                {
                    name: 'Review interval',
                    desc: `Notes are shown every ${getTimeSpanTitle(settings.reviewInterval, settings.reviewIntervalUnit)}.`,
                    control: { type: 'slider', key: 'reviewInterval', min: 1, max: maxTimeSpan(settings.reviewIntervalUnit), step: 1, displayFormat: String }
                },
                {
                    name: 'Review interval unit',
                    desc: 'The unit used by the review interval.',
                    control: { type: 'dropdown', key: 'reviewIntervalUnit', options: options.unit, defaultValue: Unit.month }
                },
                {
                    name: 'Review delay',
                    desc: boldOnThisDay('Only notes at least this old are included in the ', ' view.'),
                    control: { type: 'slider', key: 'reviewDelay', min: 1, max: maxTimeSpan(settings.reviewDelayUnit), step: 1, displayFormat: String }
                },
                {
                    name: 'Review delay unit',
                    desc: 'The unit used by the review delay.',
                    control: { type: 'dropdown', key: 'reviewDelayUnit', options: options.unit, defaultValue: Unit.month }
                },
                {
                    name: 'Notifications',
                    desc: boldOnThisDay('Choose how to receive notifications when the ', ' view has notes to review.'),
                    control: { type: 'dropdown', key: 'revNotifType', options: options.notification, defaultValue: 'none' }
                },
                {
                    name: 'Notification time',
                    desc: boldOnThisDay('Choose whether ', ' notifications appear at vault launch or at a specific time each day.'),
                    control: { type: 'dropdown', key: 'notificationTime', options: options.notificationTime, defaultValue: 'vaultLaunch' }
                },
                {
                    name: 'Daily notification time',
                    desc: boldOnThisDay('Send the ', ' notification at this time each day while Obsidian is running.'),
                    aliases: ['anniversary notification time', 'scheduled notification'],
                    visible: () => (settings.notificationTime as unknown as string) === 'specificTime',
                    render: (setting) => {
                        setting.addText((text) => {
                        text.inputEl.type = 'time';
                        text.inputEl.addClass('diarian-time-input');
                        text.inputEl.setAttr('aria-label', 'Daily notification time');
                        text.setValue(settings.dailyNotificationTime).onChange(async (value) => {
                            if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return;
                            settings.dailyNotificationTime = value;
                            await plugin.saveSettings();
                            plugin.configureNotificationSchedule();
                        });
                        });
                    }
                },
                {
                    name: 'Leaf location',
                    desc: boldOnThisDay('The default location where the ', ' view opens.'),
                    control: { type: 'dropdown', key: 'onThisDayLoc', options: options.leaf, defaultValue: 'right' }
                },
                {
                    name: 'Open on startup',
                    desc: boldOnThisDay('Open the ', ' view when the vault starts.'),
                    control: { type: 'toggle', key: 'onThisDayStartup', defaultValue: false }
                },
                {
                    name: 'Sync to selected date',
                    desc: rich((fragment) => {
                        fragment.appendText('Show notes in the ');
                        fragment.createEl('strong', { text: 'On this day' });
                        fragment.appendText(' view relative to the ');
                        fragment.createEl('strong', { text: 'Calendar' });
                        fragment.appendText(" view's selected date instead of today.");
                    }),
                    control: { type: 'toggle', key: 'onThisDaySyncSelectedDate', defaultValue: false }
                }
            ]
        },
        {
            type: 'group',
            heading: 'Note previews',
            items: [
                { name: 'Display note name', desc: 'Render the note name above preview text.', control: { type: 'toggle', key: 'showNoteTitle', defaultValue: true } },
                { name: 'Preview length', desc: 'The maximum number of characters displayed in a note preview.', control: { type: 'slider', key: 'previewLength', min: 0, max: 1000, step: 10, displayFormat: String } },
                { name: 'How to display content', desc: 'Render preview content as callouts, blockquotes, or regular text.', control: { type: 'dropdown', key: 'notePrevDisplay', options: options.preview, defaultValue: 'callout' } },
                { name: 'Disable banner images', desc: 'Disable CSS-snippet banner images in note previews.', control: { type: 'toggle', key: 'prevDisableBanners', defaultValue: true } },
                { name: 'Open in a new tab', desc: Platform.isDesktop ? 'Open clicked notes in a new tab by default. Middle-click always opens a new tab.' : 'Open clicked notes in a new tab when possible.', control: { type: 'toggle', key: 'openInNewPane', defaultValue: false } }
            ]
        },
        {
            type: 'group',
            heading: 'Timestamps',
            items: [
                {
                    name: 'Date format',
                    desc: 'The Moment.js format for the date portion of inserted timestamps.',
                    render: (setting) => {
                        setting.addMomentFormat((text) => text.setDefaultFormat('M/D/YYYY').setValue(settings.dateStampFormat).onChange(async (value) => { settings.dateStampFormat = value; await plugin.saveSettings(); }));
                    }
                },
                {
                    name: 'Time format',
                    desc: 'The Moment.js format for the time portion of inserted timestamps.',
                    render: (setting) => {
                        setting.addMomentFormat((text) => text.setDefaultFormat('h:mm A').setValue(settings.timeStampFormat).onChange(async (value) => { settings.timeStampFormat = value; await plugin.saveSettings(); }));
                    }
                },
                { name: 'Timestamp preview', desc: `Timestamps appear as “${moment().format(settings.dateStampFormat)} ${moment().format(settings.timeStampFormat)}”. Current-day notes include only the time.` }
            ]
        },
        {
            type: 'group',
            heading: 'Rating',
            items: [
                { name: 'Default maximum', desc: 'The default maximum rating value.', control: { type: 'slider', key: 'defaultMaxRating', min: 1, max: 10, step: 1, displayFormat: String } },
                { name: 'Property name', desc: 'The note property used to store ratings.', control: { type: 'text', key: 'ratingProp', placeholder: 'rating', validate: (value) => value.trim() ? undefined : 'Enter a property name.' } },
                { name: 'Filled rating type', desc: 'The visual type used for filled rating items.', control: { type: 'dropdown', key: 'filledType', options: options.rating, defaultValue: 'text' } },
                { name: 'Filled rating text', desc: 'The Unicode character or emoji used for a filled rating item.', visible: () => (settings.filledType as unknown as string) === 'text', control: { type: 'text', key: 'filledText', placeholder: '★' } },
                { name: 'Filled rating image', desc: 'A vault path or URL for the filled rating image.', visible: () => (settings.filledType as unknown as string) === 'image', control: { type: 'text', key: 'filledImage' } },
                { name: 'Filled rating icon', desc: 'The Lucide icon name used for a filled rating item.', visible: () => (settings.filledType as unknown as string) === 'icon', control: { type: 'text', key: 'filledIcon', placeholder: 'lucide-star' } },
                { name: 'Empty rating type', desc: 'The visual type used for empty rating items.', control: { type: 'dropdown', key: 'emptyType', options: options.rating, defaultValue: 'text' } },
                { name: 'Empty rating text', desc: 'The Unicode character or emoji used for an empty rating item.', visible: () => (settings.emptyType as unknown as string) === 'text', control: { type: 'text', key: 'emptyText', placeholder: '☆' } },
                { name: 'Empty rating image', desc: 'A vault path or URL for the empty rating image.', visible: () => (settings.emptyType as unknown as string) === 'image', control: { type: 'text', key: 'emptyImage' } },
                { name: 'Empty rating icon', desc: 'The Lucide icon name used for an empty rating item.', visible: () => (settings.emptyType as unknown as string) === 'icon', control: { type: 'text', key: 'emptyIcon', placeholder: 'lucide-star-off' } },
                {
                    name: 'Rating preview',
                    desc: rich((fragment) => {
                        fragment.appendText('Ratings currently appear as: ');
                        displayRating(settings, fragment, RatingStroke.combined, '', 3, 5);
                    })
                }
            ]
        },
        {
            type: 'group',
            heading: 'Danger zone',
            items: [
                {
                    name: 'Refresh daily notes',
                    desc: rich((fragment) => {
                        fragment.appendText('Search the entire vault again if daily notes are missing from the ');
                        fragment.createEl('strong', { text: 'Calendar' });
                        fragment.appendText(' or ');
                        fragment.createEl('strong', { text: 'On this day' });
                        fragment.appendText(' view.');
                    }),
                    render: (setting) => {
                        setting.addButton((button) => button
                        .setIcon('lucide-refresh-ccw')
                        .setTooltip('Search the entire vault for daily notes. Use this feature sparingly!')
                        .setWarning()
                        .onClick(() => {
                            const { folder, format }: any = getModifiedFolderAndFormat(settings);
                            plugin.dailyNotes = getAllDailyNotes(folder, format);
                            plugin.sortDailyNotes(folder, format);
                            plugin.refreshViews(true, true);
                            printToConsole(logLevel.info, 'Daily notes refreshed!');
                        }));
                    }
                }
            ]
        }
    ];
}
