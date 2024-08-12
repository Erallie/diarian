import { createContext } from "react";
import { App, View } from "obsidian";
import Diarium from 'main';

export const AppContext = createContext<App | undefined>(undefined);

export const ViewContext = createContext<View | undefined>(undefined);

export const PluginContext = createContext<Diarium | undefined>(undefined);