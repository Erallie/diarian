import * as React from "react";
import { TFile, View, App } from "obsidian";
// import useContext from "../hooks/useContext";
import NotePreview from "./note-preview";
import { getTimeSpanTitle, Unit } from '../constants';
import type Diarium from '../../main';
import moment from 'moment';

interface Props {
    notes: TFile[];
    thisMoment: any;
    wrapper?: React.JSX.Element;
    view: View;
    plugin: Diarium;
    app: App;
}

export const TimeSpan = ({ notes, thisMoment, wrapper, view, plugin, app }: Props) => {
    const unit = plugin.settings.reviewIntervalUnit;

    if (!notes.length) {
        return null;
    }

    const component = (
        <>
            <h2>{
                getTimeSpanTitle(
                    moment().diff(thisMoment, (unit + 's') as moment.unitOfTime.Diff),
                    unit
                )
            } ago</h2>

            <div>
                {notes.map((note) => (
                    <div key={note.name}>
                        <NotePreview note={note} view={view} plugin={plugin} app={app} />
                    </div>
                ))}
            </div>
        </>
    );

    if (wrapper) {
        return React.cloneElement(wrapper, {}, component);
    }

    return component;
};

export default TimeSpan;