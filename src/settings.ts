import { App, PluginSettingTab, Setting, ButtonComponent } from 'obsidian';
import type Diarium from 'main';
import { Unit, getTimeSpanTitle } from './constants';

export interface DiariumSettings {
    headingFormat: string;
    previewLength: number;
    openInNewPane: boolean;
    useCallout: boolean;
    showNoteTitle: boolean;
    useQuote: boolean;
    reviewInterval: number;
    reviewIntervalUnit: Unit;
    reviewDelay: number;
    reviewDelayUnit: Unit;
}

export const DEFAULT_SETTINGS: DiariumSettings = {
    headingFormat: 'dddd, MMMM Do, YYYY',
    previewLength: 250,
    openInNewPane: true,
    useCallout: true,
    showNoteTitle: true,
    useQuote: true,
    reviewInterval: 3,
    reviewIntervalUnit: Unit.month,
    reviewDelay: 6,
    reviewDelayUnit: Unit.month
}

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

export class DiariumSettingTab extends PluginSettingTab {
    plugin: Diarium;

    constructor(app: App, plugin: Diarium) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl).setName('Calendar').setHeading();

        const headingFormatDescription = new DocumentFragment();
        headingFormatDescription.textContent =
            "The ";
        headingFormatDescription.createEl("a", {
            text: "moment.js",
            attr: {
                href: "https://momentjs.com/docs/#/displaying/format/",
            },
        });
        headingFormatDescription.createEl("span", {
            text: " format for headings in the Calendar view."
        }).createEl("br");
        const sampleFormatContainer = headingFormatDescription.createEl('span', { text: 'Headings will appear as: ' });
        const sampleFormat = sampleFormatContainer.createSpan({ cls: 'text-accent' });

        new Setting(containerEl)
            .setName('Heading format')
            .setDesc(headingFormatDescription)
            .addMomentFormat(text => text
                .setDefaultFormat('dddd, MMMM Do, YYYY')
                .setValue(this.plugin.settings.headingFormat)
                .setSampleEl(sampleFormat)
                .onChange(async (value) => {
                    this.plugin.settings.headingFormat = value;
                    await this.plugin.saveSettings();
                }));



        new Setting(containerEl).setName('Note previews')/* .setDesc('Settings that will apply to note previews in the Calendar view and the \'On this day\' view.') */.setHeading();


        new Setting(containerEl)
            .setName('Preview length')
            .setDesc('The maximum number of characters of content a note preview should display.')
            .addSlider(slider => slider
                .setLimits(0, 500, 10)
                .setValue(this.plugin.settings.previewLength)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.previewLength = value;
                    await this.plugin.saveSettings();
                })
            )

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
                    this.display();
                }),
            );

        if (!this.plugin.settings.useCallout) {
            new Setting(containerEl)
                .setName("Use quote elements to display content")
                .setDesc("Format note previews using the HTML quote element.")
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.useQuote).onChange((value) => {
                        this.plugin.settings.useQuote = value;
                        void this.plugin.saveSettings();
                    }),
                );
        }


        new Setting(containerEl).setName('On this day review').setHeading();

        const IntervalDescription = new DocumentFragment();
        IntervalDescription.textContent =
            "Notes will be displayed in intervals of this amount of time before the current day.";
        IntervalDescription.createEl("br");
        /* IntervalDescription.createEl('span', { text: 'For example, if this is set to every 3 months, notes will be displayed from 3 months ago, 6 months ago, 9 months ago, and so on.' }).createEl('br'); */
        IntervalDescription.createEl('span', { text: ' Currently set to ' }).createEl("span", {
            text: "every " + getTimeSpanTitle(this.plugin.settings.reviewInterval, this.plugin.settings.reviewIntervalUnit), cls: 'text-accent'

        });

        new Setting(containerEl)
            .setName('Review interval')
            .setDesc(IntervalDescription)
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
                        this.display();
                    }),
            );

        const DelayDescription = new DocumentFragment();
        DelayDescription.textContent =
            "Only notes from this long ago or earlier will be included in the 'On this day' view.";
        DelayDescription.createEl("br");
        DelayDescription.createEl('span', { text: ' Currently set to ' }).createEl("span", {
            text: getTimeSpanTitle(this.plugin.settings.reviewDelay, this.plugin.settings.reviewDelayUnit) + " ago or earlier", cls: 'text-accent'

        });

        new Setting(containerEl)
            .setName('Review delay')
            .setDesc(DelayDescription)
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
                        this.display();
                    }),
            );

        new Setting(containerEl)
            .setName("Open notes in a new pane")
            .setDesc("When clicked, notes will open in a new pane/tab by default.")
            .addToggle((toggle) => {
                toggle
                    .setValue(this.plugin.settings.openInNewPane)
                    .onChange((value) => {
                        this.plugin.settings.openInNewPane = value;
                        void this.plugin.saveSettings();
                    });
            });

    }
}
