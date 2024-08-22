# Diarian
Your all-in-one journaling plugin for [Obsidian](https://obsidian.md).

This plugin adds functionality from the [Diarium](https://diariumapp.com/) journal app to the note-taking app we all know and love.

This plugin is *unofficial* to both [Obsidian](https://obsidian.md/) and [Diarium](https://diariumapp.com/).
## Table of Contents
1. [Features](#features)
	1. [Key features](#key-features)
	2. [Planned features](#planned-features)
	3. [Excluded features](#excluded-features)
2. [Instructions](#instructions)
	1. [Calendar](#calendar)
		1. [Editor navigation](#editor-navigation)
	2. [On this day](#on-this-day)
	3. [Importer](#importer)
		1. [Importer notes](#importer-notes)
	4. [Rating](#rating)
	5. [Timestamp](#timestamp)
	6. [Multiple daily notes](#multiple-daily-notes)
3. [Installation](#installation)
	1. [Use BRAT](#use-brat)
	2. [Manual installation](#manual-installation)
4. [Credits](#credits)
# Features
## Key features
- A **Calendar** view that displays which days have daily notes on them.
	- Open daily notes directly from the calendar.
	- Create daily notes on any day from the calendar.
	- Commands to navigate between daily notes.
	- Display attached images on the tiles of days that include them.
- An **On this day** review pane in the sidebar with the included settings:
	- The interval between days to review (eg. every 3 months)
	- How long ago to start including notes (eg. 6 months ago or earlier)
- Import a pre-existing journal from [Diarium](https://diariumapp.com/).
- A rating for each daily note that displays in the status bar.
- Insert a timestamp into the active note.
- Optionally open the **Calendar** view and/or the **On this day** view on startup.
- Supports multiple notes per day.
	- The number of dots on each calendar tile is the number of notes that exist on that day.
- Supports daily notes that have the date or time specified in the file path instead of just the file name.
	- Allows for nested daily notes sorted in folders by year, month, or day (etc).
	- Unlike most other plugins I’ve encountered on the Obsidian marketplace.
## Planned features
Being in early development, there are some important features I have yet to add:
- The ability to automatically insert your template defined under **Settings → Daily notes** when creating a daily note.
- Options to specify what to do when importing a note/entry with a name that already exists.
	- Currently, the existing note is left untouched, and the new entry is not inserted.
## Excluded features
Since this plugin started as a project for my own personal use, there are features present in [Diarium](https://diariumapp.com/) that I do *not* plan on including in this plugin:
- The ability to import tracker data from [Diarium](https://diariumapp.com/).
- The following views from [Diarium](https://diariumapp.com/):
	- The **Timeline** view
	- The **Map** view
		- I recommend using the [Map View](obsidian://show-plugin?id=obsidian-map-view) ([github](https://github.com/esm7/obsidian-map-view)) plugin for this feature. Diarian will automatically use your settings for it.
- Any embedded feeds & events not mentioned in [Key features](#key-features) or [Planned features](#planned-features).
- I *may* exclude the ability to insert a location based on your device's current location data.
	- It depends on the feasibility of implementation.
	- The [Map View](obsidian://show-plugin?id=obsidian-map-view) ([github](https://github.com/esm7/obsidian-map-view)) plugin can also be used as an alternative for this.
- The ability to lock and encrypt your vault.
	- For those features, I suggest plugins from the [Obsidian Marketplace](obsidian://show-plugin?id=password) like [Protected Note](obsidian://show-plugin?id=protected-note) ([github](https://github.com/mmiksaa/obsidian-protected-note)), [Password Protection](obsidian://show-plugin?id=password-protection) ([github](https://github.com/qing3962/password-protection)),[^1] or [Lock Screen](obsidian://show-plugin?id=obsidian-lock-screen-plugin) ([github](https://github.com/ericbiewener/obsidian-lock-screen-plugin)).[^1]
	- If you sync your vault, [Remotely Save](obsidian://show-plugin?id=remotely-save) ([github](https://github.com/remotely-save/remotely-save)) has an option to encrypt your files on the remote location. The files on your local computer will not be encrypted though.

%%[^2]: [Protected Note](obsidian://show-plugin?id=protected-note) ([github](https://github.com/mmiksaa/obsidian-protected-note)) makes the [Obsidian](https://obsidian.md) app overheat on iOS. It is only recommended for desktop and Android.%%

[^1]: [Password Protection](obsidian://show-plugin?id=password-protection) ([github](https://github.com/qing3962/password-protection)) and [Lock Screen](obsidian://show-plugin?id=obsidian-lock-screen-plugin) ([github](https://github.com/ericbiewener/obsidian-lock-screen-plugin)) *only* put a password on your vault or a folder in your vault; they do *not* encrypt or decrypt it.
	
	If you require an encryption feature, browse the Obsidian Marketplace for [plugins with encryption](obsidian://show-plugin?id=encrypt).

Feel free to create an [issue](https://github.com/Erallie/diarian/issues) if you'd like me to include any of these features!
# Instructions
## Calendar
Access the **Calendar** view from the context menu that opens after clicking the **ribbon icon**.

![open-calendar](./Attachments/open-calendar.png#interface)

The **Calendar** view displays all your daily notes in a calendar layout.

![calendar-view](./Attachments/calendar-view.png#interface)

- The number of **dots** ( • ) on a tile represents how many daily notes you have written that day.
- If you have images attached, the first image you attached that day will show up on the tile of that day.

Select the **plus button** ( ![plus button](./Attachments/icons/lucide-plus.svg#icon) ) to create a new note on that day.

![new-note-calendar](./Attachments/new-note-calendar.png#interface)

Select a note preview to open it.

![note-preview-calendar](./Attachments/note-preview-calendar.png#interface)

### Editor navigation
You can navigate between daily notes from the editor by using the following commands (See [Command palette](https://help.obsidian.md/Plugins/Command+palette)):
- **Diarian: Show daily note in calendar**
- **Diarian: Go to previous daily note**
- **Diarian: Go to next daily note**

These commands can also be accessed from the file and editor context menus.

![calendar-navigation](./Attachments/calendar-navigation.png#interface)
## On this day
Access the **On this day** view from the context menu that opens after clicking the **ribbon icon**.

![open-on-this-day](./Attachments/open-on-this-day.png#interface)

The **On this day** view displays notes written on previous days.

![on-this-day-view](./Attachments/on-this-day-view.png#interface)

The interval between days to review (eg. every 3 months) and how long ago to start including notes (eg. 6 months ago or earlier) can be adjusted under **Settings → Diarian → On this day**.

Select a note preview to open it.

![note-preview-on-this-day](./Attachments/note-preview-on-this-day.png#interface)
## Importer
Access the **Importer** from the context menu that opens after clicking the **ribbon icon**.

![open-importer](./Attachments/open-importer.png#interface)

The **Importer** allows you to import a pre-existing journal from [Diarium](https://diariumapp.com/):
1. Follow the instructions onscreen to export your [Diarium](https://diariumapp.com/) journal to your local files.
2. After they've been exported, choose the exported zip file, and then select **Import**.
### Importer notes
- Attachments will be uploaded to the location specified under **Settings → Files and links → Default location for new attachments**.
- Properties will be populated according to the data exported from [Diarium](https://diariumapp.com/).
	- The **rating** property name can be set under **Settings → Diarian → Rating → Property name**.
	- If [Map View](obsidian://show-plugin?id=obsidian-map-view) ([github](https://github.com/esm7/obsidian-map-view)) is installed, the **location** property will use the name set under **Settings → Map View → Settings for the map view plugin. → Key for front matter location**.
	- Importing tracker data is not currently supported. Feel free to create an [issue](https://github.com/Erallie/diarian/issues) if you'd like me to add support for it!
## Rating
A rating will appear in the status bar whenever you're viewing a daily note.

![rating-status-bar](./Attachments/rating-status-bar.png#interface)

The status bar reads the note properties to determine the rating. If no rating has been set, the status bar will display an empty rating.

To set a rating, do one of the following things:
- Click the rating in the status bar (on desktop).
- Perform the **Diarian: Insert rating** command (See [Command palette](https://help.obsidian.md/Plugins/Command+palette)).
- Select **Insert rating** from the file context menu or the editor context menu.
    ![rating-context-menu](./Attachments/rating-context-menu.png#interface)

A modal will then open that will allow you to set the rating as you like.

![rating-modal](./Attachments/rating-modal.png#interface)
## Timestamp
To insert a timestamp, do one of the following:
- Perform the **Diarian: Insert timestamp** command (See [Command palette](https://help.obsidian.md/Plugins/Command+palette)).
- Select **Insert timestamp** from the editor context menu.
    ![timestamp-context-menu](./Attachments/timestamp-context-menu.png#interface)

If the active note is from the current day, only the time will be inserted in the timestamp. Otherwise, both the date and the time will be inserted.
## Multiple daily notes
This plugin reads your settings under **Settings → Daily notes** to create new daily notes.

To create multiple notes per day, you must change the **Date format** to include the time. Once that is done, new notes with the new format will show up in the **Calendar**.
# Installation
## Use BRAT
Install this plugin using [BRAT](obsidian://show-plugin?id=obsidian42-brat) ([github](https://github.com/TfTHacker/obsidian42-brat)) by doing the following:
1. Make sure the [BRAT](obsidian://show-plugin?id=obsidian42-brat) ([github](https://github.com/TfTHacker/obsidian42-brat)) plugin is installed in your vault.
2. Go to **Settings → BRAT → Beta Plugin List → Add Beta Plugin**
3. Enter `https://github.com/Erallie/diarian` into the input field and select **Add Plugin**.
## Manual installation
To install this plugin manually, follow these steps:
1. Go to the [Releases](https://github.com/Erallie/diarian/releases) page and find the latest release.
2. Download `main.js`, `manifest.json`, and `styles.css`.
3. Go to your **Plugins folder** (`[vault root]/.obsidian/plugins`) and create a new subfolder called `diarian`.
4. Move the downloaded files to the new folder.
# Credits
- I made use of this [React calendar](https://github.com/wojtekmaj/react-calendar#readme) for my own **Calendar** view.
- I modified [this code](https://github.com/liamcain/obsidian-daily-notes-interface/blob/123969e461b7b0927c91fe164a77da05f43aba6a/src/settings.ts#L22-L47) from the [obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface) to retrieve settings from the Daily notes core plugin and the [Map View](obsidian://show-plugin?id=obsidian-map-view) ([github](https://github.com/esm7/obsidian-map-view)) plugin.
	- The modifications in my own code can be found in [`get-daily-notes.ts`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/get-daily-notes.ts#L9-L31) and in [`import-journal.ts`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/import-journal.ts#L520-L543).
- I modified [this source](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/c353550c49c274bbf3cc00026feca7e8766b0e48/src/main.ts#L82-L100) from the [Journal Review](obsidian://show-plugin?id=journal-review) ([github](https://github.com/Kageetai/obsidian-plugin-journal-review)) plugin to learn how to open a custom view pane.
	- My own modifications can be found in [`main.ts`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/main.ts#L533-L569).
- I modified [`NotePreview.tsx`](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/33a69940a5fcb5cb0eb45d34fca619f570ab5854/src/components/NotePreview.tsx) and [`TimeSpan.tsx`](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/33a69940a5fcb5cb0eb45d34fca619f570ab5854/src/components/TimeSpan.tsx) from the [Journal Review](obsidian://show-plugin?id=journal-review) ([github](https://github.com/Kageetai/obsidian-plugin-journal-review)) plugin to display note previews.
	- The modifications in my own code are found in [`note-preview.tsx`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/views/react-nodes/note-preview.tsx) and [`time-span.tsx`](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/views/react-nodes/time-span.tsx).
- I referenced [JSON/CSV Importer](obsidian://show-plugin?id=obsidian-import-json) ([github](https://github.com/farling42/obsidian-import-json)) and the official [Importer](obsidian://show-plugin?id=obsidian-importer) ([github](https://github.com/obsidianmd/obsidian-importer)) to understand how to code my own import feature.
	- [These 7 lines](https://github.com/Erallie/diarian/blob/eb08ddda08fdbe91632e4a4a4e966986e2bff052/src/import-journal.ts#L217-L223) in my code were modified from [these 5 lines](https://github.com/farling42/obsidian-import-json/blob/8a995389f0bfac485c8d3b43621aed9b546ba963/main.ts#L610-L614) in [JSON/CSV Importer](obsidian://show-plugin?id=obsidian-import-json) ([github](https://github.com/farling42/obsidian-import-json)).
	- No substantial code (that I can find) was borrowed from the official [Importer](obsidian://show-plugin?id=obsidian-importer) ([github](https://github.com/obsidianmd/obsidian-importer)), but I used it for reference. If you find substantial borrowed code, please let me know in an [issue](https://github.com/Erallie/diarian/issues).