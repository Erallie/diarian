import { TFile, View, App } from "obsidian";
// import useContext from "../hooks/useContext";
import NotePreview from "./note-preview";
import { getTimeSpanTitle, Unit, printToConsole, logLevel } from 'src/constants';
import type Diarian from 'main';
import moment from 'moment';

interface Props {
    notes: TFile[];
    thisMoment: moment.Moment;
    /* wrapper?: React.JSX.Element; */
    view: View;
    plugin: Diarian;
    app: App;
}

export const TimeSpan = ({ notes, thisMoment, /* wrapper, */ view, plugin, app }: Props) => {
    const unit = plugin.settings.reviewIntervalUnit;
    // printToConsole(logLevel.log, thisMoment.toString());


    const now = moment().hour(0).minute(0).second(0).millisecond(0);

    if (!notes.length) {
        return null;
    }

    const component = (
        <>
            <h2>{
                getTimeSpanTitle(
                    now.diff(thisMoment, (unit + 's') as moment.unitOfTime.Diff),
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

    /* if (wrapper) {
        return React.cloneElement(wrapper, {}, component);
    } */

    return component;
};

export default TimeSpan;