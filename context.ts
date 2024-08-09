import { createContext } from "react";
import { App } from "obsidian";
import Diarium from 'main';

export const AppContext = createContext<App | undefined>(undefined);

export const PluginContext = createContext<Diarium | undefined>(undefined);