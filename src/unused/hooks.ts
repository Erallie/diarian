import { useContext } from "react";
import { AppContext, PluginContext, ViewContext } from "./context";
import { App, View } from "obsidian";
import Diarium from 'main';

export const useApp = (): App | undefined => {
    return useContext(AppContext);
};


export const usePlugin = (): Diarium | undefined => {
    return useContext(PluginContext);
};

export const useView = (): View | undefined => {
    return useContext(ViewContext);
};
