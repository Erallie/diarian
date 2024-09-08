---
share: true
---
# Table of Contents
1. [Home](../../../../enveloppe/Plugins%20&%20Themes/Diarian/Wiki/Home/About%20Diarian.md)
	1. [About Diarian](../../../../enveloppe/Plugins%20&%20Themes/Diarian/Wiki/Home/About%20Diarian.md)
	2. [Features](../../../../enveloppe/Plugins%20&%20Themes/Diarian/Wiki/Home/About%20Diarian.md#Features)
		1. [Included features](../../../../enveloppe/Plugins%20&%20Themes/Diarian/Wiki/Home/About%20Diarian.md#Included%20features)
		1. [Excluded features](../../../../enveloppe/Plugins%20&%20Themes/Diarian/Wiki/Home/About%20Diarian.md#Excluded%20features)
3. Instructions
	1. [Calendar](../Instructions/Calendar.md)
		1. [Editor navigation](Instructions/Calendar.md#Editor%20navigation)
	2. [On this day](../Instructions/On%20this%20day.md)
		1. [Notifications](../Instructions/On%20this%20day.md#Notifications)
			1. [Pop-up modals](../Instructions/On%20this%20day.md#Pop-up%20modals)
			2. [Notices](../Instructions/On%20this%20day.md#Notices)
	3. [Importer](../Instructions/Importer.md)
		1. [Importer notes](../Instructions/Importer.md#Importer%20notes)
	4. [Rating](../Instructions/Rating.md)
		1. [Customization](../Instructions/Rating.md#Customization)
	5. [Timestamp](../Instructions/Timestamp.md)
	6. [Multiple or nested daily notes](../Instructions/Multiple%20or%20nested%20daily%20notes.md)
4. [Installation](../Installation.md)
	1. [Use BRAT](../Installation.md#Use%20BRAT)
	2. [Manual installation](../Installation.md#Manual%20installation)
5. [Credits](../Credits.md)

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