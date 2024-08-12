import { StrictMode } from "react";
import { App, ItemView, WorkspaceLeaf, TFile, View } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar } from 'react-calendar';
import { useState } from 'react';
import moment from 'moment';
import type Diarium from 'main';
import { ViewType, getTimeSpanTitle, Unit } from './constants';
import { getDates, getAllDailyNotes, getNoteByMoment, getPriorNotes, getDate, isSameDay } from "./get-daily-notes";
import { usePlugin } from "./hooks";
import NotePreview from './note-preview';


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
                <Container view={this.view} plugin={this.plugin} app={this.app} />
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }

}


const Container = ({ view, plugin, app }: ContainerProps) => {
    let filteredNotes = getPriorNotes(plugin.dailyNotes);
    if (!filteredNotes) {
        return (
            <p>No notes to show.</p>
        )
    }
    filteredNotes.sort(function (fileA, fileB) {
        const momentA = getDate(fileA);
        const momentB = getDate(fileB);
        return momentA.diff(momentB);
    })

    let notesToShow: Array<Array<any>> = [];
    let i = 0;
    let ii = 0;
    let previousMoment = getDate(filteredNotes[i]);
    for (let note of filteredNotes) {
        const thisMoment = getDate(note);
        if (notesToShow[i].length > 0 && !isSameDay(thisMoment, previousMoment)) {
            i++;
            previousMoment = thisMoment;
            ii = 0;
        }
        notesToShow[i][ii] = {
            note: note,
            id: (i * 10) + (ii + 1),
            moment: thisMoment
        };
        ii++;
    }

    let subHeading: Array<any> = [];
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
    }

    let now = moment();
    let unit = plugin.settings.reviewDelayUnit;
    return subHeading.map((sub: any) =>
        <>
            <h2 key={sub.id}>{
                getTimeSpanTitle(
                    now.diff(sub.moment, (unit + 's') as moment.unitOfTime.Diff),
                    unit
                )
            }</h2>
            {sub.node}
        </>
    )
}