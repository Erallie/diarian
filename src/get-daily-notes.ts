import { normalizePath, TFile, moment } from 'obsidian';
import Diarian from 'src/main';
import { printToConsole, logLevel, Unit, DEFAULT_FORMAT } from './constants';

// const vault: Vault = app.vault;


export function getDailyNoteSettings() {
    /* from: https://github.com/liamcain/obsidian-daily-notes-interface/blob/123969e461b7b0927c91fe164a77da05f43aba6a/src/settings.ts#L22 */
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // const { internalPlugins } = <any>window.app;
        const { internalPlugins } = this.app;

        const { folder, format, template } =
            internalPlugins.getPluginById("daily-notes")?.instance?.options || {};


        const templateFolder =
            internalPlugins.getPluginById("templates")?.instance?.options.folder || null;

        const { dateFormat, timeFormat } =
            internalPlugins.getPluginById("templates")?.instance?.options || {};

        // console.log("Daily note settings found.\n\tformat = " + format);
        return {
            format: format || "YYYY-MM-DD",
            folder: folder?.trim() || "",
            defaultTemplate: template?.trim() || "",
            templateFolder: templateFolder || "",
            dateFormat: dateFormat || "YYYY-MM-DD",
            timeFormat: timeFormat || "HH:mm"
        };
    } catch (err) {
        const errorText = "No custom daily note settings found!"
        printToConsole(logLevel.info, `${errorText}\n${err}`);
        return {
            format: 'YYYY-MM-DD',
            folder: '',
            defaultTemplate: "",
            templateFolder: "",
            dateFormat: "YYYY-MM-DD",
            timeFormat: "HH:mm"
        };
    }
}


export function getAllDailyNotes(folder: string, format: string) {

    const allFiles = this.app.vault.getFiles();
    const filteredFiles = allFiles.filter((file: TFile) => {
        // const { format, folder } = getModifiedFolderAndFormat();
        return isDailyNote(file, folder, format);
    });
    // printToConsole(logLevel.log, filteredFiles.length.toString());
    return filteredFiles;
};

export function isDailyNote(file: TFile, folder: string, format: string, pathOverride?: string) {

    // const index = (path + file.name).search(regex);

    let checkIndex;
    if (folder != '')
        checkIndex = folder.length;
    else
        checkIndex = 0;

    // printToConsole(logLevel.log, file.path);
    let path = file.path;
    if (pathOverride)
        path = pathOverride;

    let matchesBookends;
    if (checkIndex == 0)
        matchesBookends = path.endsWith('.md');
    else
        matchesBookends = path.startsWith(folder) && path.endsWith('.md');

    // printToConsole(logLevel.log, folder);

    if (matchesBookends) {
        const newName = path.slice(checkIndex, path.length - '.md'.length);
        const result = moment(newName, format, false).isValid();
        // if (result) {
        // printToConsole(logLevel.log, newName + " vs " + format);
        return result;
        // }
    }

    // return index == checkIndex;
}

export function getMoments(notes: TFile[], folder: string, format: string) {

    let allDates = [];
    let i = 0;
    for (let note of notes) {
        allDates[i] = getMoment(note, folder, format);
        i++;
    }
    // console.log(allDates[allDates.length - 1].toString());
    return allDates;
}

export function getMoment(note: TFile, folder: string, format: string) {
    // printToConsole(logLevel.log, note.path);
    // let baseName = note.path + '/' + note.name;
    let index = 0;
    if (folder != '')
        index = folder.length;

    let baseName = note.path.slice(index);
    const noteDate = moment(baseName, format);
    return noteDate;
}

export function getNoteByMoment(moment: moment.Moment, folder: string, format: string) {
    // console.log(moment.format(getDailyNoteSettings().format));
    let path = moment.format(format);
    path = normalizePath(folder + path + '.md');
    // console.log(path);
    const note = this.app.vault.getFileByPath(path);
    if (note === null) {
        printToConsole(logLevel.warn, `Could not get any notes with the date ${moment.format(format)}.`);
    }
    return note;
    //
}


export function isSameDay(date1: moment.Moment, date2: moment.Moment) {
    return (
        date1.date() == date2.date()
        && date1.month() == date2.month()
        && date1.year() == date2.year());
}

export function getPriorNotes(allNotes: TFile[], plugin: Diarian) {
    const now = moment().endOf('day');

    // printToConsole(logLevel.log, now.format('MMMM Do, YYYY [at] h:mm:ss.SSS A'));
    const reviewInterval = plugin.settings.reviewInterval;
    const delayUnit = plugin.settings.reviewDelayUnit + 's' as moment.unitOfTime.Diff;

    let filteredNotes: TFile[] = [];
    let i = 0;

    const { format, folder }: any = getModifiedFolderAndFormat();

    for (let note of allNotes) {
        const noteDate = getMoment(note, folder, format);
        const delayDiff = now.diff(noteDate, delayUnit, true)/*  + 1 */;
        //this might make it so that you need to be past the time of day for the note too. Consider making all .diff references rounded.
        const isInRange = delayDiff >= plugin.settings.reviewDelay;

        let isMatch: boolean = false;
        let intervalDiff = 0;

        switch (plugin.settings.reviewIntervalUnit) {
            case Unit.day:
                intervalDiff = now.diff(noteDate, 'days')/*  + 1 */;
                isMatch = (intervalDiff % reviewInterval == 0);
                break;
            case Unit.week:
                // intervalUnit = 'weeks';
                intervalDiff = now.diff(noteDate, 'weeks')/*  + 1 */;
                isMatch = (intervalDiff % reviewInterval == 0) && now.day() == noteDate.day();
                break;
            case Unit.month:
                // intervalUnit = 'months';
                intervalDiff = now.diff(noteDate, 'months')/*  + 1 */;
                isMatch = (intervalDiff % reviewInterval == 0) && now.date() == noteDate.date();
                break;
            case Unit.year:
                // intervalUnit = 'years';
                intervalDiff = now.diff(noteDate, 'years')/*  + 1 */;
                isMatch = (intervalDiff % reviewInterval == 0) && now.month() == noteDate.month() && now.date() == noteDate.date();
                break;
            default:
                printToConsole(logLevel.error, 'Could not fetch prior notes:\nreviewIntervalUnit is not properly defined!');
                return null;
        }
        if (isInRange && isMatch) {
            filteredNotes[i] = note;

            // printToConsole(logLevel.log, `Added ${note.name}`);
        }
        // printToConsole(logLevel.log, `got here`);
        // printToConsole(logLevel.log, `Added ${note.name}`);
        i++;
    }


    // printToConsole(logLevel.log, filteredNotes.length);
    return filteredNotes;
}

export function getModifiedFolderAndFormat() {
    let { format, folder }: any = getDailyNoteSettings();

    let newFormat = DEFAULT_FORMAT;
    if (format && format != '') newFormat = normalizePath(format);

    let newFolder = '';
    if (folder && normalizePath(folder) == '/') newFolder = '';
    else if (folder && normalizePath(folder) != '') newFolder = normalizePath(folder) + '/';

    // printToConsole(logLevel.log, newFolder);
    return {
        folder: newFolder,
        format: newFormat
    }
}