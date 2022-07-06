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
exports.ExportToJSXBin = exports.ClearErrorHighlights = exports.HaltInHost = exports.EvalInAttachedHost = exports.InitializeCommands = exports.EvalInHost = void 0;
const vscode = require("vscode");
const nls = require("vscode-nls");
const fs = require("fs");
const path = require("path");
const ESDCore = require("../core/ESDCore");
const Constants_1 = require("../utils/Constants");
const Utils_1 = require("../utils/Utils");
const ESDAppSessionsManager_1 = require("./ESDAppSessionsManager");
const ESEvalProcess_1 = require("./ESEvalProcess");
const ESOutputChannel_1 = require("./ESOutputChannel");
const ExtensionHelpers_1 = require("./ExtensionHelpers");
nls.config({ messageFormat: nls.MessageFormat.file });
const localize = nls.loadMessageBundle(__filename);
function EvalInHost(args) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        args = args !== null && args !== void 0 ? args : {};
        let hostAppSpecifier = args.hostAppSpecifier;
        let registeredSpecifier = args.registeredSpecifier;
        {
            if (hostAppSpecifier === undefined || args.skipHostAppSpecCheck !== true) {
                [hostAppSpecifier, registeredSpecifier] = yield (0, ExtensionHelpers_1.GetAndResolveApplicationSpecifierAndRegisteredSpecifier)(hostAppSpecifier, registeredSpecifier);
            }
            if (hostAppSpecifier === null || hostAppSpecifier === undefined) {
                return false;
            }
        }
        let engineName = args.engineName;
        {
            if (args.engineName === undefined || args.skipHostEngineCheck !== true) {
                const helper = new ExtensionHelpers_1.HostAppComsHelper();
                engineName = yield helper.getAndResolveEngineName(hostAppSpecifier, args.engineName);
            }
            if (engineName === null || engineName === undefined) {
                return false;
            }
        }
        {
            const proc = ESEvalProcess_1.EvalProcess.GetActiveEvalForEngine(hostAppSpecifier, engineName);
            if (proc !== undefined) {
                if (proc.getIsShuttingDown()) {
                    let resolveFunc;
                    const procEnded = new Promise(resolve => {
                        resolveFunc = resolve;
                        proc.registerForEndedEvent(resolve);
                    });
                    yield procEnded;
                    proc.unregisterForEndedEvent(resolveFunc);
                }
                else {
                    const warnMsg = `An eval process is already active for host "${hostAppSpecifier}" and engine "${engineName}". Skipping.`;
                    ESOutputChannel_1.OutputChannel.log(warnMsg);
                    console.warn(warnMsg);
                    (0, Utils_1.ShowErrorPrompt)(new Error(warnMsg));
                    return false;
                }
            }
        }
        let filePath = "";
        let fileSource = "";
        if (args.script !== undefined) {
            try {
                filePath = ESDCore.ConvertUriToPath_Safe(args.script);
                fileSource = yield fs.promises.readFile(filePath, { encoding: "utf8" });
            }
            catch (err) {
                const errMsg = `Error encountered attempting to read file at path:\n\t${args.script}\nError was:\n\t${err}`;
                ESOutputChannel_1.OutputChannel.log(errMsg);
                console.error(errMsg);
                return false;
            }
        }
        else {
            const editor = vscode.window.activeTextEditor;
            if (editor === undefined) {
                const warnMsg = `No active TextEditor. Nothing to send to host app ${hostAppSpecifier}.`;
                ESOutputChannel_1.OutputChannel.log(warnMsg);
                console.warn(warnMsg);
                return false;
            }
            const scheme = editor.document.uri.scheme;
            if (scheme !== "file" && scheme !== "untitled") {
                const warnMsg = `Invalid view focused. Please focus a file for evaluation.`;
                ESOutputChannel_1.OutputChannel.log(warnMsg);
                console.warn(warnMsg);
                return false;
            }
            filePath = editor.document.isUntitled ? editor.document.uri.toString() : editor.document.uri.fsPath;
            fileSource = editor.document.getText();
        }
        const bringToFront = (_a = args.bringToFront) !== null && _a !== void 0 ? _a : vscode.workspace.getConfiguration("extendscript.scriptEvaluation").get("bringTargetApplicationToFront", false);
        const debugSession = ESDAppSessionsManager_1.APP_SESSIONS.getActiveSessionForApplicationAndEngine(hostAppSpecifier, engineName);
        let breakpoints;
        if (debugSession !== undefined) {
            filePath = debugSession.convertToAliasPathIfNeeded(filePath);
            args.debugLevel = (_b = args.debugLevel) !== null && _b !== void 0 ? _b : 1;
            if (args.debugLevel > 0) {
                breakpoints = debugSession.getActiveBreakpoints();
            }
        }
        else {
            args.debugLevel = 0;
        }
        const debugLevel = args.debugLevel;
        const appSpec = hostAppSpecifier;
        const engName = engineName;
        const evalProc = new ESEvalProcess_1.EvalProcess(appSpec, engName, filePath, registeredSpecifier);
        const evalPromise = evalProc.evalScriptInHostAppEngine(fileSource, bringToFront, debugLevel, breakpoints);
        evalPromise.catch((err) => __awaiter(this, void 0, void 0, function* () {
            const errInfo = (err instanceof Error) ? err.message : `${err}`;
            const errMsg = `An error occurred while evaluating script '${evalProc.getNormalizedPath()}' in host engine ${evalProc.getAppSpec()}(${evalProc.getEngineName()}).\nError information: ${errInfo}`;
            ESOutputChannel_1.OutputChannel.log(errMsg);
            if (err instanceof ESDCore.DebugMessageError && err.debugMsg.body === "ENGINE BUSY") {
                const items = [
                    {
                        title: localize(0, null),
                        isCloseAffordance: false,
                    },
                    {
                        title: localize(1, null),
                        isCloseAffordance: true,
                    },
                ];
                const options = {
                    modal: true,
                };
                const selection = yield vscode.window.showWarningMessage(localize(2, null, `${appSpec} (${engName})`), options, ...items);
                if (selection === undefined || items.indexOf(selection) === 1) {
                    return;
                }
                const helper = new ExtensionHelpers_1.HostAppComsHelper();
                helper.sendDebugHaltCommandToHost(appSpec, engName);
                if ((args === null || args === void 0 ? void 0 : args.launchConfiguration) !== undefined) {
                    vscode.debug.startDebugging(undefined, args.launchConfiguration);
                }
                else {
                    const newArgs = Object.assign(Object.assign({}, args), { skipHostAppSpecCheck: true, skipHostEngineCheck: true });
                    EvalInHost(newArgs);
                }
            }
        }));
        return true;
    });
}
exports.EvalInHost = EvalInHost;
const ACTIVE_ATTACHED_SESSIONS = [];
function OnDebugSessionStarted(e) {
    if (e.type === Constants_1.DEBUG_TYPE_IDENTIFIER &&
        e.configuration.request === "attach") {
        ACTIVE_ATTACHED_SESSIONS.push(e);
    }
}
function OnDebugSessionTerminated(e) {
    const idx = ACTIVE_ATTACHED_SESSIONS.indexOf(e);
    if (idx > -1) {
        ACTIVE_ATTACHED_SESSIONS.splice(idx, 1);
    }
}
function InitializeCommands() {
    vscode.debug.onDidStartDebugSession(OnDebugSessionStarted);
    vscode.debug.onDidTerminateDebugSession(OnDebugSessionTerminated);
}
exports.InitializeCommands = InitializeCommands;
function EvalInAttachedHost(args) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let session;
        if (ACTIVE_ATTACHED_SESSIONS.length === 1) {
            session = ACTIVE_ATTACHED_SESSIONS[0];
        }
        else if (ACTIVE_ATTACHED_SESSIONS.length > 1) {
            const items = ACTIVE_ATTACHED_SESSIONS.map((sesh) => {
                const config = sesh.configuration;
                return {
                    label: sesh.name,
                    description: `${config.hostAppSpecifier} (${config.engineName})`,
                };
            });
            const options = {
                canPickMany: false,
                placeHolder: localize(3, null),
            };
            const selection = yield vscode.window.showQuickPick(items, options);
            if (selection === undefined) {
                return;
            }
            session = ACTIVE_ATTACHED_SESSIONS[items.indexOf(selection)];
        }
        else {
            const didStart = yield vscode.debug.startDebugging(undefined, {
                type: Constants_1.DEBUG_TYPE_IDENTIFIER,
                name: "Attach for Eval",
                request: "attach",
            });
            if (didStart) {
                session = vscode.debug.activeDebugSession;
                if (session !== undefined) {
                    const config = session.configuration;
                    session.name += ` (${(_a = config.registeredSpecifier) !== null && _a !== void 0 ? _a : config.hostAppSpecifier} (${config.engineName}))`;
                }
            }
        }
        if (session !== undefined) {
            const config = session.configuration;
            const evalArgs = Object.assign(Object.assign({}, args), { hostAppSpecifier: config.hostAppSpecifier, engineName: config.engineName, registeredSpecifier: config.registeredSpecifier, skipHostAppSpecCheck: true, skipHostEngineCheck: true });
            EvalInHost(evalArgs);
        }
    });
}
exports.EvalInAttachedHost = EvalInAttachedHost;
function HaltInHost(args) {
    return __awaiter(this, void 0, void 0, function* () {
        args = args !== null && args !== void 0 ? args : {};
        let proc = args.evalProc;
        if (proc === undefined) {
            const activeProcs = ESEvalProcess_1.EvalProcess.GetActiveEvalProcesses();
            if (activeProcs.length === 0) {
                const warnMsg = `No active eval process available to halt. Skipping.`;
                ESOutputChannel_1.OutputChannel.log(warnMsg);
                console.warn(warnMsg);
                (0, Utils_1.ShowErrorPrompt)(new Error(warnMsg));
                return;
            }
            else if (activeProcs.length === 1) {
                proc = activeProcs[0];
            }
            else {
                const options = {
                    canPickMany: false,
                    placeHolder: localize(4, null),
                };
                const items = activeProcs.map((proc) => {
                    return {
                        label: proc.getDescription(),
                        description: proc.getAppSpec(),
                    };
                });
                const selection = yield vscode.window.showQuickPick(items, options);
                if (selection === undefined) {
                    return;
                }
                proc = activeProcs[items.indexOf(selection)];
            }
        }
        const appSpec = proc.getAppSpec();
        const engineName = proc.getEngineName();
        try {
            ESOutputChannel_1.OutputChannel.log(`Halting script '${proc.getNormalizedPath()}' in host '${appSpec}} (${engineName})'...`);
            if (ESDCore.IsApplicationRunning(appSpec)) {
                proc.halt();
            }
            else {
                proc.forceCancel(`The host application ${appSpec} is no longer running (engine: ${engineName}).`);
            }
        }
        catch (err) {
            const errInfo = (err instanceof Error) ? err.message : `${err}`;
            const errMsg = `Failed to send halt message to host engine ${appSpec}(${engineName}).\nError information: ${errInfo}`;
            ESOutputChannel_1.OutputChannel.log(errMsg);
        }
        const session = ESDAppSessionsManager_1.APP_SESSIONS.getActiveSessionForApplicationAndEngine(proc.getAppSpec(), proc.getEngineName());
        if (session !== undefined) {
            session.onEvaluationHalted();
        }
    });
}
exports.HaltInHost = HaltInHost;
function ClearErrorHighlights() {
    ESEvalProcess_1.EvalProcess.ClearActiveErrorHighlights();
}
exports.ClearErrorHighlights = ClearErrorHighlights;
function ExportToJSXBin() {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            const warnMsg = "[JSXBin Export] No active editor detected - nothing to process.";
            ESOutputChannel_1.OutputChannel.log(warnMsg);
            console.warn(warnMsg);
            return;
        }
        const document = editor.document;
        const scriptPath = document.fileName;
        let includePath = "";
        if (!document.isUntitled) {
            includePath = path.dirname(scriptPath);
        }
        const scriptSource = document.getText();
        const compileResult = ESDCore.CompileToJSXBin(scriptSource, document.isUntitled ? "" : scriptPath, includePath);
        if (compileResult.error !== undefined) {
            const errMsg = `Failed to compile JSXBin:\n${compileResult.error}`;
            ESOutputChannel_1.OutputChannel.log(errMsg);
            (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
            return;
        }
        const saveScriptName = `${path.basename(scriptPath, path.extname(scriptPath))}.jsxbin`;
        let saveScriptPath = undefined;
        if (vscode.workspace.workspaceFolders !== undefined) {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            saveScriptPath = vscode.Uri.file(path.join(workspacePath, saveScriptName));
        }
        let options = {
            defaultUri: saveScriptPath,
            filters: {
                jsxbin: ['jsxbin'],
            },
        };
        const saveResult = yield vscode.window.showSaveDialog(options);
        if (saveResult === undefined) {
            return;
        }
        (0, ExtensionHelpers_1.WriteToFile)(saveResult.fsPath, compileResult.output);
    });
}
exports.ExportToJSXBin = ExportToJSXBin;

//# sourceMappingURL=ExtensionCommands.js.map
