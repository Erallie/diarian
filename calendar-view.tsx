import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";

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
                <Calendar />,
            </StrictMode>,
        );
    }

    async onClose() {
        this.root?.unmount();
    }
}

const Calendar = () => {
    return <h4>Hello, React!</h4>;
};