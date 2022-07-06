"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDebugRequest = exports.DebugMessageTimeoutResponseError = exports.DebugMessageErrorResponseError = exports.DebugMessageError = exports.IsUnhandledMessageHandlerRegistered = exports.UnregisterUnhandledMessageHandler = exports.RegisterUnhandledMessageHandler = exports.IsConnectionHandlerRegistered = exports.UnregisterConnectionHandler = exports.RegisterConnectionHandler = exports.ConvertUriToPath_Safe = exports.ConvertUriToPath = exports.ConvertPathToUri_Safe = exports.ConvertPathToUri = exports.SendDebugMessage = exports.GetScriptDirectives = exports.CheckSyntax = exports.CompileToJSXBin = exports.BringApplicationToFront = exports.IsApplicationRunning = exports.IsApplicationInstalled = exports.GetInstalledApplications = exports.GetDisplayNameForApplication = exports.ResolveApplicationSpecifier = void 0;
const timers_1 = require("timers");
const process = require("process");
const FastXML = require("fast-xml-parser");
const EXTENSION_SPEC_NAME = "vscesd";
function GetCoreLib() {
    const thisFunc = GetCoreLib;
    if (thisFunc.CORE_LIB === undefined) {
        const platform = process.platform;
        let core = undefined;
        if (platform === "darwin") {
            core = require("../../lib/esdebugger-core/mac/esdcorelibinterface.node");
        }
        else if (platform === "win32") {
            const arch = process.arch;
            if (arch === "x64" || arch === "arm64") {
                core = require("../../lib/esdebugger-core/win/x64/esdcorelibinterface.node");
            }
            else {
                core = require("../../lib/esdebugger-core/win/win32/esdcorelibinterface.node");
            }
        }
        if (core === undefined) {
            throw new Error("Could not initialize Core Library! Is this running on a supported platform?");
        }
        thisFunc.CORE_LIB = core;
    }
    return thisFunc.CORE_LIB;
}
function InitializeCore() {
    const result = GetCoreLib().esdInitialize(EXTENSION_SPEC_NAME, process.pid);
    if (result.status !== 0 &&
        result.status !== 11) {
        throw new Error(`Failed to initialize core library. Code: ${result.status}.`);
    }
    return result.status;
}
function CleanupCore() {
    const result = GetCoreLib().esdCleanup();
    if (result.status === 4) {
        throw new Error(`Failed to cleanup core library. Code: ${result.status}.`);
    }
}
function RunCoreProcess(proc) {
    let bDidInitialize = false;
    if (InitializeCore() === 0) {
        bDidInitialize = true;
    }
    let bDidThrow = false;
    let thrownProcError;
    try {
        proc();
    }
    catch (err) {
        console.error(`RunCoreProcess encountered error: ${JSON.stringify(err)}`);
        bDidThrow = true;
        thrownProcError = err;
    }
    if (bDidInitialize) {
        CleanupCore();
    }
    if (bDidThrow) {
        throw thrownProcError;
    }
}
function ResolveApplicationSpecifier(partialSpec) {
    let resolvedSpec = "";
    RunCoreProcess(() => {
        const result = GetCoreLib().esdResolveApplicationSpecifier(partialSpec);
        if (result.status === 0) {
            resolvedSpec = result.specifier;
        }
        else {
            throw new Error(`Failed to resolve application specifier ${partialSpec}. Code: ${result.status}.`);
        }
    });
    return resolvedSpec;
}
exports.ResolveApplicationSpecifier = ResolveApplicationSpecifier;
function GetDisplayNameForApplication(hostAppSpecifier) {
    let name = "";
    RunCoreProcess(() => {
        const result = GetCoreLib().esdGetDisplayNameForApplication(hostAppSpecifier);
        if (result.status === 0) {
            name = result.name;
        }
        else {
            throw new Error(`Failed to get display name for ${hostAppSpecifier}. Code: ${result.status}.`);
        }
    });
    return name;
}
exports.GetDisplayNameForApplication = GetDisplayNameForApplication;
function GetInstalledApplications() {
    const appDefs = [];
    RunCoreProcess(() => {
        let specs;
        const result = GetCoreLib().esdGetInstalledApplicationSpecifiers();
        if (result.status === 0) {
            specs = result.specifiers;
        }
        else {
            throw new Error(`Failed to get installed application specifiers. Code: ${result.status}.`);
        }
        for (const spec of specs) {
            const result = GetCoreLib().esdGetDisplayNameForApplication(spec);
            if (result.status === 0) {
                appDefs.push({
                    specifier: spec,
                    name: result.name,
                });
            }
            else {
                throw new Error(`Failed to get display name for ${spec}. Code: ${result.status}.`);
            }
        }
    });
    return appDefs;
}
exports.GetInstalledApplications = GetInstalledApplications;
function IsApplicationInstalled(appSpecifier) {
    let isInstalled = false;
    RunCoreProcess(() => {
        const result = GetCoreLib().esdGetApplicationInstalled(appSpecifier);
        if (result.status === 0) {
            isInstalled = result.isInstalled;
        }
        else {
            throw new Error(`Failed to get application installation status for ${appSpecifier}. Code: ${result.status}.`);
        }
    });
    return isInstalled;
}
exports.IsApplicationInstalled = IsApplicationInstalled;
function IsApplicationRunning(appSpecifier) {
    let isRunning = false;
    RunCoreProcess(() => {
        const result = GetCoreLib().esdGetApplicationRunning(appSpecifier);
        if (result.status === 0) {
            isRunning = result.isRunning;
        }
        else {
            throw new Error(`Failed to get application running status for ${appSpecifier}. Code: ${result.status}.`);
        }
    });
    return isRunning;
}
exports.IsApplicationRunning = IsApplicationRunning;
function BringApplicationToFront(appSpecifier) {
    RunCoreProcess(() => {
        const result = GetCoreLib().esdBringApplicationToFront(appSpecifier);
        if (result.status !== 0) {
            throw new Error(`Failed to issue request to bring application to front for ${appSpecifier}. Code: ${result.status}.`);
        }
    });
}
exports.BringApplicationToFront = BringApplicationToFront;
function CompileToJSXBin(source, filePath, includePath) {
    let output = { error: "Something went wrong! This should never be seen." };
    RunCoreProcess(() => {
        const result = GetCoreLib().esdCompileToJSXBin(source, filePath || "", includePath || "");
        if (result.status === 0) {
            output = { output: result.output };
        }
        else if (result.status === 16) {
            output = { error: result.error };
        }
        else {
            throw new Error(`Failed to compile source to JSXBin format. Code: ${result.status}.`);
        }
    });
    return output;
}
exports.CompileToJSXBin = CompileToJSXBin;
function CheckSyntax(source, scriptPath, includePath) {
    let errOrNull = null;
    RunCoreProcess(() => {
        const result = GetCoreLib().esdCheckSyntax(source, scriptPath, includePath || "");
        if (result.status === 0) {
            if (result.result.length > 0) {
                const errObj = FastXML.parse(result.result);
                errOrNull = errObj.errorInfo;
            }
        }
        else {
            throw new Error(`Failed to check syntax of specified script. Code: ${result.status}.`);
        }
    });
    return errOrNull;
}
exports.CheckSyntax = CheckSyntax;
function GetScriptDirectives(source, filePath) {
    let directives = {};
    RunCoreProcess(() => {
        const result = GetCoreLib().esdGetScriptDirectives(source, filePath);
        if (result.status === 0) {
            directives = result.directives;
        }
        else {
            throw new Error(`Failed to retrieve script directives. Code: ${result.status}.`);
        }
    });
    return directives;
}
exports.GetScriptDirectives = GetScriptDirectives;
function SendDebugMessage(appSpecifier, body, timeout) {
    const result = GetCoreLib().esdSendDebugMessage(appSpecifier, body, false, timeout === undefined ? 0 : timeout);
    if (result.status === 0) {
        return result.serialNumber;
    }
    else if (result.status === -1) {
        return false;
    }
    else {
        throw new Error(`Encountered an error while trying to send message to ${appSpecifier}. Code: ${result.status}.`);
    }
}
exports.SendDebugMessage = SendDebugMessage;
function PumpDebugSession(handler) {
    const result = GetCoreLib().esdPumpSession(handler);
    if (result.status !== 0) {
        throw new Error(`Failed to pump the debug session for messages. Code: ${result.status}.`);
    }
}
function ConvertPathToUri(path) {
    const result = GetCoreLib().esdPathToUri(path);
    if (result.status !== 0) {
        throw new Error(`Failed to convert the path "${path}" to a URI. Code: ${result.status}.`);
    }
    return result.uri;
}
exports.ConvertPathToUri = ConvertPathToUri;
function ConvertPathToUri_Safe(path) {
    let uri = path;
    RunCoreProcess(() => {
        uri = ConvertPathToUri(path);
    });
    return uri;
}
exports.ConvertPathToUri_Safe = ConvertPathToUri_Safe;
function ConvertUriToPath(uri) {
    const result = GetCoreLib().esdUriToPath(uri);
    if (result.status !== 0) {
        throw new Error(`Failed to convert the uri "${uri}" to a path. Code: ${result.status}.`);
    }
    return result.path;
}
exports.ConvertUriToPath = ConvertUriToPath;
function ConvertUriToPath_Safe(uri) {
    let path = uri;
    RunCoreProcess(() => {
        path = ConvertUriToPath(uri);
    });
    return path;
}
exports.ConvertUriToPath_Safe = ConvertUriToPath_Safe;
const ACTIVE_CONNECTION_HANDLERS = new Set();
const PUMP_TIMEOUT_IN_MS = 50;
let timeoutHandle = null;
const UNHANDLED_MESSAGE_HANDLERS = new Set();
function RegisterConnectionHandler(handler) {
    if (ACTIVE_CONNECTION_HANDLERS.size === 0) {
        InitializeCore();
        timeoutHandle = (0, timers_1.setInterval)(PumpDebugSession, PUMP_TIMEOUT_IN_MS, OnUnfilteredMessageReceived);
        timeoutHandle.unref();
    }
    ACTIVE_CONNECTION_HANDLERS.add(handler);
}
exports.RegisterConnectionHandler = RegisterConnectionHandler;
function UnregisterConnectionHandler(handler) {
    ACTIVE_CONNECTION_HANDLERS.delete(handler);
    if (ACTIVE_CONNECTION_HANDLERS.size === 0) {
        (0, timers_1.clearInterval)(timeoutHandle);
        timeoutHandle = null;
        CleanupCore();
    }
}
exports.UnregisterConnectionHandler = UnregisterConnectionHandler;
function IsConnectionHandlerRegistered(handler) {
    return ACTIVE_CONNECTION_HANDLERS.has(handler);
}
exports.IsConnectionHandlerRegistered = IsConnectionHandlerRegistered;
function RegisterUnhandledMessageHandler(handler) {
    UNHANDLED_MESSAGE_HANDLERS.add(handler);
}
exports.RegisterUnhandledMessageHandler = RegisterUnhandledMessageHandler;
function UnregisterUnhandledMessageHandler(handler) {
    UNHANDLED_MESSAGE_HANDLERS.delete(handler);
}
exports.UnregisterUnhandledMessageHandler = UnregisterUnhandledMessageHandler;
function IsUnhandledMessageHandlerRegistered(handler) {
    return UNHANDLED_MESSAGE_HANDLERS.has(handler);
}
exports.IsUnhandledMessageHandlerRegistered = IsUnhandledMessageHandlerRegistered;
function OnUnfilteredMessageReceived(reason, message) {
    try {
        if ((message.resultSerial !== undefined ||
            message.errorSerial !== undefined ||
            message.receivedSerial !== undefined ||
            reason === 5)
            && ACTIVE_REQUESTS.has(message.serialNumber)) {
            const { resolve, reject } = ACTIVE_REQUESTS.get(message.serialNumber);
            if (reason === 3) {
                resolve({ reason, message });
            }
            else if (reason === 4) {
                reject(new DebugMessageErrorResponseError(reason, message, `Error processing request: ${message.body}`));
            }
            else if (reason === 5) {
                reject(new DebugMessageTimeoutResponseError(reason, message, `Message timed out.`));
            }
            else {
                reject(new DebugMessageError(reason, message, `Unexpected response received.\nReason: ${reason}\nBody: ${message.body}`));
            }
            return;
        }
        for (const handler of ACTIVE_CONNECTION_HANDLERS.values()) {
            if (handler.handleDebugProtocolMessage(reason, message)) {
                return;
            }
        }
        let bHandled = false;
        for (const handler of UNHANDLED_MESSAGE_HANDLERS.values()) {
            if (handler(reason, message)) {
                bHandled = true;
            }
        }
        if (!bHandled) {
            console.warn(`Unhandled message received. Message was sent by '${message.sender}' with contents '${message.body}'.`);
            console.dir(message);
        }
    }
    catch (err) {
        console.error(`Unhandled error encountered while processing message.\nError: ${err}\nReason: ${reason}\nMessage: ${JSON.stringify(message)}`);
    }
}
class DebugMessageError extends Error {
    constructor(reason, debugMsg, message) {
        super(message !== undefined ? message : debugMsg.body);
        this.reason = reason;
        this.debugMsg = debugMsg;
    }
}
exports.DebugMessageError = DebugMessageError;
class DebugMessageErrorResponseError extends DebugMessageError {
}
exports.DebugMessageErrorResponseError = DebugMessageErrorResponseError;
class DebugMessageTimeoutResponseError extends DebugMessageError {
}
exports.DebugMessageTimeoutResponseError = DebugMessageTimeoutResponseError;
const ACTIVE_REQUESTS = new Map();
function sendDebugRequest(appSpecifier, body, timeout, options) {
    let outerResolve;
    let outerReject;
    const requestPromise = new Promise((resolve, reject) => {
        outerResolve = resolve;
        outerReject = reject;
    });
    const serialNumber = SendDebugMessage(appSpecifier, body, timeout);
    if (serialNumber === false) {
        throw new Error(`Unable to send debug request to host ${appSpecifier}. Message content: "${body}".`);
    }
    else {
        const resolve = (value) => {
            ACTIVE_REQUESTS.delete(serialNumber);
            outerResolve(value);
        };
        const reject = (reason) => {
            ACTIVE_REQUESTS.delete(serialNumber);
            outerReject(reason);
        };
        ACTIVE_REQUESTS.set(serialNumber, {
            resolve,
            reject,
        });
        if (options !== undefined) {
            options.outCancelFunc = reject;
        }
    }
    return requestPromise;
}
exports.sendDebugRequest = sendDebugRequest;

//# sourceMappingURL=ESDCore.js.map
