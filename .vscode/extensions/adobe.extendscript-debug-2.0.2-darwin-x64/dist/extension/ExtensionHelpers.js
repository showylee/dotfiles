"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostAppComsHelper = exports.HandleUnhandledBreakRequest = exports.GetCommsSpecifierForSpecifierFromSettings = exports.GetRegisteredSpecifierForSpecifierFromSettings = exports.GetAndResolveApplicationSpecifierAndRegisteredSpecifier = exports.UnzipResourcesIfPresent = exports.WriteToFile = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const fs = require("fs");
const targz = require("targz");
const path = require("path");
const Constants_1 = require("../utils/Constants");
const Utils_1 = require("../utils/Utils");
const ESDCore = require("../core/ESDCore");
const ESTKP = require("../core/ESTK3DebuggingProtocol");
const ESOutputChannel_1 = require("./ESOutputChannel");
nls.config({ messageFormat: nls.MessageFormat.file });
const localize = nls.loadMessageBundle(__filename);
function WriteToFile(filePath, text) {
    try {
        fs.writeFileSync(filePath, text);
        const msg = localize(0, null, filePath);
        ESOutputChannel_1.OutputChannel.log(msg);
        vscode.window.showInformationMessage(msg, {
            modal: true,
        });
    }
    catch (err) {
        const errMsg = err instanceof Error ? err.message : typeof err === "string" ? err : `${err}`;
        ESOutputChannel_1.OutputChannel.log(errMsg);
        (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
    }
}
exports.WriteToFile = WriteToFile;
function UnzipResourcesIfPresent() {
    return new Promise((resolve, reject) => {
        const platform = `${process.platform}`;
        if (platform !== "darwin") {
            resolve();
            return;
        }
        const resourcesBasePath = path.join(__dirname, "../../lib/esdebugger-core/mac");
        const resourcesPath = path.join(resourcesBasePath, "Resources");
        if (fs.existsSync(resourcesPath)) {
            resolve();
            return;
        }
        const resourcesTar = path.join(resourcesBasePath, "Resources.tgz");
        if (fs.existsSync(resourcesTar)) {
            try {
                targz.decompress({ src: resourcesTar, dest: resourcesBasePath }, function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                    return;
                });
            }
            catch (err) {
                reject(err);
                return;
            }
        }
        else {
            reject(localize(1, null));
        }
    });
}
exports.UnzipResourcesIfPresent = UnzipResourcesIfPresent;
function GetAndResolveApplicationSpecifierAndRegisteredSpecifier(requestSpec, registeredSpecifier) {
    return __awaiter(this, void 0, void 0, function* () {
        if (requestSpec === undefined) {
            try {
                const items = ESDCore.GetInstalledApplications();
                if (items.length <= 0) {
                    const errMsg = localize(2, null, requestSpec);
                    ESOutputChannel_1.OutputChannel.log(errMsg);
                    (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
                    return [undefined, undefined];
                }
                const names = items.map((entry) => {
                    return {
                        label: entry.name,
                        description: entry.specifier,
                    };
                });
                const options = {
                    canPickMany: false,
                    placeHolder: localize(3, null),
                };
                const selection = yield vscode.window.showQuickPick(names, options);
                if (selection === undefined || selection.description === undefined) {
                    return [undefined, undefined];
                }
                const commsSpec = GetCommsSpecifierForSpecifierFromSettings(selection.description);
                if (commsSpec !== undefined) {
                    requestSpec = commsSpec;
                    registeredSpecifier = selection.description;
                }
                else {
                    requestSpec = selection.description;
                    registeredSpecifier = undefined;
                }
            }
            catch (e) {
                console.error(`Unknown error occurred while asking user to select host application.`);
                console.log(JSON.stringify(e, undefined, 2));
                return [null, undefined];
            }
        }
        else {
            registeredSpecifier = registeredSpecifier !== null && registeredSpecifier !== void 0 ? registeredSpecifier : GetRegisteredSpecifierForSpecifierFromSettings(requestSpec);
            if (!ESDCore.IsApplicationInstalled(registeredSpecifier !== null && registeredSpecifier !== void 0 ? registeredSpecifier : requestSpec)) {
                const errMsg = localize(4, null, requestSpec);
                ESOutputChannel_1.OutputChannel.log(errMsg);
                (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
                return [null, undefined];
            }
        }
        if (!ESDCore.IsApplicationRunning(requestSpec)) {
            const errMsg = localize(5, null, requestSpec);
            ESOutputChannel_1.OutputChannel.log(errMsg);
            (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
            return [undefined, undefined];
        }
        return [ESDCore.ResolveApplicationSpecifier(requestSpec), registeredSpecifier];
    });
}
exports.GetAndResolveApplicationSpecifierAndRegisteredSpecifier = GetAndResolveApplicationSpecifierAndRegisteredSpecifier;
function GetRegisteredSpecifierForSpecifierFromSettings(specifier) {
    const overrides = vscode.workspace.getConfiguration("extendscript.advanced").get("applicationSpecifierOverrides", []);
    const matchedOverride = overrides.find((override) => {
        return override.appSpecRegExp !== undefined &&
            override.appSpecRegExp.length > 0 &&
            specifier.match(override.appSpecRegExp) !== null;
    });
    return matchedOverride === null || matchedOverride === void 0 ? void 0 : matchedOverride.registeredSpecifier;
}
exports.GetRegisteredSpecifierForSpecifierFromSettings = GetRegisteredSpecifierForSpecifierFromSettings;
function GetCommsSpecifierForSpecifierFromSettings(specifier) {
    const overrides = vscode.workspace.getConfiguration("extendscript.advanced").get("applicationSpecifierOverrides", []);
    const matchedOverride = overrides.find((override) => {
        return override.registeredSpecifier === specifier;
    });
    return matchedOverride === null || matchedOverride === void 0 ? void 0 : matchedOverride.commsSpecifier;
}
exports.GetCommsSpecifierForSpecifierFromSettings = GetCommsSpecifierForSpecifierFromSettings;
function HandleUnhandledBreakRequest(reason, message) {
    if (message.body.startsWith("<break ")) {
        const app = ESDCore.GetDisplayNameForApplication(message.sender);
        let engine = "";
        {
            const key = `engine="`;
            const keyLoc = message.body.indexOf(key);
            if (keyLoc > 0) {
                const start = keyLoc + key.length;
                const end = message.body.indexOf(`"`, start);
                if (end > 0) {
                    engine = message.body.substring(start, end);
                }
            }
        }
        if (engine.length > 0) {
            const msg = `The ExtendScript engine "${engine}" in ${app} is paused on a breakpoint.`;
            const attachOption = "Attach Debug Session";
            vscode.window.showInformationMessage(msg, attachOption).then((value) => {
                if (value === attachOption) {
                    const config = {
                        type: Constants_1.DEBUG_TYPE_IDENTIFIER,
                        name: "Attach for Break",
                        request: "attach",
                        hostAppSpecifier: message.sender.substring(0, message.sender.indexOf("#")),
                        engineName: engine,
                    };
                    vscode.debug.startDebugging(undefined, config);
                }
            });
        }
        return true;
    }
    else {
        return false;
    }
}
exports.HandleUnhandledBreakRequest = HandleUnhandledBreakRequest;
class HostAppComsHelper {
    getAndResolveEngineName(hostAppSpecifier, requestEngine) {
        return __awaiter(this, void 0, void 0, function* () {
            let engineNames;
            try {
                ESDCore.RegisterConnectionHandler(this);
                const response = yield ESTKP.Connect(hostAppSpecifier);
                ESDCore.UnregisterConnectionHandler(this);
                const engineDefs = response.engines.engine;
                engineNames = Array.isArray(engineDefs) ? engineDefs.map(engine => { return engine['@name']; }) : [engineDefs['@name']];
            }
            catch (err) {
                ESDCore.UnregisterConnectionHandler(this);
                const errMsg = localize(6, null, hostAppSpecifier);
                ESOutputChannel_1.OutputChannel.log(errMsg);
                (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
                return undefined;
            }
            if (requestEngine === undefined) {
                if (engineNames.length === 1) {
                    requestEngine = engineNames[0];
                }
                else {
                    const options = {
                        canPickMany: false,
                        placeHolder: localize(7, null),
                    };
                    const selection = yield vscode.window.showQuickPick(engineNames, options);
                    if (selection === undefined) {
                        return undefined;
                    }
                    requestEngine = selection;
                }
            }
            else {
                try {
                    ESDCore.RegisterConnectionHandler(this);
                    yield ESTKP.GetBreakpoints(hostAppSpecifier, requestEngine);
                    ESDCore.UnregisterConnectionHandler(this);
                }
                catch (err) {
                    ESDCore.UnregisterConnectionHandler(this);
                    if (err instanceof ESDCore.DebugMessageErrorResponseError &&
                        err.debugMsg.body === "Cannot resolve reference") {
                        const errMsg = localize(8, null, hostAppSpecifier, requestEngine);
                        ESOutputChannel_1.OutputChannel.log(errMsg);
                        (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
                    }
                    else {
                        const errMsg = localize(9, null, hostAppSpecifier, requestEngine, err.message);
                        ESOutputChannel_1.OutputChannel.log(errMsg);
                        (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
                    }
                    return null;
                }
            }
            return requestEngine;
        });
    }
    sendDebugHaltCommandToHost(hostAppSpecifier, engineName) {
        try {
            ESDCore.RegisterConnectionHandler(this);
            ESTKP.SendDebugCommand(hostAppSpecifier, engineName, "halt");
            ESDCore.UnregisterConnectionHandler(this);
        }
        catch (err) {
            ESDCore.UnregisterConnectionHandler(this);
            throw err;
        }
    }
    handleDebugProtocolMessage(reason, message) {
        return false;
    }
}
exports.HostAppComsHelper = HostAppComsHelper;

//# sourceMappingURL=ExtensionHelpers.js.map
