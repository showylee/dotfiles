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
exports.EvalProcess = void 0;
const vscode = require("vscode");
const events = require("events");
const fs = require("fs");
const path = require("path");
const ESDCore = require("../core/ESDCore");
const ESTKP = require("../core/ESTK3DebuggingProtocol");
const ESOutputChannel_1 = require("./ESOutputChannel");
class EvalProcess {
    constructor(_hostAppSpecifier, _engineName, _scriptID, _registeredSpecifier) {
        this.emitter = new events.EventEmitter();
        this.didIssueHaltCommand = false;
        this.hostAppSpecifier = _hostAppSpecifier;
        this.engineName = _engineName;
        this.scriptID = _scriptID;
        this.registeredSpecifier = _registeredSpecifier;
    }
    static IsEvalActiveInEngine(app, engine) {
        return this.ACTIVE_EVAL_PROCESSES.some((proc) => {
            return proc.hostAppSpecifier === app && proc.engineName === engine;
        });
    }
    static GetActiveEvalForEngine(app, engine) {
        return this.ACTIVE_EVAL_PROCESSES.find((proc) => {
            return proc.hostAppSpecifier === app && proc.engineName === engine;
        });
    }
    static AddActiveProcess(proc) {
        EvalProcess.ACTIVE_EVAL_PROCESSES.push(proc);
        EvalProcess.ACTIVE_EVAL_EVENTS.emit(EvalProcess.CHANGE_EVENT);
    }
    static RemoveActiveProcess(proc) {
        const idx = EvalProcess.ACTIVE_EVAL_PROCESSES.indexOf(proc);
        if (idx > -1) {
            EvalProcess.ACTIVE_EVAL_PROCESSES.splice(idx, 1);
            EvalProcess.ACTIVE_EVAL_EVENTS.emit(EvalProcess.CHANGE_EVENT);
            return true;
        }
        return false;
    }
    static AddActiveProcessesChangedListener(listener) {
        EvalProcess.ACTIVE_EVAL_EVENTS.addListener(EvalProcess.CHANGE_EVENT, listener);
    }
    static RemoveActiveProcessesChangedListener(listener) {
        EvalProcess.ACTIVE_EVAL_EVENTS.removeListener(EvalProcess.CHANGE_EVENT, listener);
    }
    static GetActiveEvalProcesses() {
        return EvalProcess.ACTIVE_EVAL_PROCESSES;
    }
    static ClearActiveErrorHighlights() {
        EvalProcess.ACTIVE_ERROR_HIGHLIGHTS.forEach(item => item.dispose());
        EvalProcess.ACTIVE_ERROR_HIGHLIGHTS = [];
    }
    getAppSpec() {
        return this.hostAppSpecifier;
    }
    getEngineName() {
        return this.engineName;
    }
    getRegisteredSpecifier() {
        return this.registeredSpecifier;
    }
    getNormalizedPath() {
        return vscode.Uri.parse(this.scriptID).path;
    }
    getFileName() {
        return path.basename(this.getNormalizedPath());
    }
    getDescription() {
        var _a;
        return `${this.getFileName()} in ${ESDCore.GetDisplayNameForApplication((_a = this.registeredSpecifier) !== null && _a !== void 0 ? _a : this.hostAppSpecifier)} (${this.engineName})`;
    }
    getIsEvaluating() {
        return this.cancelFunc !== undefined;
    }
    getIsShuttingDown() {
        return this.didIssueHaltCommand;
    }
    halt(disconnect) {
        if (this.getIsEvaluating()) {
            const options = {
                shutdown: disconnect,
            };
            ESTKP.SendDebugCommand(this.hostAppSpecifier, this.engineName, "halt", options);
            this.didIssueHaltCommand = true;
        }
    }
    forceCancel(reason) {
        if (this.cancelFunc !== undefined) {
            this.cancelFunc(reason);
        }
    }
    registerForEndedEvent(listener) {
        this.emitter.addListener(EvalProcess.ENDED_EVENT, listener);
    }
    unregisterForEndedEvent(listener) {
        this.emitter.removeListener(EvalProcess.ENDED_EVENT, listener);
    }
    evalScriptInHostAppEngine(fileSource, bringToFront, debugLevel, breakpoints) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const options = {
                    file: this.scriptID,
                    source: fileSource,
                    breakpoints
                };
                if (debugLevel !== undefined) {
                    options.debug = debugLevel;
                }
                if (bringToFront) {
                    ESDCore.BringApplicationToFront(this.hostAppSpecifier);
                }
                EvalProcess.ClearActiveErrorHighlights();
                ESOutputChannel_1.OutputChannel.log(`Evaluating script '${this.getNormalizedPath()}' in host '${this.hostAppSpecifier} (${this.engineName})'...`);
                const evalRequestOpts = {};
                EvalProcess.AddActiveProcess(this);
                ESDCore.RegisterConnectionHandler(this);
                const evalPromise = ESTKP.Eval(this.hostAppSpecifier, this.engineName, options, undefined, evalRequestOpts);
                this.cancelFunc = evalRequestOpts.outCancelFunc;
                const result = yield evalPromise;
                this.cancelFunc = undefined;
                ESDCore.UnregisterConnectionHandler(this);
                this.emitter.emit(EvalProcess.ENDED_EVENT, this);
                EvalProcess.RemoveActiveProcess(this);
                const showMessageBox = vscode.workspace.getConfiguration("extendscript.scriptEvaluation").get("showResultMessages", true);
                if (result === undefined) {
                    const msg = `Eval Skipped: ${fileSource === "" ? "Nothing to evaluate." : "An unknown error occurred. Please check the file and try again."}`;
                    ESOutputChannel_1.OutputChannel.log(msg);
                    if (showMessageBox) {
                        vscode.window.showInformationMessage(msg);
                    }
                }
                else if ("error" in result) {
                    if (result.error['@id'] === -34 && this.didIssueHaltCommand) {
                    }
                    else {
                        const msg = `Eval Error (#${result.error['@id']}): "${result.error['#value']}" in '${result.error['@file']}' [${result.error['@line']}:${result.error['@col']}] in host '${this.hostAppSpecifier} (${this.engineName})'.`;
                        ESOutputChannel_1.OutputChannel.log(msg);
                        let errorDecoration;
                        const highlightError = vscode.workspace.getConfiguration("extendscript.scriptEvaluation").get("highlightErrorLines", true);
                        if (highlightError) {
                            if (typeof result.error['@file'] === "string") {
                                let uri = undefined;
                                if (fs.existsSync(result.error['@file'])) {
                                    uri = vscode.Uri.file(result.error['@file'].toString());
                                }
                                else if (result.error['@file'].startsWith("untitled:")) {
                                    uri = vscode.Uri.parse(result.error['@file']);
                                }
                                if (uri !== undefined) {
                                    const textDoc = yield vscode.workspace.openTextDocument(uri);
                                    const selectRange = textDoc.lineAt(result.error['@line'] - 1).range;
                                    const showOpts = {
                                        viewColumn: vscode.ViewColumn.Active,
                                        selection: selectRange,
                                    };
                                    const textEditor = yield vscode.window.showTextDocument(textDoc, showOpts);
                                    const decoRenderOpts = {
                                        backgroundColor: new vscode.ThemeColor("debugExceptionWidget.background"),
                                        isWholeLine: true,
                                    };
                                    errorDecoration = vscode.window.createTextEditorDecorationType(decoRenderOpts);
                                    const decOpts = {
                                        range: selectRange,
                                        hoverMessage: msg,
                                    };
                                    textEditor.setDecorations(errorDecoration, [decOpts]);
                                    EvalProcess.ACTIVE_ERROR_HIGHLIGHTS.push(errorDecoration);
                                }
                            }
                        }
                        if (showMessageBox) {
                            yield vscode.window.showErrorMessage(msg);
                            if (errorDecoration !== undefined) {
                                const idx = EvalProcess.ACTIVE_ERROR_HIGHLIGHTS.indexOf(errorDecoration);
                                if (idx > -1) {
                                    EvalProcess.ACTIVE_ERROR_HIGHLIGHTS.splice(idx);
                                }
                                errorDecoration.dispose();
                            }
                        }
                    }
                }
                else {
                    const msg = `Eval Result [${this.hostAppSpecifier} (${this.engineName})]: ${result.value['#value']}`;
                    ESOutputChannel_1.OutputChannel.log(msg);
                    if (showMessageBox) {
                        vscode.window.showInformationMessage(msg);
                    }
                }
            }
            catch (err) {
                this.cancelFunc = undefined;
                ESDCore.UnregisterConnectionHandler(this);
                this.emitter.emit(EvalProcess.ENDED_EVENT, this);
                EvalProcess.RemoveActiveProcess(this);
                throw err;
            }
        });
    }
    handleDebugProtocolMessage(reason, message) {
        return false;
    }
}
exports.EvalProcess = EvalProcess;
EvalProcess.ACTIVE_EVAL_PROCESSES = new Array();
EvalProcess.ACTIVE_EVAL_EVENTS = new events.EventEmitter();
EvalProcess.CHANGE_EVENT = "change";
EvalProcess.ENDED_EVENT = "ended";
EvalProcess.ACTIVE_ERROR_HIGHLIGHTS = [];

//# sourceMappingURL=ESEvalProcess.js.map
