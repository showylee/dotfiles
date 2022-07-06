"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisposeControls = exports.InitializeControls = void 0;
const vscode = require("vscode");
const ESDCore = require("../core/ESDCore");
const CommandConstants = require("../utils/Constants");
const ESEvalProcess_1 = require("./ESEvalProcess");
let EvalControl;
let HaltControl;
function OnActiveDebugSessionChangeForEval(session) {
    var _a;
    if (EvalControl === undefined) {
        console.warn("Missing EvalControl. What?");
        return;
    }
    let title = `$(run) Eval in Adobe...`;
    let tooltip = new vscode.MarkdownString(`Evaluate the active file in a host application...`);
    let command = {
        command: CommandConstants.EVAL_IN_HOST_CMD,
        title,
    };
    if ((session === null || session === void 0 ? void 0 : session.type) === CommandConstants.DEBUG_TYPE_IDENTIFIER &&
        session.configuration.request === "attach") {
        const args = session.configuration;
        title = `$(run) Eval in ${ESDCore.GetDisplayNameForApplication((_a = args.registeredSpecifier) !== null && _a !== void 0 ? _a : args.hostAppSpecifier)} (${args.engineName})...`;
        tooltip = new vscode.MarkdownString(`Evaluate the active file in **${args.hostAppSpecifier}** (_${args.engineName}_)`);
        command.arguments = [
            {
                hostAppSpecifier: args.hostAppSpecifier,
                engineName: args.engineName,
                registeredSpecifier: args.registeredSpecifier,
            },
        ];
        command.title = title;
    }
    EvalControl.text = title;
    EvalControl.tooltip = tooltip;
    EvalControl.command = command;
}
function OnActiveTextEditorChangeForEval(editor) {
    if (EvalControl === undefined) {
        console.warn("Missing EvalControl. What?");
        return;
    }
    if (editor === undefined) {
        EvalControl.hide();
    }
    else {
        if (CommandConstants.ES_LANGUAGE_IDS.indexOf(editor.document.languageId) > -1 ||
            editor.document.fileName.endsWith(".jsxbin")) {
            EvalControl.show();
        }
        else {
            EvalControl.hide();
        }
    }
}
function OnActiveEvalProcessesChangeForHalt() {
    var _a;
    if (HaltControl === undefined) {
        console.warn("Missing TermControl. What?");
        return;
    }
    const procs = ESEvalProcess_1.EvalProcess.GetActiveEvalProcesses();
    if (procs.length === 0) {
        HaltControl.hide();
    }
    else {
        let title = `$(debug-stop) Halt in Adobe...`;
        let tooltip = new vscode.MarkdownString(`Stop evaluating a script in a host application...`);
        let command = {
            command: CommandConstants.HALT_IN_HOST_CMD,
            title,
        };
        if (procs.length === 1) {
            const proc = procs[0];
            const appSpec = proc.getAppSpec();
            const engineName = proc.getEngineName();
            title = `$(debug-stop) Halt in ${ESDCore.GetDisplayNameForApplication((_a = proc.getRegisteredSpecifier()) !== null && _a !== void 0 ? _a : appSpec)} (${engineName})...`;
            tooltip = new vscode.MarkdownString(`Stop the evaluating script "${proc.getFileName()}" in **${appSpec}** (_${engineName}_)`);
            command.arguments = [
                {
                    evalProc: proc,
                },
            ];
        }
        HaltControl.text = title;
        HaltControl.tooltip = tooltip;
        HaltControl.command = command;
        HaltControl.show();
    }
}
function InitializeControls() {
    EvalControl = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 2);
    HaltControl = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
    OnActiveDebugSessionChangeForEval(vscode.debug.activeDebugSession);
    OnActiveTextEditorChangeForEval(vscode.window.activeTextEditor);
    OnActiveEvalProcessesChangeForHalt();
    vscode.debug.onDidChangeActiveDebugSession(OnActiveDebugSessionChangeForEval);
    vscode.window.onDidChangeActiveTextEditor(OnActiveTextEditorChangeForEval);
    ESEvalProcess_1.EvalProcess.AddActiveProcessesChangedListener(OnActiveEvalProcessesChangeForHalt);
}
exports.InitializeControls = InitializeControls;
function DisposeControls() {
    ESEvalProcess_1.EvalProcess.RemoveActiveProcessesChangedListener(OnActiveEvalProcessesChangeForHalt);
    EvalControl === null || EvalControl === void 0 ? void 0 : EvalControl.dispose();
    HaltControl === null || HaltControl === void 0 ? void 0 : HaltControl.dispose();
}
exports.DisposeControls = DisposeControls;

//# sourceMappingURL=EvalStatusBarControls.js.map
