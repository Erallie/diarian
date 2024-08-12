import { App, Keymap, MarkdownRenderer, TFile, View } from "obsidian";
import { Ref, useRef } from "react";
import type Diarium from 'main';

interface Props {
    note: TFile;
    view: View;
    plugin: Diarium;
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
            if (/[\.\/\?\!\,\;\:]/.test(slicedContent.charAt(slicedContent.length - 1))){
                slicedContent = slicedContent.slice(0, slicedContent.length - 1);
            }
            slicedContent += '...';
        }

        if (ref.current) {
            // clear the element before rendering, otherwise it will append
            ref.current.innerHTML = "";

            await MarkdownRenderer.render(
                app,
                slicedContent,
                ref.current,
                note.path,
                view,
            );
        }
    })();

    /* const onClick = (evt: MouseEvent) => {
        const isMiddleButton = evt.button === 1;
        const newLeaf =
            Keymap.isModEvent(evt) || isMiddleButton || plugin.settings.openInNewPane;

        void app.workspace.getLeaf(newLeaf).openFile(note);
    }; */

    const onClick = (evt: any) => {
        const isMiddleButton = evt.button === 1;
        const newLeaf =
            /* Keymap.isModEvent(evt) || */ isMiddleButton || plugin.settings.openInNewPane;

        void app.workspace.getLeaf(newLeaf).openFile(note);
    };

    if (plugin.settings.useCallout) {
        return (
            <div className="callout" onMouseUp={onClick}>
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
        <div onMouseUp={onClick}>
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