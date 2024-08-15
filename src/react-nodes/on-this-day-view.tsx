import { StrictMode } from "react";
import { App, ItemView, WorkspaceLeaf, TFile, View } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import moment from 'moment';
import type Diarium from 'main';
import { ViewType, printToConsole, logLevel } from '../constants';
import { getPriorNotes, getDate, isSameDay, getModifiedFolderAndFormat } from "../get-daily-notes";
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
        this.icon = 'lucide-history';
        this.root.render(
            <StrictMode>
                <h1>On this day...</h1>
                <ReviewContainer view={this/* .view */} plugin={this.plugin} app={this.app} />
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
    const { folder, format }: any = getModifiedFolderAndFormat();
    filteredNotes.sort(function (fileA, fileB) {
        const momentA = getDate(fileA, folder, format);
        const momentB = getDate(fileB, folder, format);
        return momentB.diff(momentA);
    })
    let array = [];
    let i = 0;
    let ii = 0;
    let previousMoment = getDate(filteredNotes[i], folder, format);

    let subNotes: TFile[] = [];

    for (let note of filteredNotes) {
        if (!note) continue;
        const thisMoment = getDate(note, folder, format);
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



    // printToConsole(logLevel.log, `got here`);

    /* let now = moment();
    let unit = plugin.settings.reviewDelayUnit; */

    return (
        <div>
            {array.map(({ notes, moment, id }) => (
                <TimeSpan key={id} notes={notes} thisMoment={moment} view={view} plugin={plugin} app={app} />
            ))}
        </div>
    );
}