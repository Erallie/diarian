import { StrictMode } from "react";
import { Plugin, ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar } from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
import moment from 'moment';
import type Diarium from 'main';
import { getDates, getAllDailyNotes, getNoteByMoment } from "get-daily-notes";
import { usePlugin } from "./hooks";

const CALENDAR_VIEW_TYPE = "calendar-view";

interface ContainerProps {
    headerFormat: string;
    dailyNotes: TFile[];
    previewLength: number;
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
                <Container headerFormat={this.plugin.settings.headerFormat} dailyNotes={getAllDailyNotes()} previewLength={this.plugin.settings.previewLength} />
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }

}

const Container = ({ headerFormat, dailyNotes, previewLength }: ContainerProps) => {
    const filledDates = getDates(dailyNotes);
    function isSameDay(date1: any, date2: any) {
// return (date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear());

        return (date1.date() == date2.date() && date1.month() == date2.month() && date1.year() == date2.year());

    }

    const today = moment(new Date());
    const [selectedDate, setDate] = useState(new Date());

    function tileClassName({ date, view }) {
        // Add class to tiles in month view only
        if (view === 'month') {
            // Check if a date React-Calendar wants to check is on the list of dates to add class to
            if (filledDates.find(dDate => isSameDay(moment(date), dDate))) {
                return 'filled-date';
            }
            else if (isSameDay(moment(date), today)) { //DON'T KNOW IF I NEED THIS
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

    let filteredNotes = [];
    let showNotesNode;
    if ((filteredNotes = filledDates.filter(dDate => isSameDay(moment(selectedDate), dDate))).length !== 0) {
        let notesToShow = [];
        let i = 0;
        for (let note of filteredNotes) {
            showNotesNode = notesToShow.map(note =>
                <>
                    <h3 key={note.id}>{note.title}</h3>
                    <p></p>
                </>
            );
        }
    }
    else {
            showNotesNode = <p>There are no notes on this day.</p>;
    }
    return (
        <div>
            <Calendar onClickDay={setDate} value={selectedDate} tileClassName={tileClassName} />
            {/* set "formatDay" to be changed in the settings */}
            <h1>{moment(selectedDate).format(headerFormat)}</h1>
            {showNotesNode}
            {/* Add functionality to display  */}
            {/* <h4>Hello, React!</h4> */}
        </div>
    )
};