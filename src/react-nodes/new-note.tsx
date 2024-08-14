import * as React from "react";
import { Root, createRoot } from "react-dom/client";
import { TFile, View, App, Modal, normalizePath } from "obsidian";
// import useContext from "../hooks/useContext";
import type Diarium from '../../main';
import { printToConsole, logLevel, DEFAULT_FORMAT } from '../constants';
import moment from 'moment';
import { writeNote } from '../import-journal';
import { getDailyNoteSettings } from '../get-daily-notes';

const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'kk:mm:ss';

export class NewDailyNote extends Modal {
    root: Root | null = null;
    plugin: Diarium;
    dateString: string;
    timeString: string;

    constructor(app: App, plugin: Diarium, date?: any) {
        super(app);
        this.plugin = plugin;

        if (date) this.dateString = moment(date).format(DATE_FORMAT);
        else this.dateString = moment().format(DATE_FORMAT);

        this.timeString = moment().format(TIME_FORMAT);
    }

    onOpen() {
        this.root = createRoot(this.containerEl.children[1]);

        const modal = this;

        /* if (this.date) this.dateString = moment(this.date).format(DATE_FORMAT);
        else this.dateString = moment().format(DATE_FORMAT);

        this.timeString = moment().format(TIME_FORMAT); */
        // contentEl.setText('Open view');

        // contentEl.createEl('br');

        /* const openCalendarButton = new DocumentFragment();
        openCalendarButton.createEl('img', {
            text: "Open calendar",
            attr: {
                src: "Attachments/icons/lucide-calendar-search.svg"
            },
        });
        openCalendarButton.createEl('span', { text: ' Open calendar' }); */


        /* const [selectedDate, setDate] = React.useState(moment().format('YYYY-MM-DD'));

        function setNewDate(value: any) {
            setDate(value);
        } */

        /* 
                const [dateString, setDateString] = React.useState(this.dateString);
                const [timeString, setTimeString] = React.useState(this.timeString); */

        let dateString = this.dateString;
        let timeString = this.timeString;
        // let dateTimeString = dateString + 'T' + timeString;

        function createNote(event: React.MouseEvent<HTMLButtonElement>) {
            // printToConsole(logLevel.log, dateString + timeString);
            const noteDate = moment(dateString + timeString, DATE_FORMAT + TIME_FORMAT);

            let { format, folder }: any = getDailyNoteSettings();
            if (format == '') format = DEFAULT_FORMAT;

            let newFolder = '';

            if (normalizePath(folder) == '/') newFolder = normalizePath(folder);
            else if (normalizePath(folder) != '') newFolder = normalizePath(folder) + '/';

            writeNote(noteDate, '', format, newFolder, true);
            modal.close();
        }

        function setDate(event: React.ChangeEvent<HTMLInputElement>) {
            dateString = event.target.value;
            // printToConsole(logLevel.log, dateString);
        }

        function setTime(event: React.ChangeEvent<HTMLInputElement>) {
            timeString = event.target.value;
            // printToConsole(logLevel.log, timeString);
        }
        /* function setDateTime(event: React.ChangeEvent<HTMLInputElement>) {
            dateTimeString = event.target.value;
            // printToConsole(logLevel.log, timeString);
        } */

        /* async function formAction(data: FormData) {
            let noteMoment = moment(data.get('date')?.toString(), 'YYYY-MM-DD');
        } */
        this.root.render(
            <React.StrictMode>

                {/* <input id='date' className='new-note-input' aria-label="Date and Time" type="datetime-local" defaultValue={dateTimeString} onChange={setDateTime} /> */}
                <div className="new-note-div">
                    <label htmlFor='date' className='new-note-label'>Date</label>
                    <input id='date' className='new-note-input' aria-label="Date" type="date" onChange={setDate} defaultValue={dateString} />
                </div>
                <div className="new-note-div">
                    <label htmlFor='time' className='new-note-label'>Time</label>
                    <input id='time' className='new-note-input' aria-label="Time" type="time" onChange={setTime} defaultValue={timeString} />
                </div>
                <button onClick={createNote} >Create note</button>

            </React.StrictMode>
        );


    }

    onClose() {
        this.root?.unmount();
    }
}