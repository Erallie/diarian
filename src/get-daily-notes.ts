import { App, Vault, normalizePath, Notice, TFile } from 'obsidian';
import Diarium from 'main';
import moment from 'moment';
import { printToConsole, logLevel, Unit, DEFAULT_FORMAT } from './constants';

// const vault: Vault = app.vault;

/* export function momentToRegex(format: string): RegExp {
    const cardinal = (maxTeens: number) => {
        const ignoreTeens = "(?<!1)";
        switch (maxTeens) {
            case 0:
                return `(((?<=${ignoreTeens}1)st)|((?<=${ignoreTeens}2)n\\d)|((?<=${ignoreTeens}3)r\\d)|((?<!1|2|3)t\\h))`;
            case 1:
                return `(((?<=${ignoreTeens}1)st)|((?<=${ignoreTeens}2)n\\d)|((?<=${ignoreTeens}3)r\\d)|((?<!${ignoreTeens}1|2|3)t\\h))`;
            case 2:
                return `(((?<=${ignoreTeens}1)st)|((?<=${ignoreTeens}2)n\\d)|((?<=${ignoreTeens}3)r\\d)|((?<!${ignoreTeens}1|${ignoreTeens}2|3)t\\h))`;
            case 3:
                return `(((?<=${ignoreTeens}1)st)|((?<=${ignoreTeens}2)n\\d)|((?<=${ignoreTeens}3)r\\d)|((?<!${ignoreTeens}1|${ignoreTeens}2|${ignoreTeens}3)t\\h))`;
            default:
                return "";
        }
    }

    let regexString = format.replaceAll(/([\\\.\^\$\*\+\?\|\(\)\{\}])/g, "\\$1");
    let bracketRegex = /\[.*\]/g;
    let bracketArray = format.match(bracketRegex);
    regexString = regexString.replaceAll(bracketRegex, "$"); // When searching for it, use regex /(?<!\\)\$/g
    regexString = regexString
        .replaceAll('ss', '[0-5][0-9]')
        .replaceAll('s', '[1-5]?[0-9]')
        .replaceAll('A', '(A|P)\\M')
        .replaceAll('a', '(a|p)\\m')
        .replaceAll('zz', '[A-Z]{3,6}')
        .replaceAll('z', '[A-Z]{3,6}')
        .replaceAll('ZZ', '[-+]((0[0-9])|(1[0-2]))[0-5][0-9]')
        .replaceAll('Z', '[-+]((0[0-9])|(1[0-2])):[0-5][0-9]')
        .replaceAll('MMMM', '[A-Z][a-z]{2,8}')
        .replaceAll('MMM', '[A-Z][a-z]{2}')
        .replaceAll('MM', '((1[0-2])|(0[1-9]))')
        .replaceAll('Mo', `((1[0-2])|[1-9])${cardinal(2)}`)
        .replaceAll(/(?<!\\)M/g, '((1[0-2])|[1-9])')
        .replaceAll('Qo', '((1st)|(2n\\d)|(3r\\d)|(4t\\h))')
        .replaceAll('Q', '[1-4]')
        .replaceAll('DDDD', '(?!0{3})(([1-2][0-9]{2})|(3(([0-5][0-9])|(6[0-6])))|(0[0-9]{2}))')
        .replaceAll('DDDo', `(([1-2][0-9]{2})|(3(([0-5][0-9])|(6[0-6])))|([1-9][0-9])|[1-9])${cardinal(3)}`)
        .replaceAll('DDD', '(([1-2][0-9]{2})|(3(([0-5][0-9])|(6[0-6])))|([1-9][0-9])|[1-9])')
        .replaceAll('DD', '(([1-2][0-9])|(3[0-1])|(0[1-9]))')
        .replaceAll('Do', `(([1-2][0-9])|(3[0-1])|[1-9])${cardinal(3)}`)
        .replaceAll('D', '(([1-2][0-9])|(3[0-1])|[1-9])')
        .replaceAll('dddd', '[A-Z][a-z]{5,8}')
        .replaceAll('ddd', '[A-Z][a-z]{2}')
        .replaceAll('dd', '[A-Z][a-z]')
        .replaceAll('do', `[0-6]${cardinal(0)}`)
        .replaceAll(/(?<!\\)d/g, '[0-6]')
        .replaceAll('e', '[0-6]') // THIS IS BASED ON LOCALE: THIS REGEX MAY NOT BE CORRECT
        .replaceAll('E', '[1-7]')
        .replaceAll('ww', '(([1-4][0-9])|(5[0-3])|(0[1-9]))')
        .replaceAll('wo', `(([1-4][0-9])|(5[0-3])|[1-9])${cardinal(3)}`)
        .replaceAll('w', '(([1-4][0-9])|(5[0-3])|[1-9])')
        .replaceAll('WW', '(([1-4][0-9])|(5[0-3])|(0[1-9]))')
        .replaceAll('Wo', `(([1-4][0-9])|(5[0-3])|[1-9])${cardinal(3)}`)
        .replaceAll('W', '(([1-4][0-9])|(5[0-3])|[1-9])')
        .replaceAll('YYYYYY', '[-+][0-9]{6}')
        .replaceAll('YYYY', '[0-9]{4}')
        .replaceAll('YY', '[0-9]{2}')
        .replaceAll('Y', '(\\+[1-9][0-9]*)?([0-9]{4})')
        .replaceAll('y', '(?!0+)[0-9]{4}') // THIS IS NOT REFINED, AND I DO NOT KNOW IF IT MATCHES 'ERA YEAR' COMPLETELY!
        .replaceAll('NNNNN', '((BC)|(AD))')
        .replaceAll('NNNN', '((Before C\\hrist)|(Anno Do\\mini))')
        .replaceAll('NNN', '((BC)|(AD))')
        .replaceAll('NN', '((BC)|(AD))')
        .replaceAll('N', '((BC)|(AD))')
        .replaceAll('gggg', '[0-9]{4}')
        .replaceAll('gg', '[0-9]{2}')
        .replaceAll('GGGG', '[0-9]{4}')
        .replaceAll('GG', '[0-9]{2}')
        .replaceAll('HH', '(([0-1][0-9])|(2[0-3]))')
        .replaceAll('H', '((1[0-9])|(2[0-3])|[0-9])')
        .replaceAll('hh', '((1[0-2])|(0[1-9]))')
        .replaceAll(/(?<!\\)h/g, '((1[0-2])|[1-9])')
        .replaceAll('kk', '(([0-1][0-9])|(2[0-4]))')
        .replaceAll('k', '((1[0-9])|(2[0-4])|[1-9])')
        .replaceAll('mm', '[0-5][0-9]')
        .replaceAll(/(?<!\\)m/g, '[1-5]?[0-9]')
        .replaceAll('S', '[0-9]')
        .replaceAll('XX', '[0-9]{13}')
        .replaceAll('X', '[0-9]{10}')
        .replaceAll('\\d', 'd'); // to make sure the \d in the cardinals don't become digits

    // console.log(`regexString =\n\t${regexString}`);
    let newString = '';
    if (bracketArray !== null) {
        let match;
        let lastIndex = 0;
        const matchRegex = /(?<!\\)\$/g;
        let i = 0;
        while ((match = matchRegex.exec(regexString)) !== null) {
            newString += regexString.slice(lastIndex, match.index);
            newString += bracketArray[i].slice(1, -1);
            lastIndex = match.index + match[0].length;
            i++
        }
        newString += regexString.slice(lastIndex);
    }
    else {
        newString = regexString;
    }
    // console.log(`newString = ${newString}`);
    return new RegExp(newString, "g");
} */


export function getDailyNoteSettings() {
    /* from: https://github.com/liamcain/obsidian-daily-notes-interface/blob/123969e461b7b0927c91fe164a77da05f43aba6a/src/settings.ts#L22 */
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // const { internalPlugins } = <any>window.app;
        const { internalPlugins } = this.app;

        const { folder, format } =
            internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
        // console.log("Daily note settings found.\n\tformat = " + format);
        return {
            format: format,
            folder: folder?.trim() || "",
        };
    } catch (err) {
        const errorText = "No custom daily note settings found!"
        printToConsole(logLevel.info, `${errorText}\n${err}`);
        return {
            format: 'YYYY-MM-DD',
            folder: '',
        };
    }
}


export function getAllDailyNotes() {

    const allFiles = this.app.vault.getFiles();
    const filteredFiles = allFiles.filter((file: TFile) => {
        const { format, folder } = getDailyNoteSettings();
        return isDailyNote(file, format, folder);
    });
    // printToConsole(logLevel.log, filteredFiles.length.toString());
    return filteredFiles;
};

export function isDailyNote(file: TFile, format?: string, folder?: string) {
    let newFormat = '';
    if (format) {
        newFormat = format;
    }
    else {
        newFormat = getDailyNoteSettings().format;
    }
    
    let newFolder = '';
    if (folder) {
        newFolder = folder;
    }
    else {
        newFolder = getDailyNoteSettings().folder;
    }

    // let regexString = normalizePath(newFormat);
    let normalizedFormat = normalizePath(newFormat);
    // const regex = momentToRegex(regexString);

    /* let path = '';
    if (file.path != '') {
        path = file.path + '/';
    }
 */
    
    // const index = (path + file.name).search(regex);

    let checkIndex;
    if (newFolder != '') {
        checkIndex = newFolder.length + 1;
    }
    else {
        checkIndex = 0;
    }

    const path = file.path;
    const matchesBookends = path.startsWith(newFolder) && path.endsWith('.md');
    if (matchesBookends) {
        const newName = path.slice(checkIndex, path.length - 3);
        const result = moment(newName, normalizedFormat).isValid();
        // if (result) {
        // printToConsole(logLevel.log, newName + " vs " + normalizedFormat);
        return result;
        // }
    }

    // return index == checkIndex;
}

export function getDates(notes: TFile[], format?: string) {
    if (!format) {
        format = getDailyNoteSettings().format;
    }
    let allDates = [];
    let i = 0;
    for (let note of notes) {
        allDates[i] = getDate(note, format);
        i++;
    }
    // console.log(allDates[allDates.length - 1].toString());
    return allDates;
}

export function getDate(note: TFile, format?: string) {
    if (!format) {
        format = getDailyNoteSettings().format;
    }
    let baseName = note.path + '/' + note.name;
    baseName = baseName.slice(getDailyNoteSettings().folder.length + 1);
    const noteDate = moment(baseName, format);
    return noteDate;
}

export function getNoteByMoment(moment: any, folder?: string, format?: string) {
    let newFormat = '';
    if (!format) {
        newFormat = getDailyNoteSettings().format;
    }
    else {
        newFormat = format;
    }

    let newFolder = '';
    if (!folder) {
        newFolder = getDailyNoteSettings().folder;
    }
    else {
        newFolder = newFolder;
    }

    const normalizedFormat = normalizePath(newFormat);
    // console.log(moment.format(getDailyNoteSettings().format));
    let path = moment.format(normalizedFormat);
    path = normalizePath(newFolder + '/' + path + '.md');
    // console.log(path);
    const note = this.app.vault.getFileByPath(path);
    if (note === null) {
        printToConsole(logLevel.warn, `Could not get any notes with the date ${moment.format(normalizedFormat)}.`);
    }
    return note;
    //
}


export function isSameDay(date1: any, date2: any) {
    return (
        date1.date() == date2.date()
        && date1.month() == date2.month()
        && date1.year() == date2.year());
}

export function getPriorNotes(allNotes: TFile[], plugin: Diarium) {

    const now = moment();
    const format = getDailyNoteSettings().format;
    const reviewInterval = plugin.settings.reviewInterval;
    const delayUnit = plugin.settings.reviewDelayUnit + 's';

    let filteredNotes: TFile[] = [];
    let i = 0;

    for (let note of allNotes) {
        const noteDate = getDate(note, format);
        const delayDiff = now.diff(noteDate, delayUnit as moment.unitOfTime.Diff, true);
        const isInRange = delayDiff >= plugin.settings.reviewDelay;

        let isMatch: boolean = false;
        let intervalDiff = 0;

        switch (plugin.settings.reviewIntervalUnit) {
            case Unit.day:
                intervalDiff = now.diff(noteDate, 'days');
                isMatch = (intervalDiff % reviewInterval == 0);
                break;
            case Unit.week:
                // intervalUnit = 'weeks';
                intervalDiff = now.diff(noteDate, 'weeks');
                isMatch = (intervalDiff % reviewInterval == 0) && now.day() == noteDate.day();
                break;
            case Unit.month:
                // intervalUnit = 'months';
                intervalDiff = now.diff(noteDate, 'months');
                isMatch = (intervalDiff % reviewInterval == 0) && now.date() == noteDate.date();
                break;
            case Unit.year:
                // intervalUnit = 'years';
                intervalDiff = now.diff(noteDate, 'years');
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

    return filteredNotes;
}