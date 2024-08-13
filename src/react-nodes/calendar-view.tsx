import { StrictMode } from "react";
import { App, ItemView, WorkspaceLeaf, TFile, View } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar } from 'react-calendar';
import { useState } from 'react';
import moment from 'moment';
import type Diarium from 'main';
import { getDates, getNoteByMoment, isSameDay } from "../get-daily-notes";
import { usePlugin } from "../unused/hooks";
import NotePreview from './note-preview';
import { ViewType } from '../constants';

interface ContainerProps {
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
        return ViewType.calendarView;
    }

    getDisplayText() {
        return "Calendar";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.icon = 'lucide-calendar-search';
        this.root.render(
            <StrictMode>
                <CalendarContainer view={this.view} plugin={this.plugin} app={this.app} />
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }

    async refresh(plugin: Diarium) {
        this.plugin = plugin;
        this.onClose();
        this.onOpen();
    }

}

const CalendarContainer = ({ view, plugin, app }: ContainerProps) => {
    const headingFormat = plugin.settings.headingFormat;
    const dailyNotes = plugin.dailyNotes;
    const filledDates = getDates(dailyNotes);

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
    function tileContent({ date, view }: any) {
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

                const Dots = () => content.map((content: any) =>
                    <>
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

        showNotesNode = notesToShow.map((note: any) =>
            <div key={note.name}>
                <NotePreview note={note.note} view={view} plugin={plugin} app={app} />
            </div>
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