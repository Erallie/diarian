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

# Multiple or nested daily notes
This plugin reads your settings under **Settings → Daily notes** to create new daily notes.
- To create **multiple notes per day**, you must change the **Date format** to include the time within the note name.
- To create **nested daily notes**, change the **Date format** to include **slashes** ( / ) to indicate folders and subfolders.

> [!example] Format example
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