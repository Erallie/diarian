# Diarian
Your all-in-one journaling plugin for [Obsidian](https://obsidian.md).

This plugin adds functionality from the [Diarium](https://diariumapp.com/) journal app to the note-taking app we all know and love.

This plugin is *unofficial* to both [Obsidian](https://obsidian.md/) and [Diarium](https://diariumapp.com/).
## Key features
- A **Calendar** view that displays which days have daily notes on them.
	- Open daily notes directly from the calendar.
	- Create daily notes on any day from the calendar.
	- Command to show the currently active daily note in the **Calendar** view.
- An **On this day** review pane in the sidebar with the included settings:
	- The interval between days to review (eg. every 3 months)
	- How long ago to start including notes (eg. 6 months ago or earlier)
- Supports multiple notes per day.
	- The number of dots on each calendar tile is the number of notes that exist on that day.
- Import a pre-existing journal from [Diarium](https://diariumapp.com/).
- Insert a timestamp into the current note from the context menu.
- Optionally open the **Calendar** view and/or the **On this day** view on startup.
- Supports daily notes that have the date or time specified in the file path instead of just the file name.
	- Allows for nested daily notes sorted in folders by year, month, or day (etc).
	- Unlike most other plugins I’ve encountered on the Obsidian marketplace.
## Planned features
Being in early development, there are some important features I have yet to add:
- The option to display attached images in the Calendar view on the tiles of days that include them.
- Functionality to insert a dynamic rating into your note.
## Excluded features
Since this plugin started as a project for my own personal use, there are features present in [Diarium](https://diariumapp.com/) that I do *not* plan on including in this plugin:
- The ability to import tracker data from [Diarium](https://diariumapp.com/).
- The following views from [Diarium](https://diariumapp.com/):
	- The **Timeline** view
	- The **Map** view
		- I recommend using the [Map View](obsidian://show-plugin?id=obsidian-map-view) ([github](https://github.com/esm7/obsidian-map-view)) plugin for this feature. This Diarian plugin will automatically use your settings for it.
- Any embedded feeds & events not mentioned in [Key features](#key-features) or [Planned features](#planned-features).
- I *may* exclude the ability to insert a location based on your device's current location data.
	- It depends on the feasibility of implementation.
	- The [Map View](obsidian://show-plugin?id=obsidian-map-view) ([github](https://github.com/esm7/obsidian-map-view)) plugin can also be used as an alternative for this.
- The ability to lock and encrypt your vault.
	- For those features, I suggest plugins from the [Obsidian Marketplace](obsidian://show-plugin?id=password) like [Protected Note](obsidian://show-plugin?id=protected-note) ([github](https://github.com/mmiksaa/obsidian-protected-note)) or [Password Protection](obsidian://show-plugin?id=password-protection) ([github](https://github.com/qing3962/password-protection))
## Credits
- I made use of this [React calendar](https://github.com/wojtekmaj/react-calendar#readme) for my own Calendar view.
- I modified [this code](https://github.com/liamcain/obsidian-daily-notes-interface/blob/123969e461b7b0927c91fe164a77da05f43aba6a/src/settings.ts#L22-L47) from the [obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface) to retrieve settings from the Daily notes core plugin and the [Map View](obsidian://show-plugin?id=obsidian-map-view) ([github](https://github.com/esm7/obsidian-map-view)) plugin.
- I referenced [this source](https://github.com/Quorafind/Obsidian-Big-Calendar/blob/43a986eed3159ed60e4d54efa6c1840dd6af102c/src/index.ts#L65-L76) from the [Big Calendar](obsidian://show-plugin?id=big-calendar) ([github](https://github.com/Quorafind/Obsidian-Big-Calendar)) plugin to learn how to open a custom view pane.
- I modified [`NotePreview.tsx`](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/33a69940a5fcb5cb0eb45d34fca619f570ab5854/src/components/NotePreview.tsx) and [`TimeSpan.tsx`](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/33a69940a5fcb5cb0eb45d34fca619f570ab5854/src/components/TimeSpan.tsx) from the [Journal Review](obsidian://show-plugin?id=journal-review) ([github](https://github.com/Kageetai/obsidian-plugin-journal-review)) plugin to display note previews.
- I referenced [JSON/CSV Importer](obsidian://show-plugin?id=obsidian-import-json) ([github](https://github.com/farling42/obsidian-import-json)) and [Obsidian Importer](obsidian://show-plugin?id=obsidian-importer) ([github](https://github.com/obsidianmd/obsidian-importer)) to understand how to code my own import feature.