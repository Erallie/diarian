import { App, MarkdownRenderer, MarkdownView, TFile, View, WorkspaceLeaf } from "obsidian";
import { Ref, useRef } from "react";
import type Diarian from 'src/main';
import { isDailyNote, getModifiedFolderAndFormat } from "src/get-daily-notes";
import { printToConsole, logLevel } from "src/constants";
import { NotePrevDisplay, notePrevDisplayMap, newNoteModeMap, NewNoteMode } from "src/settings";

interface Props {
    note: TFile;
    view: View;
    plugin: Diarian;
    app: App;
}

export const NotePreview = ({ note, view, plugin, app }: Props) => {

    const ref = useRef<HTMLDivElement | HTMLQuoteElement>(null);

    void (async () => {
        const preSlicedContent = (await app.vault.cachedRead(note))
            // remove frontmatter
            // .replace(/---.*?---/s, "")
            .replace(/---.*?---/s, "");
        let slicedContent = preSlicedContent
            // restrict to chosen preview length
            .substring(0, plugin.settings.previewLength);
        if (slicedContent != preSlicedContent) {
            slicedContent = slicedContent.slice(0, slicedContent.lastIndexOf(' '));
            if (/[\.\/\?\!\,\;\:]/.test(slicedContent.charAt(slicedContent.length - 1))) {
                slicedContent = slicedContent.slice(0, slicedContent.length - 1);
            }
            slicedContent += '...';
        }

        if (ref.current) {
            // clear the element before rendering, otherwise it will append
            ref.current.empty();

            await MarkdownRenderer.render(
                app,
                slicedContent,
                ref.current,
                note.path,
                view
            );
        }
    })();


    const onClick = (evt: any) => {
        openDailyNote(note, plugin, app, false, evt);
    };

    const notePrevDisplayMapped = notePrevDisplayMap[plugin.settings.notePrevDisplay as NotePrevDisplay];
    switch (notePrevDisplayMapped) {
        case NotePrevDisplay.callout:
            return (
                <div className="callout note-preview" onMouseUp={onClick} aria-label="Open note" >
                    {plugin.settings.showNoteTitle && (
                        <div className="callout-title">
                            <div className="callout-title-inner">{note.basename}</div>
                        </div>
                    )}

                    <div className="callout-content" ref={ref as Ref<HTMLDivElement>} />
                </div>
            );
        case NotePrevDisplay.quote:
            return (
                <div onMouseUp={onClick} className="note-preview" aria-label="Open note">
                    {plugin.settings.showNoteTitle && <h4>{note.basename}</h4>}

                    <small className="markdown-rendered">
                        <blockquote ref={ref as Ref<HTMLQuoteElement>} />
                    </small>
                </div>
            );
        case NotePrevDisplay.text:
            return (
                <div onMouseUp={onClick} className="note-preview" aria-label="Open note">
                    {plugin.settings.showNoteTitle && <h4>{note.basename}</h4>}

                    <small className="markdown-rendered">
                        <div ref={ref as Ref<HTMLDivElement>} />
                    </small>
                </div>
            );
        default:
            printToConsole(logLevel.log, `Cannot create NotePreview:\n${plugin.settings.notePrevDisplay} is not a valid value!`);
            return (<></>);
    }

};

export default NotePreview;

export function openDailyNote(note: TFile, plugin: Diarian, app: App, newNote: boolean, evt?: any) {

    let isMiddleButton = false;
    if (evt)
        isMiddleButton = evt.button === 1;
    const { workspace } = app;
    let leaf: WorkspaceLeaf | null = null;
    if (!plugin.settings.openInNewPane && !isMiddleButton) {

        const leaves = workspace.getLeavesOfType('markdown');

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            for (let i = 0; i < leaves.length; i++) {
                const file = (leaves[i].view as MarkdownView).file;
                if (file == note) {
                    leaf = leaves[i];
                    workspace.revealLeaf(leaf);
                    // printToConsole(logLevel.log, 'Same note is open');
                    break;
                }
            }

            if (!leaf) {
                for (let i = 0; i < leaves.length; i++) {
                    const file = (leaves[i].view as MarkdownView).file;
                    if (file == workspace.getActiveFile() && !leaves[i].getViewState().pinned && leaves[i].getRoot() === workspace.rootSplit) {
                        leaf = leaves[i];
                        workspace.revealLeaf(leaf);
                        leaf.openFile(note);
                        // printToConsole(logLevel.log, 'Active view is markdown and not pinned');
                    }
                }
            }

            if (!leaf) {
                const { folder, format } = getModifiedFolderAndFormat();
                for (let i = 0; i < leaves.length; i++) {
                    const file = (leaves[i].view as MarkdownView).file;
                    if (file && isDailyNote(file, folder, format) && !leaves[i].getViewState().pinned && leaves[i].getRoot() === workspace.rootSplit) {
                        leaf = leaves[i];
                        workspace.revealLeaf(leaf);
                        leaf.openFile(note);
                        // printToConsole(logLevel.log, 'Got daily note');
                        break;
                    }
                }
            }

            if (!leaf) {
                for (let i = 0; i < leaves.length; i++) {
                    const file = (leaves[i].view as MarkdownView).file;
                    if (file && !leaves[i].getViewState().pinned && leaves[i].getRoot() === workspace.rootSplit) {
                        leaf = leaves[i];
                        workspace.revealLeaf(leaf);
                        leaf.openFile(note);
                        // printToConsole(logLevel.log, 'Got other markdown view');
                        break;
                    }
                }
            }

            if (!leaf) {
                leaf = workspace.getLeaf(false);
                leaf.openFile(note);
                // printToConsole(logLevel.log, 'Created new leaf');
            }
        }
        else {
            // Our view could not be found in the workspace, create a new leaf
            leaf = workspace.getLeaf(false);
            leaf.openFile(note);
        }
    }
    else {
        leaf = workspace.getLeaf(true);
        leaf.openFile(note);
    }

    if (newNote) {
        const newNoteModeMapped = newNoteModeMap[plugin.settings.newNoteMode as NewNoteMode];
        switch (newNoteModeMapped) {
            case NewNoteMode.live:
                leaf.setViewState({ type: 'markdown', state: { mode: 'source', source: false } });
                break;
            case NewNoteMode.reading:
                leaf.setViewState({ type: 'markdown', state: { mode: 'preview', source: false } });
                break;
            case NewNoteMode.source:
                leaf.setViewState({ type: 'markdown', state: { mode: 'source', source: true } });
                break;
            default:
                printToConsole(logLevel.warn, `Cannot set view mode:\n${plugin.settings.newNoteMode} is not a valid view mode!`);
        }
    }
}