import { createContext } from "react";
import { App } from "obsidian";

export const AppContext = createContext < App | undefined > (undefined);

this.root = createRoot(this.containerEl.children[1]);
this.root.render(
    <AppContext.Provider value={this.app} >
        <ReactView />
    </AppContext.Provider>
);