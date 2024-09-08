---
share: true
---
Diarian is your all-in-one journaling plugin for [Obsidian](https://obsidian.md).

This plugin adds functionality from the [Diarium](https://diariumapp.com/) journal app to the note-taking app we all know and love.

This plugin is *unofficial* to both [Obsidian](https://obsidian.md/) and [Diarium](https://diariumapp.com/).
# Features
## Included features
- A [**Calendar**](Index.md##calendar) view that displays which days have daily notes on them.
	- Open daily notes directly from the calendar.
	- Create daily notes on any day from the calendar.
	- Commands to [navigate between daily notes](Index.md##editor-navigation).
	- Display attached images on the tiles of days that include them.
- An [**On this day**](Index.md##on-this-day) review pane in the sidebar.
	- Specify in the settings:
		- The interval between days to review (eg. every 3 months)
		- How long ago to start including notes (eg. 6 months ago or earlier)
	- [Get notified](Index.md##notifications) when there are daily notes to review.
- [Import a pre-existing journal](Index.md##importer) from [Diarium](https://diariumapp.com/).
- A [rating](Index.md##rating) for each daily note that displays in the status bar.
	- [Customize](Index.md##customization) the Unicode characters or emojis used for the rating.
- Select a template to be automatically inserted when creating a new daily note.
	- Includes all markdown files in the folder specified under **Settings → Templates → Template folder location**.
	- Defaults to the template defined under **Settings → Daily notes → Template file location**
- Insert a [timestamp](Index.md##timestamp) into the active note.
- Optionally open the **Calendar** view and/or the **On this day** view on startup.
- Supports [multiple notes per day](Index.md##multiplenested-daily-notes).
	- The number of dots on each calendar tile is the number of notes that exist on that day.
- Supports daily notes that have the date or time specified in the file path instead of just the file name.
	- Allows for [nested daily notes](Index.md.md##multiplenested-daily-notes) sorted in folders by year, month, or day (etc).
	- Unlike most other plugins I’ve encountered on the Obsidian marketplace.
<!-- ## Planned features
Being in early development, there are some important features I have yet to add:
- The option to specify how to process -->
## Excluded features
Since this plugin started as a project for my own personal use, there are features present in [Diarium](https://diariumapp.com/) that I do *not* plan on including in this plugin:
- The following views from [Diarium](https://diariumapp.com/):
	- The **Timeline** view
	- The **Map** view
		- I recommend using the [Map View](https://obsidian.md/plugins?id=obsidian-map-view) plugin for this feature. Diarian will automatically use your settings for it.
- Any embedded feeds & events not mentioned in [Included features](Index.md##included-features).
- I *may* exclude the ability to insert a location based on your device's current location data.
	- It depends on the feasibility of implementation.
	- The [Map View](https://obsidian.md/plugins?id=obsidian-map-view) plugin can also be used as an alternative for this.
- The ability to lock and encrypt your vault.
	- For those features, I suggest [password](https://obsidian.md/plugins?search=password) or [encryption plugins](https://obsidian.md/plugins?search=encrypt) from the Obsidian Marketplace like [Protected Note](https://obsidian.md/plugins?id=protected-note), [Password Protection](https://obsidian.md/plugins?id=password-protection),[^1] or [Lock Screen](https://obsidian.md/plugins?id=obsidian-lock-screen-plugin).[^1]
	- If you sync your vault, [Remotely Save](https://obsidian.md/plugins?id=remotely-save) has an option to encrypt your files on the remote location. The files on your local computer will not be encrypted though.

[^1]: [Password Protection](https://obsidian.md/plugins?id=password-protection) and [Lock Screen](https://obsidian.md/plugins?id=obsidian-lock-screen-plugin) *only* put a password on your vault or a folder in your vault; they do *not* encrypt or decrypt it.
	
	If you require an encryption feature, browse the Obsidian Marketplace for [plugins with encryption](https://obsidian.md/plugins?search=encrypt).

Feel free to create an [issue](https://github.com/Erallie/diarian/issues) if you'd like me to include any of these features!