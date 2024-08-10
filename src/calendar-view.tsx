import { StrictMode } from "react";
import { App, ItemView, WorkspaceLeaf, TFile, View } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar } from 'react-calendar';
import { useState } from 'react';
import moment from 'moment';
import type Diarium from 'main';
import { getDates, getAllDailyNotes, getNoteByMoment } from "./get-daily-notes";
import { usePlugin } from "./hooks";
import NotePreview from './note-preview';

const CALENDAR_VIEW_TYPE = "calendar-view";

interface ContainerProps {
    headingFormat: string;
    dailyNotes: TFile[];
    view: View;
    plugin: Diarium;
    app: App;
}

export class CalendarView extends ItemView {
    root: Root | null = null;
    plugin: Diarium;
    view: View;
    app: App;

    constructor(leaf: WorkspaceLeaf, plugin: Diarium, view: View, app: App) {
        super(leaf);
        this.plugin = plugin;
        this.view = view;
        this.app = app;
    }

    getViewType() {
        return CALENDAR_VIEW_TYPE;
    }

    getDisplayText() {
        return "Calendar";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.icon = 'lucide-calendar-search';
        this.root.render(
            <StrictMode>
                <Container headingFormat={this.plugin.settings.headingFormat} dailyNotes={getAllDailyNotes()} view={this.view} plugin={this.plugin} app={this.app} />
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }

}

const Container = ({ headingFormat, dailyNotes, view, plugin, app }: ContainerProps) => {
    const filledDates = getDates(dailyNotes);
    function isSameDay(date1: any, date2: any) {
        // return (date1.getDate() == date2.getDate() && date1.getMonth() == date2.getMonth() && date1.getFullYear() == date2.getFullYear());

        return (date1.date() == date2.date() && date1.month() == date2.month() && date1.year() == date2.year());

    }

    const today = moment(new Date());
    const [selectedDate, setDate] = useState(new Date());

    function tileClassName({ date, view }: any) {
        // Add class to tiles in month view only
        if (view === 'month') {
            // Check if a date React-Calendar wants to check is on the list of dates to add class to
            if (filledDates.find(dDate => isSameDay(moment(date), dDate))) {
                return 'filled-date';
            }
            else if (isSameDay(moment(date), today)) { //DON'T KNOW IF I NEED THIS
                return 'react-calendar__tile--active';
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
    function tileContent({ date, view }) {
        if (view === 'month') {
            let filteredDates = [];
            if ((filteredDates = filledDates.filter(dDate => isSameDay(moment(date), dDate))).length !== 0) {
                let content: any = [];
                let i = 0;
                for (let date of filteredDates) {
                    content[i] = {
                        id: i,
                        date: date
                    }
                    i++;
                }

                const Dots = () => content.map(content =>
                    <>
                        {/* <svg key={content.id} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="calendar-dot"><circle cx="12.1" cy="12.1" r="1" /></svg> */}
                        <span className='calendar-dot'>•</span>
                    </>
                );
                return (
                    <div className='dot-container'>
                        <Dots />
                    </div>
                )
            }

        }
    }

    let filteredDates = [];
    let showNotesNode;
    if ((filteredDates = filledDates.filter(dDate => isSameDay(moment(selectedDate), dDate))).length !== 0) {
        let i = 0;
        let notesToShow: any = [];
        for (let date of filteredDates) {
            let note: TFile = getNoteByMoment(date);
            notesToShow[i] = {
                note: note,
                id: i
            };
            i++;
        }

        showNotesNode = notesToShow.map(note =>
            <>
                <NotePreview key={note.id} note={note.note} view={view} plugin={plugin} app={app} />
            </>
        );
    }
    else {
        showNotesNode = <p>There are no notes on this day.</p>;
    }
    return (
        <div className='calendar-container'>
            <Calendar onClickDay={setDate} value={selectedDate} tileClassName={tileClassName} tileContent={tileContent} />
            <h1>{moment(selectedDate).format(headingFormat)}</h1>
            {showNotesNode}
        </div>
    )
};