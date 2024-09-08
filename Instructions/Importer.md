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

# Importer
Access the **Importer** from the context menu that opens after clicking the **ribbon icon**.

![open-importer](../Attachments/open-importer.png)

The **Importer** allows you to import a pre-existing journal from [Diarium](https://diariumapp.com/):
1. Follow the instructions onscreen to export your [Diarium](https://diariumapp.com/) journal to your local files.
2. After they've been exported, choose the exported zip file, and then select **Import**.
## Importer notes
- Entries will be imported to the location specified under **Settings → Daily notes**.
	- If you have multiple entries per day, follow the instructions under [Multiple/nested daily notes](Importer.md##multiplenested-daily-notes) before importing your journal.
- Attachments will be uploaded to the location specified under **Settings → Files and links → Default location for new attachments**.
- Properties will be populated according to the data exported from [Diarium](https://diariumapp.com/).
	- The **rating** property name can be set under **Settings → Diarian → Rating → Property name**.
	- If [Map View](https://obsidian.md/plugins?id=obsidian-map-view) is installed, the **location** property will use the name set under **Settings → Map View → Settings for the map view plugin. → Key for front matter location**.
	- Each tracker exported from [Diarium](https://diariumapp.com/) will be imported as an individual property.
	- If **How to handle duplicate notes** is set to **Append all new entries**, any existing properties from the new entry will be inserted inside a code block at the beginning of the appended content.
		- I am currently planning to add options to change this behavior in the near future.
