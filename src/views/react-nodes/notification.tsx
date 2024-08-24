import { App, Modal, Setting, ButtonComponent } from 'obsidian';
import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import type Diarian from 'main';
import type { EnhancedApp } from 'main';
import { ReminderDelay, reminderDelayMap } from 'src/settings';
import { printToConsole, logLevel } from 'src/constants';
import moment from 'moment';

export class Notification extends Modal {
    root: Root | null = null;
    plugin: Diarian;

    constructor(app: App, plugin: Diarian) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        const plugin = this.plugin;
        const app = this.app;
        const thisComp = this;


        /* const { contentEl } = this;

        const enhancedApp = this.app as EnhancedApp; */
        /* 
                const settingName = new DocumentFragment;
                settingName.createEl('span', { text: this.msg, cls: 'notification-text' }); */
        /* const settingName = new DocumentFragment;
        const settingDiv = settingName.createDiv({ cls: 'notification-text' })
        settingDiv.append(this.msg);

        new Setting(contentEl).setName(settingName);

        const buttonsDiv = contentEl.createDiv();

        new ButtonComponent(buttonsDiv)
            .setClass('notification-button')
            .setIcon('lucide-history')
            .setButtonText('Open on this day')
            // .setTooltip('Open on this day')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:open-on-this-day`);
                this.close();
            });

        new ButtonComponent(buttonsDiv)
            .setClass('notification-button')
            .setIcon('lucide-history')
            .setButtonText('Open on this day')
            // .setTooltip('Open on this day')
            .onClick(() => {
                enhancedApp.commands.executeCommandById(`${this.plugin.manifest.id}:open-on-this-day`);
                this.close();
            }); */

        const ReminderChoices = () => {
            let options = [];
            let i = 0;
            for (let [key, value] of Object.entries(ReminderDelay)) {
                options[i] = {
                    key: key,
                    value: value,
                    id: i
                }
                i++
            }

            const MappedOptions = () => options.map((option: any) =>
                <option key={option.id} value={option.key}>
                    {option.value}
                </option>
            );
            return (
                <>
                    <MappedOptions />
                </>
            )
        }

        function endReminder() {
            plugin.settings.notifInfo = {
                lastNotified: moment(),
                needToRemind: false
            }
            void plugin.saveSettings();
            thisComp.close();
        }

        function openOnThisDay() {
            const enhancedApp = app as EnhancedApp;
            enhancedApp.commands.executeCommandById(`${plugin.manifest.id}:open-on-this-day`);
            endReminder();
        }

        function remindLater(event: React.ChangeEvent<HTMLSelectElement>) {
            let reminderTime: moment.Moment;
            const mappedReminderDelay = reminderDelayMap[event.target.value as ReminderDelay];
            switch (mappedReminderDelay) {
                case ReminderDelay.fiveMin:
                    reminderTime = moment().add(5, 'minutes');
                    break;
                case ReminderDelay.tenMin:
                    reminderTime = moment().add(10, 'minutes');
                    break;
                case ReminderDelay.thirtyMin:
                    reminderTime = moment().add(30, 'minutes');
                    break;
                case ReminderDelay.oneHr:
                    reminderTime = moment().add(1, 'hour');
                    break;
                case ReminderDelay.twoHr:
                    reminderTime = moment().add(2, 'hours');
                    break;
                default:
                    printToConsole(logLevel.error, `Cannot set reminder:\n"${event.target.value}" is not a valid reminder delay!`);
                    return;
            }
            plugin.settings.notifInfo = {
                lastNotified: moment(),
                needToRemind: true,
                reminderTime: reminderTime
            }
            void plugin.saveSettings();
            plugin.setReminder();
            thisComp.close();
        }

        this.root.render(
            <StrictMode>
                <h2>You have notes from on this day!</h2>
                <div className='notification-buttons'>
                    <button className='notification-select-button' onClick={openOnThisDay}>
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
                            className="lucide lucide-external-link"
                        >
                            <path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                        </svg>Open on this day</button>
                    <button onClick={endReminder}>
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
                            className="lucide lucide-circle-minus"
                        >
                            <circle cx={12} cy={12} r={10} />
                            <path d="M8 12h8" />
                        </svg>Ignore</button>
                    <select className="dropdown" onChange={remindLater}>
                        <option /* disabled={true} */ hidden={true} value="default">Remind me later</option>
                        <ReminderChoices />
                    </select>
                </div>

            </StrictMode >
        );

    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}