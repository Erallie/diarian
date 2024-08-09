import { StrictMode } from "react";
import { Plugin, ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar } from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import moment from 'moment';
import type Diarium from 'main';
import { getDates, getDailyNotes } from "get-daily-notes";

const CALENDAR_VIEW_TYPE = "calendar-view";

interface ContainerProps {
    headerFormat: string;
    dates: any;
}

export class CalendarView extends ItemView {
    root: Root | null = null;
    plugin: Diarium;

    constructor(leaf: WorkspaceLeaf, plugin: Diarium) {
        super(leaf);
        this.plugin = plugin;
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
        this.icon = 'lucide-calendar-search';
        this.root.render(
            <StrictMode>
                {/* <Container headerFormat='dddd, MMMM Do, YYYY' /> */}
                {/* <Container headerFormat={headerFormat} /> */}
                <Container headerFormat={this.plugin.settings.headerFormat} dates={getDates(getDailyNotes())} />
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}

const Container = ({ headerFormat, dates }: ContainerProps) => {
    /* function isSameDay(date1: Date, date2: Date) {
        return (date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear());
    } */

    let notesToShow;
    const today = new Date();
    const [selectedDate, setDate] = useState(new Date());
    const filledDates = dates;

    function tileClassName({ date, view }) {
        // Add class to tiles in month view only
        if (view === 'month') {
            // Check if a date React-Calendar wants to check is on the list of dates to add class to
            if (filledDates.find(dDate => dDate.isSame(moment(date)))) {
                return 'filled-date';
            }
            else if (moment(date).isSame(moment(today))) { //DON'T KNOW IF I NEED THIS
                return 'react-calendar__tile--now';
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

    if (filledDates.find(dDate => dDate.isSame(moment(selectedDate)))) {
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