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
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const CommandConstants = require("../utils/Constants");
const Utils = require("../utils/Utils");
const ESDCore = require("../core/ESDCore");
const ESDConfigurationProvider_1 = require("./ESDConfigurationProvider");
const ESDDebugSession_1 = require("./ESDDebugSession");
const ESOutputChannel_1 = require("./ESOutputChannel");
const ExtensionHelpers = require("./ExtensionHelpers");
const ExtensionCommands = require("./ExtensionCommands");
const EvalStatusBarControls_1 = require("./EvalStatusBarControls");
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!Utils.GetIsCurrentPlatformSupported()) {
            const platform = Utils.GetCurrentPlatform();
            const msg = (platform === "darwin-arm64") ?
                `The Adobe ExtendScript Debugger extension does not currently run natively on Apple Silicon devices. To use the extension, ${vscode.env.appName} must be opened using Rosetta. For more information please see the extension's README.` :
                `The Adobe ExtendScript Debugger extension does not currently run natively on this device. For more information please see the extension's README.`;
            ESOutputChannel_1.OutputChannel.log(msg);
            const readmeButtomText = "View README";
            vscode.window.showWarningMessage(msg, readmeButtomText).then((value) => {
                if (value === readmeButtomText) {
                    const uri = vscode.Uri.from({
                        scheme: "https",
                        authority: "marketplace.visualstudio.com",
                        path: "items",
                        query: "itemName=Adobe.extendscript-debug",
                        fragment: "known-issues",
                    });
                    vscode.env.openExternal(uri);
                }
            });
            throw new Error("The ExtendScript Debugger extension is not supported on the current architecture.");
        }
        ESOutputChannel_1.OutputChannel.log("Activating extension...");
        try {
            yield ExtensionHelpers.UnzipResourcesIfPresent();
        }
        catch (err) {
            let errMsg = err;
            if (err instanceof Error) {
                errMsg = err.message;
            }
            ESOutputChannel_1.OutputChannel.log(errMsg);
            Utils.ShowErrorPrompt(new Error(errMsg));
            return;
        }
        ;
        context.subscriptions.push(vscode.commands.registerCommand(CommandConstants.EVAL_IN_HOST_CMD, ExtensionCommands.EvalInHost));
        context.subscriptions.push(vscode.commands.registerCommand(CommandConstants.EVAL_IN_ATTACHED_HOST_CMD, ExtensionCommands.EvalInAttachedHost));
        context.subscriptions.push(vscode.commands.registerCommand(CommandConstants.HALT_IN_HOST_CMD, ExtensionCommands.HaltInHost));
        context.subscriptions.push(vscode.commands.registerCommand(CommandConstants.CLEAR_ERROR_HIGHLIGHTS_CMD, ExtensionCommands.ClearErrorHighlights));
        context.subscriptions.push(vscode.commands.registerCommand(CommandConstants.EXPORT_TO_JSXBIN_CMD, ExtensionCommands.ExportToJSXBin));
        const configProvider = new ESDConfigurationProvider_1.ESDConfigurationProvider();
        context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(CommandConstants.DEBUG_TYPE_IDENTIFIER, configProvider));
        const adapterFactory = new InlineDebugAdapterFactory();
        context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory(CommandConstants.DEBUG_TYPE_IDENTIFIER, adapterFactory));
        (0, EvalStatusBarControls_1.InitializeControls)();
        ExtensionCommands.InitializeCommands();
        ESDCore.RegisterUnhandledMessageHandler(ExtensionHelpers.HandleUnhandledBreakRequest);
        ESOutputChannel_1.OutputChannel.log("Extension activated.");
    });
}
exports.activate = activate;
function deactivate() {
    ESDCore.UnregisterUnhandledMessageHandler(ExtensionHelpers.HandleUnhandledBreakRequest);
    (0, EvalStatusBarControls_1.DisposeControls)();
    ESOutputChannel_1.OutputChannel.log("Extension deactivated.");
}
exports.deactivate = deactivate;
class InlineDebugAdapterFactory {
    createDebugAdapterDescriptor(_session) {
        return new vscode.DebugAdapterInlineImplementation(new ESDDebugSession_1.ESDDebugSession());
    }
}

//# sourceMappingURL=Extension.js.map
