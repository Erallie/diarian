import { StrictMode } from "react";
import { App, ItemView, WorkspaceLeaf, TFile, View } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import type Diarian from 'main';
import { ViewType } from 'src/constants';
import { getPriorNotes, getMoment, isSameDay, getModifiedFolderAndFormat } from "src/get-daily-notes";
import { TimeSpan } from './time-span';


interface ContainerProps {
    view: View;
    plugin: Diarian;
    app: App;
}

export class OnThisDayView extends ItemView {
    root: Root | null = null;
    plugin: Diarian;
    app: App;

    constructor(leaf: WorkspaceLeaf, plugin: Diarian, app: App) {
        super(leaf);
        this.plugin = plugin;
        this.app = app;
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
                <div className='on-this-day-container'>
                    <h1>On this day...</h1>
                    <ReviewContainer view={this} plugin={this.plugin} app={this.app} />
                </div>
            </StrictMode>
        );
    }

    async onClose() {
        this.root?.unmount();
    }


    async refresh(plugin: Diarian) {
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
        const momentA = getMoment(fileA, folder, format);
        const momentB = getMoment(fileB, folder, format);
        return momentB.diff(momentA);
    });
    let array = [];
    let i = 0;
    let ii = 0;
    let previousMoment = getMoment(filteredNotes[i], folder, format);

    let subNotes: TFile[] = [];

    for (let note of filteredNotes) {
        if (!note) continue;
        const thisMoment = getMoment(note, folder, format);
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