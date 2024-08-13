import { StrictMode } from "react";
import { App, ItemView, WorkspaceLeaf, TFile, View } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import moment from 'moment';
import type Diarium from 'main';
import { ViewType, printToConsole, logLevel } from '../constants';
import { getPriorNotes, getDate, isSameDay, getDailyNoteSettings } from "../get-daily-notes";
import { TimeSpan } from './time-span';


interface ContainerProps {
    view: View;
    plugin: Diarium;
    app: App;
}

export class OnThisDayView extends ItemView {
    root: Root | null = null;
    plugin: Diarium;
    view: View;
    app: App;

    constructor(leaf: WorkspaceLeaf, plugin: Diarium, view: View, app: App) {
        super(leaf);
        this.plugin = plugin;
        this.view = view;
        this.app = app;
        // this.dailyNotes = this.plugin.dailyNotes;
    }

    getViewType() {
        return ViewType.onThisDayView;
    }

    getDisplayText() {
        return "On this day";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.icon = 'lucide-clock';
        this.root.render(
            <StrictMode>
                <h1>On this day...</h1>
                <ReviewContainer view={this.view} plugin={this.plugin} app={this.app} />
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


const ReviewContainer = ({ view, plugin, app }: ContainerProps) => {
    let filteredNotes = getPriorNotes(plugin.dailyNotes, plugin);
    if (!filteredNotes || filteredNotes.length == 0) {
        return (
            <p>No notes to show.</p>
        )
    }
    filteredNotes.sort(function (fileA, fileB) {
        const momentA = getDate(fileA);
        const momentB = getDate(fileB);
        return momentA.diff(momentB);
    })
    let array = [];
    let i = 0;
    let ii = 0;
    let previousMoment = getDate(filteredNotes[i]);

    let subNotes: TFile[] = [];

    for (let note of filteredNotes) {
        if (!note) continue;
        const thisMoment = getDate(note);
        if (!array[i] && !isSameDay(thisMoment, previousMoment)) {
            array[i] = {
                notes: subNotes,
                moment: previousMoment,
                id: i
            }
            subNotes = [];
            i++;
            previousMoment = thisMoment;
            ii = 0;
        }
        subNotes[ii] = note;
        ii++;
    }
    array[i] = {
        notes: subNotes,
        moment: previousMoment,
        id: i
    }

    /* let subHeading: Array<any> = [];
    for (let o in notesToShow) {
        subHeading[o] = {
            moment: notesToShow[o][0].moment,
            id: notesToShow[o][0].id - 1,
            node: notesToShow[o].map((note: any) =>
                <>
                    <NotePreview key={note.id} note={note} view={view} plugin={plugin} app={app} />
                </>
            )
        }
    } */

    // printToConsole(logLevel.log, `got here`);

    let now = moment();
    let unit = plugin.settings.reviewDelayUnit;
    /* return notesToShow.map((sub: any) =>
        <>
            <h2 key={sub.id}>{
                getTimeSpanTitle(
                    now.diff(sub.moment, (unit + 's') as moment.unitOfTime.Diff),
                    unit
                )
            }</h2>
            {sub.node}
        </>
    ) */
    return (
        <div>
            {array.map(({ notes, moment, id }) => (
                <TimeSpan key={id} notes={notes} thisMoment={moment} view={view} plugin={plugin} app={app} />
            ))}
        </div>
    );
}