import { TFile, View, App, moment } from "obsidian";
import NotePreview from "./note-preview";
import { Unit } from 'src/constants';
import type Diarian from 'src/main';

interface Props {
    notes: TFile[];
    thisMoment: moment.Moment;
    referenceMoment: moment.Moment;
    /* wrapper?: React.JSX.Element; */
    view: View;
    plugin: Diarian;
    app: App;
}

const formatPart = (amount: number, unit: Unit) =>
    `${amount} ${unit}${amount === 1 ? "" : "s"}`;

const joinParts = (parts: string[]) => {
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
};

export const getElapsedTimeTitle = (
    from: moment.Moment,
    to: moment.Moment,
    smallestUnit: Unit
) => {
    const cursor = from.clone().startOf('day');
    const end = to.clone().startOf('day');
    const parts: string[] = [];

    const years = end.diff(cursor, 'years');
    if (years > 0) {
        parts.push(formatPart(years, Unit.year));
        cursor.add(years, 'years');
    }

    if (smallestUnit !== Unit.year) {
        const months = end.diff(cursor, 'months');
        if (months > 0) {
            parts.push(formatPart(months, Unit.month));
            cursor.add(months, 'months');
        }
    }

    if (smallestUnit === Unit.week || smallestUnit === Unit.day) {
        const remainingDays = end.diff(cursor, 'days');
        const weeks = Math.floor(remainingDays / 7);
        if (weeks > 0) {
            parts.push(formatPart(weeks, Unit.week));
            cursor.add(weeks, 'weeks');
        }
    }

    if (smallestUnit === Unit.day) {
        const days = end.diff(cursor, 'days');
        if (days > 0) parts.push(formatPart(days, Unit.day));
    }

    if (parts.length === 0) {
        return formatPart(0, smallestUnit);
    }

    return joinParts(parts);
};

export const TimeSpan = ({ notes, thisMoment, referenceMoment, /* wrapper, */ view, plugin, app }: Props) => {
    const unit = plugin.settings.reviewIntervalUnit;
    // printToConsole(logLevel.log, thisMoment.toString());


    const now = referenceMoment.clone().endOf('day');

    if (!notes.length) {
        return null;
    }

    const component = (
        <>
            <h2>{
                getElapsedTimeTitle(thisMoment, now, unit)
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
