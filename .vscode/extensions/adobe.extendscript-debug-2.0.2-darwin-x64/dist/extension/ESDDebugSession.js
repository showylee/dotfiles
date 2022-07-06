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
exports.ESDDebugSession = void 0;
const fs = require("fs");
const path = require("path");
const DA = require("vscode-debugadapter");
const nls = require("vscode-nls");
const ESTKP = require("../core/ESTK3DebuggingProtocol");
const ESDCore = require("../core/ESDCore");
const Constants_1 = require("../utils/Constants");
const Utils_1 = require("../utils/Utils");
const ESDAppSessionsManager_1 = require("./ESDAppSessionsManager");
const ESOutputChannel_1 = require("./ESOutputChannel");
const ESEvalProcess_1 = require("./ESEvalProcess");
const ExtensionCommands_1 = require("./ExtensionCommands");
nls.config({ messageFormat: nls.MessageFormat.file });
const localize = nls.loadMessageBundle(__filename);
const CAUGHT_EXCEPTION_FILTER = "caught";
class ESDDebugSession extends DA.LoggingDebugSession {
    constructor() {
        super();
        this.mBreakpoints = new Map();
        this.mBreakOnCaughtExceptions = false;
        this.mEngineRunning = true;
        this.mActiveFrameCount = -1;
        this.mActiveFrameID = -1;
        this.mVariableRefs = new DA.Handles();
        this.mSourceRefs = new DA.Handles();
        this.mErrorInfo = null;
        this.setDebuggerLinesStartAt1(true);
    }
    getRequestType() {
        return this.mRequestType;
    }
    getConfigurationComplete() {
        return this.mConfigDonePromise !== undefined &&
            this.mConfigDoneSignaler === undefined;
    }
    getHostAppSpecifier() {
        return this.mAppSpecifier;
    }
    getEngineName() {
        return this.mEngineName;
    }
    onEngineRenamed(newName) {
        this.mEngineName = newName;
    }
    onEngineShutdown() {
        this.mEngineRunning = false;
        const termEvent = new DA.TerminatedEvent();
        this.sendEvent(termEvent);
    }
    onLaunchEvalEnded(proc) {
        if (this.mEvalEndedCallback !== undefined) {
            proc.unregisterForEndedEvent(this.mEvalEndedCallback);
        }
        const termEvent = new DA.TerminatedEvent();
        this.sendEvent(termEvent);
    }
    onEvaluationHalted() {
        if (this.mRequestType !== "launch") {
            const contEvent = new DA.ContinuedEvent(ESDDebugSession.THREAD_ID);
            this.sendEvent(contEvent);
        }
    }
    initializeRequest(response, args) {
        const config = {
            supportTerminateDebuggee: true,
            supportsConditionalBreakpoints: true,
            supportsConfigurationDoneRequest: true,
            supportsExceptionInfoRequest: true,
            supportsHitConditionalBreakpoints: true,
            supportsLogPoints: true,
            supportsSetVariable: true,
            supportsEvaluateForHovers: true,
            exceptionBreakpointFilters: [
                {
                    label: "Caught Exceptions",
                    filter: CAUGHT_EXCEPTION_FILTER,
                    description: "Whether or not to break on exceptions thrown within try blocks.\n[NOTE] Changes to this setting during script evaluation are ignored within pre-existing scopes (stack frames).",
                }
            ],
        };
        this.mConfigDonePromise = new Promise((resolve) => {
            this.mConfigDoneSignaler = resolve;
        });
        response.body = config;
        this.sendResponse(response);
        this.sendEvent(new DA.InitializedEvent());
    }
    configurationDoneRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mConfigDoneSignaler !== undefined) {
                this.mConfigDoneSignaler();
                this.mConfigDoneSignaler = undefined;
            }
            else {
                this.mConfigDonePromise = Promise.resolve();
            }
            this.sendResponse(response);
        });
    }
    launchRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mRequestType = "launch";
            {
                if (args.aliasPath !== undefined) {
                    this.mAliasMap = {
                        aliasRoot: args.aliasPath,
                        projectRoot: fs.realpathSync(args.aliasPath),
                    };
                }
                this.mEngineName = args.engineName;
                this.mAppSpecifier = args.hostAppSpecifier;
                if (Array.isArray(args.hiddenTypes) && args.hiddenTypes.length > 0) {
                    this.mHiddenTypes = args.hiddenTypes;
                }
            }
            {
                if (this.mConfigDonePromise !== undefined) {
                    yield this.mConfigDonePromise;
                }
                else {
                    const errMsg = `DAP Error: Launch Request received before Initialize Request!`;
                    ESOutputChannel_1.OutputChannel.log(errMsg);
                    throw new Error(errMsg);
                }
            }
            try {
                ESDAppSessionsManager_1.APP_SESSIONS.registerDebugSession(this);
                const evalArgs = {
                    registeredSpecifier: args.registeredSpecifier,
                    bringToFront: args.bringToFront,
                    debugLevel: args.debugLevel,
                    engineName: this.mEngineName,
                    script: args.script,
                    hostAppSpecifier: this.mAppSpecifier,
                    skipHostAppSpecCheck: true,
                    skipHostEngineCheck: true,
                    launchConfiguration: args,
                };
                const evalStarted = yield (0, ExtensionCommands_1.EvalInHost)(evalArgs);
                if (evalStarted) {
                    ESOutputChannel_1.OutputChannel.log(`Debug Session launched with host application "${this.mAppSpecifier}" and engine "${this.mEngineName}".`);
                    const proc = ESEvalProcess_1.EvalProcess.GetActiveEvalForEngine(this.mAppSpecifier, this.mEngineName);
                    if (proc !== undefined) {
                        this.mEvalEndedCallback = (proc) => { this.onLaunchEvalEnded(proc); };
                        proc.registerForEndedEvent(this.mEvalEndedCallback);
                    }
                    else {
                        const warnMsg = "No Active EvalProcess found. This should never happen...";
                        ESOutputChannel_1.OutputChannel.log(warnMsg);
                        console.warn(warnMsg);
                    }
                }
                else {
                    ESOutputChannel_1.OutputChannel.log(`Debug Session failed to launch with host application "${this.mAppSpecifier}" and engine "${this.mEngineName}".`);
                    const termEvent = new DA.TerminatedEvent();
                    this.sendEvent(termEvent);
                }
                this.sendResponse(response);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to launch Debug Session with host application "${args.hostAppSpecifier}" and engine "${args.engineName}". Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(msg.format);
                this.sendErrorResponse(response, msg);
            }
        });
    }
    attachRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            this.mRequestType = "attach";
            {
                if (args.aliasPath !== undefined) {
                    this.mAliasMap = {
                        aliasRoot: args.aliasPath,
                        projectRoot: fs.realpathSync(args.aliasPath),
                    };
                }
                this.mEngineName = args.engineName;
                this.mAppSpecifier = args.hostAppSpecifier;
                if (Array.isArray(args.hiddenTypes) && args.hiddenTypes.length > 0) {
                    this.mHiddenTypes = args.hiddenTypes;
                }
            }
            {
                if (this.mConfigDonePromise !== undefined) {
                    yield this.mConfigDonePromise;
                }
                else {
                    const errMsg = `DAP Error: Launch Request received before Initialize Request!`;
                    ESOutputChannel_1.OutputChannel.log(errMsg);
                    throw new Error(errMsg);
                }
            }
            try {
                ESEvalProcess_1.EvalProcess.ClearActiveErrorHighlights();
                ESDAppSessionsManager_1.APP_SESSIONS.registerDebugSession(this);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to attach Debug Session with host application "${args.hostAppSpecifier}" and engine "${args.engineName}". Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(msg.format);
                this.sendErrorResponse(response, msg);
                return;
            }
            try {
                yield this.submitBreakpoints(false);
            }
            catch (err) {
                let errMsg = "Unknown error encountered while trying to initialize breakpoints.";
                if (err instanceof ESDCore.DebugMessageError) {
                    if (err instanceof ESDCore.DebugMessageErrorResponseError &&
                        err.debugMsg.body === "Cannot resolve reference") {
                        errMsg = `Failed to initialize breakpoints with host application "${this.mAppSpecifier}". The error indicates that the specified engine name "${this.mEngineName}" does not exist and could not be created.`;
                    }
                    else {
                        errMsg = `Unknown error encountered while trying to initialize breakpoints. Message received: "${err.debugMsg.body}".`;
                    }
                }
                ESOutputChannel_1.OutputChannel.log(errMsg);
                this.sendErrorResponse(response, {
                    id: -1,
                    showUser: true,
                    format: errMsg,
                });
                return;
            }
            try {
                const breakInfo = yield ESTKP.GetBreak(this.mAppSpecifier, this.mEngineName, this.mHiddenTypes, true);
                this.OnESTKBreak(breakInfo);
            }
            catch (err) {
            }
            ESOutputChannel_1.OutputChannel.log(`Debug Session attached with host application "${this.mAppSpecifier}" and engine "${this.mEngineName}".`);
            this.sendResponse(response);
        });
    }
    disconnectRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const proc = ESEvalProcess_1.EvalProcess.GetActiveEvalForEngine(this.mAppSpecifier, this.mEngineName);
                if (proc !== undefined && this.mEvalEndedCallback !== undefined) {
                    proc.unregisterForEndedEvent(this.mEvalEndedCallback);
                }
                if (this.mEngineRunning && ESDCore.IsApplicationRunning(this.mAppSpecifier)) {
                    const options = {
                        shutdown: true,
                    };
                    if (args.terminateDebuggee === true) {
                        if (proc !== undefined) {
                            proc.halt(options.shutdown);
                        }
                        else {
                            ESTKP.SendDebugCommand(this.mAppSpecifier, this.mEngineName, "halt", options);
                        }
                    }
                    else {
                        yield ESTKP.SetBreakpoints(this.mAppSpecifier, {
                            "@engine": this.mEngineName,
                            "@flags": 1024,
                            breakpoint: [],
                        });
                        ESTKP.SendDebugCommand(this.mAppSpecifier, this.mEngineName, "continue", options);
                    }
                }
                else {
                    if (proc !== undefined) {
                        proc.forceCancel(`The host application ${this.mAppSpecifier} and/or engine ${this.mEngineName} is no longer running.`);
                    }
                }
            }
            catch (err) {
                const errInfo = (err instanceof Error) ? err.message : `${err}`;
                const errMsg = `An error occurred while attempting to disconnect from host engine ${this.mAppSpecifier}(${this.mEngineName}).\nError information: ${errInfo}`;
                ESOutputChannel_1.OutputChannel.log(errMsg);
            }
            ESDAppSessionsManager_1.APP_SESSIONS.unregisterDebugSession(this);
            ESOutputChannel_1.OutputChannel.log(`Debug Session ended with host application "${this.mAppSpecifier}" and engine "${this.mEngineName}".`);
            this.sendResponse(response);
        });
    }
    setBreakPointsRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (args.breakpoints === undefined) {
                    args.breakpoints = [];
                }
                if (args.breakpoints.length === 0) {
                    this.mBreakpoints.delete(args.source.path);
                }
                else {
                    this.mBreakpoints.set(args.source.path, args.breakpoints);
                }
                if (this.getConfigurationComplete()) {
                    yield this.submitBreakpoints(true);
                }
                if (args.breakpoints.length > 0) {
                    const outBPs = args.breakpoints.map((inBP) => {
                        return new DA.Breakpoint(true, inBP.line);
                    });
                    response.body = {
                        breakpoints: outBPs,
                    };
                }
                this.sendResponse(response);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to update breakpoint state. Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(`[${this.mAppSpecifier}(${this.mEngineName})] ${msg.format}`);
                this.sendErrorResponse(response, msg);
            }
        });
    }
    setExceptionBreakPointsRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.mBreakOnCaughtExceptions = args.filters.includes(CAUGHT_EXCEPTION_FILTER);
                if (this.getConfigurationComplete()) {
                    yield this.submitBreakpoints(true);
                }
                this.sendResponse(response);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to update Exception Breakpoint state. Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(`[${this.mAppSpecifier}(${this.mEngineName})] ${msg.format}`);
                this.sendErrorResponse(response, msg);
            }
        });
    }
    submitBreakpoints(handleErrors) {
        return __awaiter(this, void 0, void 0, function* () {
            const breakSet = this.getActiveBreakpoints();
            if (handleErrors) {
                try {
                    yield ESTKP.SetBreakpoints(this.mAppSpecifier, breakSet);
                }
                catch (err) {
                    if (err instanceof ESDCore.DebugMessageError) {
                        const errMsg = `Error submitting breakpoint state to host application '${this.mAppSpecifier}' with engine '${this.mEngineName}'. Error: ${err.debugMsg.body}`;
                        ESOutputChannel_1.OutputChannel.log(errMsg);
                        console.error(errMsg);
                    }
                    else {
                        const errMsg = `Unknown error occurred while attempting to submit breakpoint state to host application '${this.mAppSpecifier}' with engine '${this.mEngineName}'. Error: ${err}`;
                        ESOutputChannel_1.OutputChannel.log(errMsg);
                        console.error(errMsg);
                    }
                }
            }
            else {
                yield ESTKP.SetBreakpoints(this.mAppSpecifier, breakSet);
            }
        });
    }
    getActiveBreakpoints() {
        const breakSet = {
            "@engine": this.mEngineName,
            "@flags": this.mBreakOnCaughtExceptions ? 0 : 1024,
        };
        breakSet.breakpoint = [];
        for (let [filePath, bps] of this.mBreakpoints) {
            filePath = this.convertToAliasPathIfNeeded(filePath);
            for (let inBP of bps) {
                const outBP = {
                    "@file": filePath,
                    "@line": this.convertClientLineToDebugger(inBP.line),
                    "@enabled": true,
                };
                if (inBP.condition) {
                    outBP["#value"] = inBP.condition;
                }
                if (inBP.hitCondition && Number.isInteger(parseInt(inBP.hitCondition))) {
                    outBP["@hits"] = parseInt(inBP.hitCondition);
                    outBP["@count"] = 0;
                }
                if (inBP.logMessage) {
                    const formatted = ESDDebugSession.FormatLogMessage(inBP.logMessage);
                    if (outBP["#value"] !== undefined) {
                        outBP["#value"] = `(${outBP["#value"]}) ? (${formatted} || true) : false`;
                    }
                    else if (outBP["@hits"] !== undefined) {
                        outBP["#value"] = `${formatted}; true;`;
                    }
                    else {
                        outBP["#value"] = formatted;
                    }
                }
                breakSet.breakpoint.push(outBP);
            }
        }
        ;
        return breakSet;
    }
    exceptionInfoRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.mErrorInfo !== null) {
                response.body = {
                    exceptionId: this.mErrorInfo["@id"].toString(),
                    description: this.mErrorInfo["#value"],
                    breakMode: "always",
                };
                this.sendResponse(response);
            }
            else {
                this.sendErrorResponse(response, 501, "Exception info requested but no error info available.");
            }
        });
    }
    evaluateRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (args.frameId !== undefined && args.frameId !== this.mActiveFrameID) {
                    yield ESTKP.GetOrSetFrame(this.mAppSpecifier, this.mEngineName, false, args.frameId);
                    this.mActiveFrameID = args.frameId;
                }
                const evalOpts = {
                    source: args.expression,
                    debug: 0,
                };
                const result = yield ESTKP.Eval(this.mAppSpecifier, this.mEngineName, evalOpts);
                if (result === undefined) {
                    response.success = false;
                    response.message = `Failed to evaluate expression (${args.expression})...`;
                }
                else if ("value" in result) {
                    response.success = true;
                    response.body = {
                        result: result.value["#value"],
                        variablesReference: 0,
                    };
                }
                else {
                    response.success = false;
                    response.message = result.error["#value"];
                }
                this.sendResponse(response);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to evaluate expression "${args.expression}". Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(`[${this.mAppSpecifier}(${this.mEngineName})] ${msg.format}`);
                this.sendErrorResponse(response, msg);
            }
        });
    }
    threadsRequest(response, request) {
        response.body = {
            threads: [
                new DA.Thread(ESDDebugSession.THREAD_ID, "Main Thread"),
            ],
        };
        this.sendResponse(response);
    }
    stackTraceRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            if (args.threadId !== ESDDebugSession.THREAD_ID) {
                this.sendErrorResponse(response, 501, "Unexpected thread reference {_thread}.", { _thread: args.threadId });
                return;
            }
            try {
                let maxIdx = this.mActiveFrameCount - 1;
                if (args.levels !== undefined && args.levels > 0) {
                    maxIdx = Math.min(args.levels, this.mActiveFrameCount) - 1;
                }
                let i = args.startFrame ? args.startFrame : 0;
                const stackFrames = [];
                for (; i <= maxIdx; ++i) {
                    const frame = yield ESTKP.GetOrSetFrame(this.mAppSpecifier, this.mEngineName, true, i);
                    if (frame['@type'] === "script") {
                        const source = {};
                        if (typeof frame['@file'] === "string" &&
                            fs.existsSync(frame["@file"])) {
                            source.path = this.convertFromAliasPathIfNeeded(frame['@file'].toString());
                        }
                        else if (typeof frame["@file"] === "string" &&
                            frame["@file"].startsWith("untitled:")) {
                            source.path = frame["@file"];
                        }
                        else {
                            source.sourceReference = this.mSourceRefs.create(frame.source);
                            const fileName = frame["@file"].toString();
                            source.name = fileName.length > 0 ? fileName : `stack-frame-${maxIdx - i}.jsx`;
                            source.presentationHint = "deemphasize";
                        }
                        const protocolFrame = {
                            id: i,
                            name: frame['@name'] === undefined ? "[Unknown Context]" : frame['@name'],
                            line: this.convertDebuggerLineToClient(frame['@line']),
                            column: 0,
                            source,
                        };
                        stackFrames.push(protocolFrame);
                    }
                    else {
                        stackFrames.push({
                            id: i,
                            name: "[Compiled]",
                            line: 0,
                            column: 0,
                            presentationHint: 'subtle',
                        });
                    }
                }
                response.body = {
                    stackFrames,
                    totalFrames: this.mActiveFrameCount,
                };
                this.sendResponse(response);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to process stack trace. Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(`[${this.mAppSpecifier}(${this.mEngineName})] ${msg.format}`);
                this.sendErrorResponse(response, msg);
            }
        });
    }
    sourceRequest(response, args, request) {
        if (args.source !== undefined && args.source.sourceReference !== undefined) {
            response.body = {
                content: this.mSourceRefs.get(args.source.sourceReference),
            };
        }
        else {
            this.sendErrorResponse(response, 502, "Unexpected source request {source}.", { source: args.source });
            return;
        }
        this.sendResponse(response);
    }
    scopesRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (args.frameId !== this.mActiveFrameID) {
                    yield ESTKP.GetOrSetFrame(this.mAppSpecifier, this.mEngineName, false, args.frameId);
                    this.mActiveFrameID = args.frameId;
                }
                response.body = {
                    scopes: [
                        new DA.Scope("Local", this.mVariableRefs.create(ESDDebugSession.LOCAL_SCOPE_REFERENCE), false),
                        new DA.Scope("Global", this.mVariableRefs.create(ESDDebugSession.GLOBAL_SCOPE_REFERENCE), false),
                    ],
                };
                this.sendResponse(response);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to retrieve information about the available scopes. Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(`[${this.mAppSpecifier}(${this.mEngineName})] ${msg.format}`);
                this.sendErrorResponse(response, msg);
            }
        });
    }
    getVariableDetails(name, value, type, varPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let val = (typeof value === "string") ? value.replace(/\r/g, "\\r").replace(/\n/g, "\\n") : `${value}`;
            val = (0, Utils_1.TrimMiddle)(val, Constants_1.MAX_VARIABLE_PREVIEW_LENGTH);
            const presentationHint = {};
            const variable = {
                name,
                value: val,
                type,
                evaluateName: varPath,
                variablesReference: 0,
                presentationHint,
            };
            switch (type) {
                case "undefined":
                case "null":
                case "boolean":
                case "number":
                case "string":
                case "error":
                    presentationHint.kind = "property";
                    break;
                case "Function":
                    presentationHint.kind = "method";
                    break;
                case "Array":
                    presentationHint.kind = "data";
                    variable.variablesReference = this.mVariableRefs.create(varPath);
                    let length = 0;
                    {
                        const evalOpts = {
                            source: `${varPath}.length`,
                        };
                        const result = yield ESTKP.Eval(this.mAppSpecifier, this.mEngineName, evalOpts);
                        if (result !== undefined && "value" in result) {
                            length = Number.parseInt(result.value["#value"]);
                        }
                    }
                    if (length > ESDDebugSession.VARIABLE_PAGE_SIZE) {
                        variable.indexedVariables = length;
                        variable.namedVariables = 1;
                    }
                    break;
                default:
                    presentationHint.kind = "class";
                    variable.variablesReference = this.mVariableRefs.create(varPath);
                    break;
            }
            return variable;
        });
    }
    variablesRequest(response, args, request) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scopeRef = this.getScopeFromVariablesReference(args.variablesReference);
                let properties = [];
                const options = {
                    object: scopeRef,
                    all: true,
                    exclude: this.mHiddenTypes,
                };
                if (args.filter === "indexed") {
                    const start = (_a = args.start) !== null && _a !== void 0 ? _a : 0;
                    let end;
                    if (args.count && args.count > 0) {
                        end = start + args.count;
                    }
                    else {
                        const evalOpts = {
                            source: `${scopeRef}.length`,
                        };
                        const result = yield ESTKP.Eval(this.mAppSpecifier, this.mEngineName, evalOpts);
                        if (result === undefined) {
                            response.success = false;
                            response.message = `Failed to evaluate expression (${evalOpts.source})...`;
                            this.sendResponse(response);
                            return;
                        }
                        else if ("value" in result) {
                            end = Number.parseInt(result.value["#value"]);
                        }
                        else {
                            response.success = false;
                            response.message = result.error["#value"];
                            this.sendResponse(response);
                            return;
                        }
                    }
                    options.max = end;
                    const result = (yield ESTKP.GetProperties(this.mAppSpecifier, this.mEngineName, options)).property;
                    if (result !== undefined) {
                        const props = Array.isArray(result) ? result : [result];
                        for (const prop of props) {
                            const nameAsNum = Number.parseInt(prop["@name"]);
                            if (!Number.isNaN(nameAsNum) &&
                                nameAsNum >= start && nameAsNum < end &&
                                prop["@name"].length === nameAsNum.toString().length) {
                                properties.push(prop);
                            }
                        }
                    }
                }
                else if (args.filter === "named") {
                    options.max = -1;
                    const result = (yield ESTKP.GetProperties(this.mAppSpecifier, this.mEngineName, options)).property;
                    if (result !== undefined) {
                        properties = Array.isArray(result) ? result : [result];
                    }
                }
                else {
                    options.max = ESDDebugSession.VARIABLE_PAGE_SIZE;
                    const result = (yield ESTKP.GetProperties(this.mAppSpecifier, this.mEngineName, options)).property;
                    if (result !== undefined) {
                        properties = Array.isArray(result) ? result : [result];
                    }
                }
                const vars = [];
                for (const prop of properties) {
                    const varPath = this.makeVarPathFromScopeAndVarName(scopeRef, prop["@name"]);
                    const variable = yield this.getVariableDetails(prop["@name"], prop["#value"], prop["@type"], varPath);
                    variable.presentationHint = (_b = variable.presentationHint) !== null && _b !== void 0 ? _b : {};
                    const attrs = [];
                    if (prop['@invalid'] === "true") {
                        attrs.push("hasSideEffects");
                    }
                    if (prop['@readonly'] === "true") {
                        attrs.push("readOnly");
                    }
                    variable.presentationHint.attributes = attrs;
                    vars.push(variable);
                }
                response.body = {
                    variables: vars.sort((a, b) => {
                        const aName = a.name;
                        const bName = b.name;
                        const aNum = Number(aName);
                        const bNum = Number(bName);
                        if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
                            return aNum - bNum;
                        }
                        return aName === bName ? 0 : aName < bName ? -1 : 1;
                    }),
                };
                this.sendResponse(response);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to retrieve variables. Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(`[${this.mAppSpecifier}(${this.mEngineName})] ${msg.format}`);
                this.sendErrorResponse(response, msg);
            }
        });
    }
    setVariableRequest(response, args, request) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scopeRef = this.getScopeFromVariablesReference(args.variablesReference);
                const varPath = this.makeVarPathFromScopeAndVarName(scopeRef, args.name);
                const source = `${varPath}=${args.value}`;
                console.log("Setting: " + source);
                const evalOpts = {
                    source: source,
                    object: varPath,
                    all: false,
                };
                const result = yield ESTKP.Eval(this.mAppSpecifier, this.mEngineName, evalOpts);
                if (result === undefined) {
                    response.success = false;
                    response.message = `Failed to evaluate expression (${source})...`;
                }
                else if ("value" in result) {
                    const variable = yield this.getVariableDetails(args.name, result.value["#value"], result.value["@type"], varPath);
                    response.success = true;
                    response.body = {
                        value: variable.value,
                        type: variable.type,
                        variablesReference: variable.variablesReference,
                        indexedVariables: variable.indexedVariables,
                        namedVariables: variable.namedVariables,
                    };
                }
                else {
                    response.success = false;
                    response.message = result.error["#value"];
                }
                this.sendResponse(response);
            }
            catch (err) {
                response.success = false;
                const details = err instanceof Error ? err.message : JSON.stringify(err, Object.getOwnPropertyNames(err));
                const msg = {
                    format: `Failed to set variables. Details: ${details}`,
                    id: -1,
                };
                ESOutputChannel_1.OutputChannel.log(`[${this.mAppSpecifier}(${this.mEngineName})] ${msg.format}`);
                this.sendErrorResponse(response, msg);
            }
        });
    }
    pauseRequest(response, args, request) {
        ESTKP.SendDebugCommand(this.mAppSpecifier, this.mEngineName, "break");
        this.sendResponse(response);
    }
    continueRequest(response, args, request) {
        const options = {
            breakpoints: this.getActiveBreakpoints(),
        };
        ESTKP.SendDebugCommand(this.mAppSpecifier, this.mEngineName, "continue", options);
        this.resetBreakResources();
        this.sendResponse(response);
    }
    nextRequest(response, args, request) {
        const options = {
            breakpoints: this.getActiveBreakpoints(),
        };
        ESTKP.SendDebugCommand(this.mAppSpecifier, this.mEngineName, "stepover", options);
        this.resetBreakResources();
        this.sendResponse(response);
    }
    stepInRequest(response, args, request) {
        const options = {
            breakpoints: this.getActiveBreakpoints(),
        };
        ESTKP.SendDebugCommand(this.mAppSpecifier, this.mEngineName, "stepinto", options);
        this.resetBreakResources();
        this.sendResponse(response);
    }
    stepOutRequest(response, args, request) {
        const options = {
            breakpoints: this.getActiveBreakpoints(),
        };
        ESTKP.SendDebugCommand(this.mAppSpecifier, this.mEngineName, "stepout", options);
        this.resetBreakResources();
        this.sendResponse(response);
    }
    OnESTKLaunchConnectRequest(request) {
    }
    OnESTKBreakConnectRequest(request) {
    }
    OnESTKBreak(request) {
        if (request.stack.frameinfo !== undefined) {
            this.mActiveFrameCount = Array.isArray(request.stack.frameinfo) ? request.stack.frameinfo.length : 1;
        }
        let stoppedEvent;
        if (request.error !== undefined) {
            stoppedEvent = new DA.StoppedEvent("exception", ESDDebugSession.THREAD_ID, request.error['#value']);
            stoppedEvent.body.description = localize(0, null);
            stoppedEvent.body.text = request.error["#value"];
            this.mErrorInfo = request.error;
        }
        else {
            stoppedEvent = new DA.StoppedEvent("breakpoint", ESDDebugSession.THREAD_ID);
            stoppedEvent.body.description = localize(1, null);
        }
        this.sendEvent(stoppedEvent);
    }
    OnESTKExit(request) {
    }
    OnESTKEngineName(request) {
    }
    OnESTKPrint(request) {
        console.log(request["#value"]);
        const outputEvent = new DA.OutputEvent(request["#value"], "console");
        this.sendEvent(outputEvent);
    }
    convertToAliasPathIfNeeded(filePath) {
        if (this.mAliasMap !== undefined) {
            const relative = path.relative(this.mAliasMap.projectRoot, filePath);
            if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
                return this.mAliasMap.aliasRoot + path.sep + relative;
            }
        }
        return filePath;
    }
    convertFromAliasPathIfNeeded(aliasPath) {
        if (this.mAliasMap !== undefined) {
            const relative = path.relative(this.mAliasMap.aliasRoot, aliasPath);
            if (relative && !relative.startsWith("..") && !path.isAbsolute(relative)) {
                return this.mAliasMap.projectRoot + path.sep + relative;
            }
        }
        return aliasPath;
    }
    resetBreakResources() {
        this.mVariableRefs.reset();
        this.mSourceRefs.reset();
        this.mActiveFrameCount = -1;
        this.mActiveFrameID = -1;
        this.mErrorInfo = null;
    }
    static FormatLogMessage(raw) {
        const formatted = raw.replace(/"/g, '\\"').replace(/{/g, '" + (').replace(/}/g, ') + "');
        return `$.writeln("${formatted}")`;
    }
    getScopeFromVariablesReference(varRef) {
        return this.mVariableRefs.get(varRef, ESDDebugSession.LOCAL_SCOPE_REFERENCE);
    }
    makeVarPathFromScopeAndVarName(scope, name) {
        return (scope === ESDDebugSession.LOCAL_SCOPE_REFERENCE) ? name : `${scope}['${name}']`;
    }
}
exports.ESDDebugSession = ESDDebugSession;
ESDDebugSession.THREAD_ID = 1;
ESDDebugSession.GLOBAL_SCOPE_REFERENCE = "$.global";
ESDDebugSession.LOCAL_SCOPE_REFERENCE = "";
ESDDebugSession.VARIABLE_PAGE_SIZE = 100;

//# sourceMappingURL=ESDDebugSession.js.map
