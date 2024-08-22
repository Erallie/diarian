import { StrictMode } from "react";
import { Root, createRoot } from "react-dom/client";
import { App, Modal } from "obsidian";
import type Diarian from 'main';
import moment from 'moment';
import { writeNote } from 'src/import-journal';
import { getModifiedFolderAndFormat } from 'src/get-daily-notes';

const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'kk:mm:ss';

export class NewDailyNote extends Modal {
    root: Root | null = null;
    plugin: Diarian;
    dateString: string;
    timeString: string;

    constructor(app: App, plugin: Diarian, date?: moment.Moment) {
        super(app);
        this.plugin = plugin;

        if (date) this.dateString = moment(date).format(DATE_FORMAT);
        else this.dateString = moment().format(DATE_FORMAT);

        this.timeString = moment().format(TIME_FORMAT);
    }

    onOpen() {
        this.root = createRoot(this.containerEl.children[1]);

        const modal = this;

        let dateString = this.dateString;
        let timeString = this.timeString;

        function createNote() {
            // printToConsole(logLevel.log, dateString + timeString);
            const noteDate = moment(dateString + timeString, DATE_FORMAT + TIME_FORMAT);

            const { format, folder } = getModifiedFolderAndFormat();

            writeNote(noteDate, '', format, folder, true);
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

        this.root.render(
            <StrictMode>

                <div className="new-note-div">
                    <label htmlFor='date' className='new-note-label'>Date</label>
                    <input id='date' className='new-note-input' type="date" onChange={setDate} defaultValue={dateString} />
                </div>
                <div className="new-note-div">
                    <label htmlFor='time' className='new-note-label'>Time</label>
                    <input id='time' className='new-note-input' type="time" onChange={setTime} defaultValue={timeString} />
                </div>
                <button onClick={createNote} >Create note</button>
                {/* </div> */}

            </StrictMode>
        );


    }

    onClose() {
        this.root?.unmount();
    }
}