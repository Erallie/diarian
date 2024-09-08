---
share: true
---
# Table of Contents
1. [About Diarian](https://erallie.github.io/diarian/index.html "https://erallie.github.io/diarian/index.html")
    1. [Features](https://erallie.github.io/diarian/index.html#features "https://erallie.github.io/diarian/index.html#features")
        1. [Included features](https://erallie.github.io/diarian/index.html#included-features "https://erallie.github.io/diarian/index.html#included-features")
        2. [Excluded features](https://erallie.github.io/diarian/index.html#excluded-features "https://erallie.github.io/diarian/index.html#excluded-features")
2. [Credits](https://erallie.github.io/diarian/Credits.html "https://erallie.github.io/diarian/Credits.html")
3. [Installation](https://erallie.github.io/diarian/Installation.html "https://erallie.github.io/diarian/Installation.html")
    1. [Use BRAT](https://erallie.github.io/diarian/Installation.html#use-brat "https://erallie.github.io/diarian/Installation.html#use-brat")
    2. [Manual installation](https://erallie.github.io/diarian/Installation.html#manual-installation "https://erallie.github.io/diarian/Installation.html#manual-installation")
4. Instructions
    1. [Calendar](https://erallie.github.io/diarian/Instructions/Calendar.html "https://erallie.github.io/diarian/Instructions/Calendar.html")
        1. [Editor navigation](https://erallie.github.io/diarian/Instructions/Calendar.html#editor-navigation "https://erallie.github.io/diarian/Instructions/Calendar.html#editor-navigation")
    2. [On this day](https://erallie.github.io/diarian/Instructions/On%20this%20day.html "https://erallie.github.io/diarian/Instructions/On%20this%20day.html")
        1. [Notifications](https://erallie.github.io/diarian/Instructions/On%20this%20day.html#notifications "https://erallie.github.io/diarian/Instructions/On%20this%20day.html#notifications")
            1. [Pop-up modals](https://erallie.github.io/diarian/Instructions/On%20this%20day.html#pop-up-modals "https://erallie.github.io/diarian/Instructions/On%20this%20day.html#pop-up-modals")
            2. [Notices](https://erallie.github.io/diarian/Instructions/On%20this%20day.html#notices "https://erallie.github.io/diarian/Instructions/On%20this%20day.html#notices")
    3. [Multiple or nested daily notes](https://erallie.github.io/diarian/Instructions/Multiple%20or%20nested%20daily%20notes.html "https://erallie.github.io/diarian/Instructions/Multiple%20or%20nested%20daily%20notes.html")
    4. [Importer](https://erallie.github.io/diarian/Instructions/Importer.html "https://erallie.github.io/diarian/Instructions/Importer.html")
        1. [Importer notes](https://erallie.github.io/diarian/Instructions/Importer.html#importer-notes "https://erallie.github.io/diarian/Instructions/Importer.html#importer-notes")
    5. [Rating](https://erallie.github.io/diarian/Instructions/Rating.html "https://erallie.github.io/diarian/Instructions/Rating.html")
        1. [Customization](https://erallie.github.io/diarian/Instructions/Rating.html#customization "https://erallie.github.io/diarian/Instructions/Rating.html#customization")
    6. [Timestamp](https://erallie.github.io/diarian/Instructions/Timestamp.html "https://erallie.github.io/diarian/Instructions/Timestamp.html")

# Credits
- I made use of this [React calendar](https://github.com/wojtekmaj/react-calendar#readme) for my own **Calendar** view.
- I modified [this code](https://github.com/liamcain/obsidian-daily-notes-interface/blob/123969e461b7b0927c91fe164a77da05f43aba6a/src/settings.ts#L22-L47) from the [obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface) to retrieve settings from the Daily notes core plugin and the [Map View](https://obsidian.md/plugins?id=obsidian-map-view) plugin.
	- The modifications in my own code can be found in [`get-daily-notes.ts`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/get-daily-notes.ts#L9-L31) and in [`import-journal.ts`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/import-journal.ts#L520-L543).
- I modified [this source](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/c353550c49c274bbf3cc00026feca7e8766b0e48/src/main.ts#L82-L100) from the [Journal Review](https://obsidian.md/plugins?id=journal-review) plugin to learn how to open a custom view pane.
	- My own modifications can be found in [`main.ts`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/main.ts#L533-L569) and [`note-preview.tsx`](https://github.com/Erallie/diarian/blob/73d8512a37c18f1cbc63e0a4d37bbb771c2f7716/src/views/react-nodes/note-preview.tsx#L84-L135).
- I modified [`NotePreview.tsx`](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/33a69940a5fcb5cb0eb45d34fca619f570ab5854/src/components/NotePreview.tsx) and [`TimeSpan.tsx`](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/33a69940a5fcb5cb0eb45d34fca619f570ab5854/src/components/TimeSpan.tsx) from the [Journal Review](https://obsidian.md/plugins?id=journal-review) plugin to display note previews.
	- The modifications in my own code are found in [`note-preview.tsx`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/views/react-nodes/note-preview.tsx) and [`time-span.tsx`](https://github.com/Erallie/diarian/blob/ab81a1afddb1f90964b1d20501ebbbf7859204bc/src/views/react-nodes/note-preview.tsx#L51-L68).
- I referenced [JSON/CSV Importer](https://obsidian.md/plugins?id=obsidian-import-json) and the official [Importer](https://obsidian.md/plugins?id=obsidian-importer) to understand how to code my own import feature.
	- [These 7 lines](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/import-journal.ts#L217-L223) in my code were modified from [these 5 lines](https://github.com/farling42/obsidian-import-json/blob/8a995389f0bfac485c8d3b43621aed9b546ba963/main.ts#L610-L614) in [JSON/CSV Importer](https://obsidian.md/plugins?id=obsidian-import-json).
	- No substantial code (that I can find) was borrowed from the official [Importer](https://obsidian.md/plugins?id=obsidian-importer), but I used it for reference. If you find substantial borrowed code, please let me know in an [issue](https://github.com/Erallie/diarian/issues).