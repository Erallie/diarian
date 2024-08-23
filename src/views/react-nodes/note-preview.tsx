import { App, MarkdownRenderer, MarkdownView, TFile, View, WorkspaceLeaf } from "obsidian";
import { Ref, useRef } from "react";
import type Diarian from 'main';
import { isDailyNote, getModifiedFolderAndFormat } from "src/get-daily-notes";

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
        openDailyNote(note, plugin, app, evt);
    };


    if (plugin.settings.useCallout) {
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
    }

    return (
        <div onMouseUp={onClick} className="note-preview" aria-label="Open note">
            {plugin.settings.showNoteTitle && <h4>{note.basename}</h4>}

            <small className="markdown-rendered">
                {plugin.settings.useQuote ? (
                    <blockquote ref={ref as Ref<HTMLQuoteElement>} />
                ) : (
                    <div ref={ref as Ref<HTMLDivElement>} />
                )}
            </small>
        </div>
    );
};

export default NotePreview;

export function openDailyNote(note: TFile, plugin: Diarian, app: App, evt?: any) {

    let isMiddleButton = false;
    if (evt)
        isMiddleButton = evt.button === 1;
    const { workspace } = app;
    // let newLeaf = false;
    if (!plugin.settings.openInNewPane && !isMiddleButton) {

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType('markdown');

        if (leaves.length > 0) {
            // A leaf with our view already exists, use that
            for (let i = 0; i < leaves.length; i++) {
                const file = (leaves[i].view as MarkdownView).file;
                if (file == note) {
                    leaf = leaves[i];
                    break;
                }
            }

            if (!leaf) {
                for (let i = 0; i < leaves.length; i++) {
                    const file = (leaves[i].view as MarkdownView).file;
                    const { folder, format } = getModifiedFolderAndFormat();
                    if (file && isDailyNote(file, folder, format)) {
                        leaf = leaves[i];
                        break;
                    }
                }
            }

            if (!leaf) {
                leaf = leaves[0];
            }

            workspace.revealLeaf(leaf!);
            leaf!.openFile(note);
        }
        else {
            // Our view could not be found in the workspace, create a new leaf

            // newLeaf = false;
            void workspace.getLeaf(false).openFile(note);
        }
    }
    else {
        // newLeaf = true;
        void app.workspace.getLeaf(true).openFile(note);
    }
}