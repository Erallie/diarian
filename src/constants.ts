import { Notice } from 'obsidian';

export enum Unit {
    day = "day",
    week = "week",
    month = "month",
    year = "year",
};

export const getTimeSpanTitle = (number: number, unit: Unit) =>
    `${number} ${unit}${number > 1 ? "s" : ""}`;


export enum logLevel {
    log = "log",
    info = "info",
    warn = "warn",
    error = "error";
}

export function printToConsole(level: logLevel, message: string) { // level = {log, info, warn, error}
    let levelText = "";
    var print;
    let partialMsg: string | DocumentFragment = '';
    const pluginName = ""; //REPLACE THIS IN EACH STEP
    let newMsg = message.replaceAll("\n", "\n\t");
    let skipPrint = false;
    switch (level) {
        case logLevel.log:
            levelText = "";
            print = (toPrint: string) => { console.log(toPrint) }
            break;
        case logLevel.info:
            levelText = "";
            print = (toPrint: string) => { console.info(toPrint) }
            break;
        case logLevel.warn:
            levelText = " warning";
            print = (toPrint: string) => { console.warn(toPrint) }
            break;
        case logLevel.error:
            levelText = " error";
            print = (toPrint: string) => { console.error(toPrint) }
            break;
        default:
            partialMsg = `The debug level for this message is not set:\n\n\t${newMsg}`;
            console.error(`[${pluginName}]${levelText}:\n\t${newMsg}`);
            skipPrint = true;
    }
    if (!skipPrint) {
        partialMsg = "[" + pluginName + "] compile step:\n\t" + newMsg;
        print(`[${pluginName}]${levelText}:\n\t${newMsg}`);
    }
    new Notice(partialMsg);
}
/* ^^^ COPY AND PASTE THE ABOVE TO EVERY COMPILE STEP THAT PRINTS TO THE CONSOLE. ^^^ */