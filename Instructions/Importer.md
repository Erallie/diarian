---
title: Importer
layout: default
share: true
---
# Importer
Access the **Importer** from the context menu that opens after clicking the **ribbon icon**.

![open-importer]/diarian/Attachments/open-importer.png)

The **Importer** allows you to import a pre-existing journal from [Diarium](https://diariumapp.com/):
1. Follow the instructions onscreen to export your [Diarium](https://diariumapp.com/) journal to your local files.
2. After they've been exported, choose the exported zip file, and then select **Import**.

## Importer notes
- Entries will be imported to the location specified under **Settings → Daily notes**.
	- If you have multiple entries per day, follow the instructions under [Multiple or nested daily notes](https://erallie.github.io/diarian/Instructions/Multiple%20or%20nested%20daily%20notes.html#multiple-or-nested-daily-notes) before importing your journal.
- Attachments will be uploaded to the location specified under **Settings → Files and links → Default location for new attachments**.
- Properties will be populated according to the data exported from [Diarium](https://diariumapp.com/).
	- The **rating** property name can be set under **Settings → Diarian → Rating → Property name**.
	- If [Map View](https://obsidian.md/plugins?id=obsidian-map-view) is installed, the **location** property will use the name set under **Settings → Map View → Settings for the map view plugin. → Key for front matter location**.
	- Each tracker exported from [Diarium](https://diariumapp.com/) will be imported as an individual property.
	- If **How to handle duplicate notes** is set to **Append all new entries**, any existing properties from the new entry will be inserted inside a code block at the beginning of the appended content.
		- I am currently planning to add options to change this behavior in the near future.
