import { StrictMode } from "react";
import { Plugin, ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar } from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import moment from 'moment';
import Diarium from './main';

interface CalendarViewProps {
    plugin: Plugin;
}

const CALENDAR_VIEW_TYPE = "calendar-view";

export class CalendarView extends ItemView {
    root: Root | null = null;
    plugin: Plugin;

    constructor(leaf: WorkspaceLeaf, props: CalendarViewProps) {
        super(leaf);
        this.plugin = props.plugin;
    }

    getViewType() {
        return CALENDAR_VIEW_TYPE;
    }

    getDisplayText() {
        return "Calendar";
    }

    async onOpen() {
        // const headerFormat = this.plugin.settings.headerFormat;
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <StrictMode>
                {/* <Container headerFormat='dddd, MMMM Do, YYYY' /> */}
                {/* <Container headerFormat={headerFormat} /> */}
                <Container headerFormat={this.plugin.settings.headerFormat} />
            </StrictMode>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}

const Container = (props: { headerFormat: string }) => {
    const { headerFormat } = props;
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
            else {
                return 'react-calendar__tile';
            }
        }
        else {
            return 'react-calendar__tile';
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
            <h1>{moment(selectedDate).format(headerFormat)}</h1>
            {notesToShow}
            {/* Add functionality to display  */}
            {/* <h4>Hello, React!</h4> */}
        </div>
    )
};