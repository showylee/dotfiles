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
exports.ESDConfigurationProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const nls = require("vscode-nls");
const ESDCore = require("../core/ESDCore");
const Constants_1 = require("../utils/Constants");
const Utils_1 = require("../utils/Utils");
const ESDAppSessionsManager_1 = require("./ESDAppSessionsManager");
const ESOutputChannel_1 = require("./ESOutputChannel");
const ExtensionHelpers_1 = require("./ExtensionHelpers");
nls.config({ messageFormat: nls.MessageFormat.file });
const localize = nls.loadMessageBundle(__filename);
class ESDConfigurationProvider {
    provideDebugConfigurations(folder, token) {
        return [];
    }
    resolveDebugConfiguration(folder, config, token) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            if (!config.type && !config.request && !config.name) {
                const editor = vscode.window.activeTextEditor;
                if (editor !== undefined &&
                    (Constants_1.ES_LANGUAGE_IDS.indexOf(editor.document.languageId) > -1 ||
                        editor.document.fileName.endsWith(".jsxbin"))) {
                    config.type = Constants_1.DEBUG_TYPE_IDENTIFIER;
                    const items = [
                        {
                            label: "Launch",
                            description: localize(0, null),
                            detail: "Useful for debugging a script directly.",
                        },
                        {
                            label: "Attach",
                            description: localize(1, null),
                            detail: "Useful for CEP and ScriptUI debugging.",
                        },
                    ];
                    const options = {
                        canPickMany: false,
                        placeHolder: localize(2, null),
                    };
                    const selection = yield vscode.window.showQuickPick(items, options);
                    if (selection === undefined) {
                        return undefined;
                    }
                    if (selection.label === "Launch") {
                        config.name = "Run and Debug (Launch)";
                        config.request = "launch";
                        config.script = editor.document.fileName;
                    }
                    else {
                        config.name = "Run and Debug (Attach)";
                        config.request = "attach";
                    }
                }
            }
            config.hostAppSpecifier = (_a = config.hostAppSpecifier) !== null && _a !== void 0 ? _a : config.targetSpecifier;
            config.hiddenTypes = (_b = config.hiddenTypes) !== null && _b !== void 0 ? _b : config.excludes;
            config.script = (_c = config.script) !== null && _c !== void 0 ? _c : config.program;
            if ((_d = config.hostAppSpecifier) === null || _d === void 0 ? void 0 : _d.startsWith("vscesd")) {
                const errMsg = localize(3, null);
                ESOutputChannel_1.OutputChannel.log(errMsg);
                (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
                return undefined;
            }
            if (config.aliasPath !== undefined) {
                const aliasPath = ESDCore.ConvertUriToPath_Safe(config.aliasPath);
                if (!fs.existsSync(aliasPath)) {
                    const errMsg = localize(4, null, config.aliasPath);
                    ESOutputChannel_1.OutputChannel.log(errMsg);
                    (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
                    return null;
                }
                config.aliasPath = aliasPath;
            }
            const [hostAppSpec, registeredSpecifier] = yield (0, ExtensionHelpers_1.GetAndResolveApplicationSpecifierAndRegisteredSpecifier)(config.hostAppSpecifier, config.registeredSpecifier);
            if (typeof hostAppSpec !== "string") {
                return hostAppSpec;
            }
            else {
                config.hostAppSpecifier = hostAppSpec;
                config.registeredSpecifier = registeredSpecifier;
            }
            const engineResolver = new ExtensionHelpers_1.HostAppComsHelper();
            const engineName = yield engineResolver.getAndResolveEngineName(config.hostAppSpecifier, config.engineName);
            if (typeof engineName !== "string") {
                return engineName;
            }
            else {
                config.engineName = engineName;
            }
            if (ESDAppSessionsManager_1.APP_SESSIONS.isSessionActiveForApplicationAndEngine(config.hostAppSpecifier, config.engineName)) {
                const errMsg = localize(5, null, config.hostAppSpecifier);
                ESOutputChannel_1.OutputChannel.log(errMsg);
                (0, Utils_1.ShowErrorPrompt)(new Error(errMsg));
                return undefined;
            }
            ;
            if (config.request === "launch") {
                if (config.debugLevel !== undefined &&
                    config.debugLevel !== 0 &&
                    config.debugLevel !== 1 &&
                    config.debugLevel !== 2) {
                    const warnMsg = `Launch configuration property "debugLevel" has unrecognzed value "${config.debugLevel}". Expected a value of 0, 1, or 2. Proceeding with default.`;
                    ESOutputChannel_1.OutputChannel.log(warnMsg);
                    config.debugLevel = undefined;
                }
            }
            return config;
        });
    }
    handleDebugProtocolMessage(reason, message) {
        return false;
    }
}
exports.ESDConfigurationProvider = ESDConfigurationProvider;

//# sourceMappingURL=ESDConfigurationProvider.js.map
