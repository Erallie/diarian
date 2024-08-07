import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useState } from 'react';
type ValuePiece = Date | null;


type Value = ValuePiece | [ValuePiece, ValuePiece];

const CALENDAR_VIEW_TYPE = "calendar-view";

export class CalendarView extends ItemView {
    root: Root | null = null;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return CALENDAR_VIEW_TYPE;
    }

    getDisplayText() {
        return "Example view";
    }

    async onOpen() {
        this.root = createRoot(this.containerEl.children[1]);
        this.root.render(
            <StrictMode>
                <Container />
            </StrictMode>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}

const Container = () => {
    let notesToShow;
    const today = new Date();
    const [date, setDate] = useState(new Date());
    // const dateString = 
    if (date.getDay() == today.getDay() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear()) {
        notesToShow = <p>Insert notes to show here!</p>;
    } else {
        notesToShow = <p>There are no notes on this day.</p>;
    }
    return (
        <div>
            <Calendar onClickDay={setDate} value={date} />
            {/* set "formatDay" to be changed in the settings */}
            {date.toString()}
            {notesToShow}
            {/* Add functionality to display  */}
            {/* <h4>Hello, React!</h4> */}
        </div>
    )
};