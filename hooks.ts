import { useContext } from "react";
import { AppContext, PluginContext } from "context";

export const useApp = (): App | undefined => {
    return useContext(AppContext);
};


export const usePlugin = (): Diarium | undefined => {
    return useContext(PluginContext);
};
