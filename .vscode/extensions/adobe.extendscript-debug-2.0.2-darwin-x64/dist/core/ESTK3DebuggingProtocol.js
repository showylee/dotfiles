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
exports.Eval = exports.SendDebugCommand = exports.GetProperties = exports.GetOrSetFrame = exports.GetBreak = exports.GetBreakpoints = exports.SetBreakpoints = exports.Connect = exports.DeliverDirectMessage = exports.DebugCommand = exports.CONNECT_COMMAND = void 0;
const fs = require("fs");
const fastXMLParser = require("fast-xml-parser");
const ESDCore_1 = require("./ESDCore");
const ATTR_PREFIX = "@";
const TEXT_NODE_NAME = "#value";
const XML_OPTIONS = {
    attributeNamePrefix: ATTR_PREFIX,
    ignoreAttributes: false,
    parseAttributeValue: true,
    textNodeName: TEXT_NODE_NAME,
};
const XML_OPTIONS_NO_PARSE = {
    attributeNamePrefix: ATTR_PREFIX,
    ignoreAttributes: false,
    parseAttributeValue: false,
    parseNodeValue: false,
    textNodeName: TEXT_NODE_NAME,
};
exports.CONNECT_COMMAND = "<connect/>";
function MakeGetSetFrameCommand(frameCommand, engine, frame, exclude, all) {
    let command = `<${frameCommand}`;
    if (typeof engine === "string") {
        command += ` engine="${engine}"`;
    }
    if (typeof frame === "number") {
        command += ` frame="${frame}"`;
    }
    if (typeof exclude === "string") {
        command += ` exclude="${exclude}"`;
    }
    if (typeof all === "boolean") {
        command += ` all="${all}"`;
    }
    return command + `/>`;
}
function MakeGetPropertiesCommand(engine, options) {
    let command = `<get-properties engine="${engine}"`;
    if (options !== undefined) {
        if (typeof options.object === "string") {
            command += ` object="${options.object}"`;
        }
        if (Array.isArray(options.exclude)) {
            command += ` exclude="${options.exclude.join(",")}"`;
        }
        if (typeof options.all === "boolean") {
            command += ` all="${options.all}"`;
        }
        if (typeof options.max === 'number') {
            command += ` max="${options.max}"`;
        }
    }
    return command + `/>`;
}
function MakeEvalCommand(engine, options) {
    let command = `<eval engine="${engine}"`;
    if (typeof options.file === "string") {
        const isFilePath = IsDiskFileOrFolder(options.file);
        command += ` file="${isFilePath ? (0, ESDCore_1.ConvertPathToUri)(options.file) : options.file}"`;
    }
    if (typeof options.timeout === "number") {
        command += ` timeout="${options.timeout}"`;
    }
    if (typeof options.debug === "number") {
        command += ` debug="${options.debug}"`;
    }
    if (typeof options.flags === "number") {
        command += ` flags="${options.flags}"`;
    }
    if (typeof options.profiling === "number") {
        command += ` profiling="${options.profiling}"`;
    }
    if (typeof options.reset === "boolean") {
        command += ` reset="${options.reset}"`;
    }
    if (typeof options.object === "string") {
        command += ` object="${options.object}"`;
    }
    if (typeof options.exclude === "string") {
        command += ` exclude="${options.exclude}"`;
    }
    if (typeof options.all === "boolean") {
        command += ` all="${options.all}"`;
    }
    if (typeof options.max === "number") {
        command += ` max="${options.max}"`;
    }
    command += `>`;
    if (typeof options.source === "string") {
        command += `<source>${WrapWithCDATA(options.source)}</source>`;
    }
    if (typeof options.breakpoints === "object") {
        command += MakeBreakpointsCommand(options.breakpoints);
    }
    return command + `</eval>`;
}
function MakeBreakpointsCommand(breakpoints) {
    let command = `<breakpoints engine="${breakpoints['@engine']}" flags="${breakpoints['@flags']}">`;
    let breaks = [];
    if (Array.isArray(breakpoints.breakpoint)) {
        breaks = breakpoints.breakpoint;
    }
    else if (typeof breakpoints.breakpoint === 'object') {
        breaks.push(breakpoints.breakpoint);
    }
    for (const breakpoint of breaks) {
        const isFilePath = IsDiskFileOrFolder(breakpoint['@file']);
        command += `<breakpoint file="${isFilePath ? (0, ESDCore_1.ConvertPathToUri)(breakpoint['@file'].toString()) : breakpoint['@file']}" line="${breakpoint['@line']}"`;
        if (typeof breakpoint['@enabled'] === 'boolean') {
            command += ` enabled="${breakpoint['@enabled']}"`;
        }
        if (typeof breakpoint['@hits'] === 'number') {
            command += ` hits="${breakpoint['@hits']}"`;
        }
        if (typeof breakpoint['@count'] === 'number') {
            command += ` count="${breakpoint['@count']}"`;
        }
        if (typeof breakpoint['#value'] === 'string') {
            command += `>${WrapWithCDATA(breakpoint['#value'])}</breakpoint>`;
        }
        else {
            command += `/>`;
        }
    }
    return command + `</breakpoints>`;
}
function MakeGetBreakCommand(engine, exclude, all, max) {
    let command = `<get-break engine="${engine}"`;
    if (Array.isArray(exclude)) {
        command += ` exclude="${exclude.join(",")}"`;
    }
    if (typeof all === "boolean") {
        command += ` all="${all}"`;
    }
    if (typeof max === "number") {
        command += ` max="${max}"`;
    }
    return command += `/>`;
}
function MakeGetBreakpointsCommand(engine) {
    return `<get-breakpoints engine="${engine}"/>`;
}
var DebugCommand;
(function (DebugCommand) {
    DebugCommand["Continue"] = "continue";
    DebugCommand["Break"] = "break";
    DebugCommand["Halt"] = "halt";
    DebugCommand["Stepover"] = "stepover";
    DebugCommand["Stepinto"] = "stepinto";
    DebugCommand["Stepout"] = "stepout";
})(DebugCommand = exports.DebugCommand || (exports.DebugCommand = {}));
function MakeDebugCommand(debugCommand, engine, options) {
    let command = `<${debugCommand} engine="${engine}"`;
    if (options !== undefined) {
        if (typeof options.profiling === "number") {
            command += ` profiling="${options.profiling}"`;
        }
        if (typeof options.flags === "number") {
            command += ` flags="${options.flags}"`;
        }
        if (typeof options.ignoreErrors === "boolean") {
            command += ` ignore-errors="${options.ignoreErrors}"`;
        }
        if (typeof options.shutdown === "boolean") {
            command += ` shutdown="${options.shutdown}"`;
        }
        command += `>`;
        if (typeof options.breakpoints === "object") {
            command += MakeBreakpointsCommand(options.breakpoints);
        }
    }
    else {
        command += `>`;
    }
    return command + `</${debugCommand}>`;
}
function BodyIsConnectRequestMessage(body) {
    return 'connect-request' in body;
}
function BodyIsBreakMessage(body) {
    return 'break' in body;
}
function BodyIsExitMessage(body) {
    return 'exit' in body;
}
function BodyIsEngineNameMessage(body) {
    return 'engine-name' in body;
}
function BodyIsPrintMessage(body) {
    return 'print' in body;
}
function DeliverDirectMessage(handler, rawXML) {
    let parsed;
    try {
        parsed = fastXMLParser.parse(rawXML, XML_OPTIONS);
    }
    catch (err) {
        throw new Error(`Failed to parse message from host. Raw XML was: "${rawXML}".\nParsing error: ${err}`);
    }
    if (typeof parsed === 'object' && parsed !== null) {
        if (BodyIsConnectRequestMessage(parsed)) {
            const request = parsed['connect-request'];
            request['@reason'] === 'launch' ? handler.OnESTKLaunchConnectRequest(request) : handler.OnESTKBreakConnectRequest(request);
        }
        else if (BodyIsPrintMessage(parsed)) {
            handler.OnESTKPrint(parsed.print);
        }
        else if (BodyIsBreakMessage(parsed)) {
            handler.OnESTKBreak(parsed.break);
        }
        else if (BodyIsExitMessage(parsed)) {
            handler.OnESTKExit(parsed.exit);
        }
        else if (BodyIsEngineNameMessage(parsed)) {
            handler.OnESTKEngineName(parsed['engine-name']);
        }
        else {
            throw new Error(`Unknown message type. Parsed contents:\n${JSON.stringify(parsed)}`);
        }
    }
    else {
        throw new Error(`Unknown message type. Parsed contents:\n${JSON.stringify(parsed)}`);
    }
}
exports.DeliverDirectMessage = DeliverDirectMessage;
function Connect(appSpecifier, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const { message } = yield (0, ESDCore_1.sendDebugRequest)(appSpecifier, exports.CONNECT_COMMAND, timeout);
        const engines = fastXMLParser.parse(message.body, XML_OPTIONS);
        return engines;
    });
}
exports.Connect = Connect;
function SetBreakpoints(appSpecifier, breakpoints, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = MakeBreakpointsCommand(breakpoints);
        yield (0, ESDCore_1.sendDebugRequest)(appSpecifier, command, timeout);
    });
}
exports.SetBreakpoints = SetBreakpoints;
function GetBreakpoints(appSpecifier, engine, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = MakeGetBreakpointsCommand(engine);
        const { message } = yield (0, ESDCore_1.sendDebugRequest)(appSpecifier, command, timeout);
        const breakpoints = fastXMLParser.parse(message.body, XML_OPTIONS);
        let bps = breakpoints.breakpoints.breakpoint;
        if (bps !== undefined) {
            bps = Array.isArray(bps) ? bps : [bps];
            for (let bp of bps) {
                if (IsDiskFileOrFolder(bp['@file'])) {
                    bp['@file'] = (0, ESDCore_1.ConvertUriToPath)(bp['@file'].toString());
                }
            }
        }
        return breakpoints;
    });
}
exports.GetBreakpoints = GetBreakpoints;
function GetBreak(appSpecifier, engine, exclude, all, max, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = MakeGetBreakCommand(engine, exclude, all, max);
        const { message } = yield (0, ESDCore_1.sendDebugRequest)(appSpecifier, command, timeout);
        return fastXMLParser.parse(message.body, XML_OPTIONS).break;
    });
}
exports.GetBreak = GetBreak;
function GetOrSetFrame(appSpecifier, engine, isGet, frame, exclude, all, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = MakeGetSetFrameCommand(isGet ? "get-frame" : "set-frame", engine, frame, exclude, all);
        const { message } = yield (0, ESDCore_1.sendDebugRequest)(appSpecifier, command, timeout);
        const frameContent = fastXMLParser.parse(message.body, XML_OPTIONS).frame;
        if (frameContent['@type'] === "script") {
            if (IsDiskFileOrFolder(frameContent['@file'])) {
                frameContent['@file'] = (0, ESDCore_1.ConvertUriToPath)(frameContent['@file'].toString());
            }
        }
        return frameContent;
    });
}
exports.GetOrSetFrame = GetOrSetFrame;
function GetProperties(appSpecifier, engine, options, timeout) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = MakeGetPropertiesCommand(engine, options);
        const { message } = yield (0, ESDCore_1.sendDebugRequest)(appSpecifier, command, timeout);
        return fastXMLParser.parse(message.body, XML_OPTIONS_NO_PARSE).properties;
    });
}
exports.GetProperties = GetProperties;
function SendDebugCommand(appSpecifier, engine, debugCommand, options, timeout) {
    const command = MakeDebugCommand(debugCommand, engine, options);
    (0, ESDCore_1.sendDebugRequest)(appSpecifier, command, timeout);
}
exports.SendDebugCommand = SendDebugCommand;
function Eval(appSpecifier, engine, options, timeout, requestOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        const command = MakeEvalCommand(engine, options);
        const { message } = yield (0, ESDCore_1.sendDebugRequest)(appSpecifier, command, timeout, requestOpts);
        if (message.body === "") {
            return undefined;
        }
        const resultRoot = fastXMLParser.parse(message.body, XML_OPTIONS);
        const evalResult = resultRoot.evalresult;
        if ("error" in evalResult) {
            if (IsDiskFileOrFolder(evalResult.error["@file"])) {
                evalResult.error["@file"] = (0, ESDCore_1.ConvertUriToPath)(evalResult.error["@file"].toString());
            }
        }
        return resultRoot.evalresult;
    });
}
exports.Eval = Eval;
function IsDiskFileOrFolder(fileID) {
    if (typeof fileID !== "string") {
        return false;
    }
    const filePath = (0, ESDCore_1.ConvertUriToPath)(fileID.toString());
    return fs.existsSync(filePath);
}
function WrapWithCDATA(content) {
    const CDATA_START = "<![CDATA[";
    const CDATA_END = "]]>";
    const adjusted = content.replace(/]]>/g, `]]${CDATA_END}${CDATA_START}>`);
    return CDATA_START + adjusted + CDATA_END;
}

//# sourceMappingURL=ESTK3DebuggingProtocol.js.map
