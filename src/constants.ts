import { Notice } from 'obsidian';

export enum Unit {
    day = "day",
    week = "week",
    month = "month",
    year = "year"
};

export const enum ViewType {
    calendarView = 'calendarView',
    onThisDayView = 'onThisDayView'
}

export const getTimeSpanTitle = (number: number, unit: Unit) =>
    `${number} ${unit}${number > 1 ? "s" : ""}`;


export const enum logLevel {
    log = "log",
    info = "info",
    warn = "warn",
    error = "error"
}
/* export const DEFAULTS = {
    format: 'YYYY-MM-DD'
} */
export const DEFAULT_FORMAT = 'YYYY-MM-DD';

export function printToConsole(level: logLevel, message: any) { // level = {log, info, warn, error}
    try { throw new Error() }
    catch (e) {
        let levelText = "";
        let print = (toPrint: string) => { };
        let partialMsg: string | DocumentFragment = '';
        const pluginName = "Diarium"; //REPLACE THIS IN EACH STEP
        // let newMsg = message.replaceAll("\n", "\n\t");
        let skipPrint = false;
        const stack = e.stack.slice('Error'.length);
        switch (level) {
            case logLevel.log:
                levelText = " log";
                print = (toPrint: string) => { console.log(`${toPrint}`) }
                break;
            case logLevel.info:
                levelText = " info";
                print = (toPrint: string) => { console.info(`${toPrint}`) }
                break;
            case logLevel.warn:
                levelText = " warning";
                print = (toPrint: string) => { console.warn(`${toPrint}${stack}`) }
                break;
            case logLevel.error:
                levelText = " error";
                print = (toPrint: string) => { console.error(`${toPrint}${stack}`) }
                break;
            default:
                partialMsg = `The debug level for this message is not set:\n\n${message}`;
                console.error(`[${pluginName}] error:\n${partialMsg}${stack}`);
                skipPrint = true;
        }
        if (!skipPrint) {
            print(`[${pluginName}]${levelText}: ${message}`);
        }
        new Notice(message);
    }
}
/* ^^^ COPY AND PASTE THE ABOVE TO EVERY COMPILE STEP THAT PRINTS TO THE CONSOLE. ^^^ */