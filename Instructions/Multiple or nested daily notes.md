---
title: Multiple or nested daily notes
layout: default
share: true
---
# Multiple or nested daily notes
This plugin reads your settings under **Settings → Daily notes** to create new daily notes.
- To create **multiple notes per day**, you must change the **Date format** to include the time within the note name.
- To create **nested daily notes**, change the **Date format** to include **slashes** ( / ) to indicate folders and subfolders.

> #### Format example
> If you create a new daily note when
> - The **Date format** is set to `YYYY/M-MMMM/dddd, Do [at] h.mm A`
> - The current date is August 23, 2024
> - The time is 11:15 AM
> 
> A new note will be created:
> - Named **"Friday, 23rd at 11.15 AM"**
> - In the subfolder **"8-August"**
> 	- Nested under the folder **"2024"**

Once that is done, new notes with the new format will show up in the **Calendar**.