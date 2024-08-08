import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import moment from 'moment';
type ValuePiece = Date | null;


type Value = ValuePiece | [ValuePiece, ValuePiece];

const CALENDAR_VIEW_TYPE = "calendar-view";

export class CalendarView extends ItemView {
    root: Root | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return CALENDAR_VIEW_TYPE;
    }

    getDisplayText() {
        return "Example view";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <StrictMode>
                <Container />
            </StrictMode>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}

const Container = () => {
    function isSameDay(date1, date2) {
        return (date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear());
    }

    let notesToShow;
    const today = new Date();
    const [selectedDate, setDate] = useState(new Date());
    const filledDates = [today];

    function tileClassName({ date, view }) {
        // Add class to tiles in month view only
        if (view === 'month') {
            // Check if a date React-Calendar wants to check is on the list of dates to add class to
            if (filledDates.find(dDate => isSameDay(dDate, date))) {
                return 'filled-date';
            }
        }
    }
    /* function showNotes(nextDate) {
        setDate(nextDate)
    } */

    if (isSameDay(selectedDate, today)) {
        notesToShow = <p>Insert notes to show here!</p>;
    } else {
        notesToShow = <p>There are no notes on this day.</p>;
    }
    return (
        <div>
            <Calendar onClickDay={setDate} value={selectedDate} tileClassName={tileClassName} />
            {/* set "formatDay" to be changed in the settings */}
            <h1>{moment(selectedDate).format("dddd, MMMM Do, YYYY")}</h1>
            {notesToShow}
            {/* Add functionality to display  */}
            {/* <h4>Hello, React!</h4> */}
        </div>
    )
};