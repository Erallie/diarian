# Diarium
This is a plugin for [Obsidian](https://obsidian.md) that adds functionality from the [Diarium](https://diariumapp.com/) journal app.
## Key features
- Supports daily notes that have the date or time specified in the file path instead of just the file name. This allows for nested daily notes sorted in folders by year, month, or day (etc).
	- This is unlike most other plugins I’ve encountered on the Obsidian marketplace.
- Supports multiple notes per day.
	- The number of dots on each day is the number of notes that exist on that day.
## Planned features
Being in early development, there are some important features I have yet to add:
- The ability to import a pre-existing journal from [Diarium](https://diariumapp.com/).
- An ‘On this day’ review pane in the sidebar with the included settings:
	- The interval between days to review (eg. every 3 months)
	- How long ago to start including notes (eg. 6 months ago or earlier)
- Displaying attached images in the Calendar view on the tiles of days that include them.
- Functionality to insert a dynamic rating into your note.
## Credits
- I made use of this [React calendar](https://github.com/wojtekmaj/react-calendar#readme) for my own Calendar view.
- To retrieve settings from the Daily notes core plugin, I modified [this code](https://github.com/liamcain/obsidian-daily-notes-interface/blob/123969e461b7b0927c91fe164a77da05f43aba6a/src/settings.ts#L22-L47) from the [obsidian-daily-notes-interface](https://github.com/liamcain/obsidian-daily-notes-interface).
- I referenced [this source](https://github.com/Quorafind/Obsidian-Big-Calendar/blob/43a986eed3159ed60e4d54efa6c1840dd6af102c/src/index.ts#L65-L76) from the [Big Calendar](obsidian://show-plugin?id=big-calendar) plugin to learn how to open a custom view pane.
- I used [this code](https://github.com/Kageetai/obsidian-plugin-journal-review/blob/33a69940a5fcb5cb0eb45d34fca619f570ab5854/src/components/NotePreview.tsx) from the [Journal Review](obsidian://show-plugin?id=journal-review) plugin to display note previews.