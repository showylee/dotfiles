"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APP_SESSIONS = void 0;
const ESDEngineSessionsManager_1 = require("./ESDEngineSessionsManager");
const ESDCore = require("../core/ESDCore");
const ESTK3DebuggingProtocol_1 = require("../core/ESTK3DebuggingProtocol");
const ESOutputChannel_1 = require("./ESOutputChannel");
class ESDAppSessionsManager {
    constructor() {
        this.activeManagers = new Map();
    }
    registerDebugSession(session) {
        const appSpec = session.getHostAppSpecifier();
        let appManager;
        if (this.activeManagers.has(appSpec)) {
            appManager = this.activeManagers.get(appSpec);
        }
        else {
            appManager = new ESDEngineSessionsManager_1.ESDEngineSessionsManager(appSpec);
            if (this.activeManagers.size === 0) {
                ESDCore.RegisterConnectionHandler(this);
            }
            this.activeManagers.set(appSpec, appManager);
        }
        return appManager.registerSession(session);
    }
    unregisterDebugSession(session) {
        const appSpec = session.getHostAppSpecifier();
        if (!this.activeManagers.has(appSpec)) {
            const errMsg = `Cannot unregister session for application "${appSpec}" with engine ${session.getEngineName()}. No sessions active for that host application!`;
            ESOutputChannel_1.OutputChannel.log(errMsg);
            console.error(errMsg);
            return false;
        }
        const appManager = this.activeManagers.get(appSpec);
        if (!appManager.unregisterSession(session)) {
            return false;
        }
        if (appManager.getActiveSessionCount() === 0) {
            this.activeManagers.delete(appSpec);
            if (this.activeManagers.size === 0) {
                ESDCore.UnregisterConnectionHandler(this);
            }
        }
        return true;
    }
    isSessionActiveForApplicationAndEngine(appSpec, engineName) {
        return this.activeManagers.has(appSpec) && this.activeManagers.get(appSpec).isSessionActiveForEngine(engineName);
    }
    getActiveSessionForApplicationAndEngine(appSpec, engineName) {
        var _a;
        return (_a = this.activeManagers.get(appSpec)) === null || _a === void 0 ? void 0 : _a.getActiveSessionForEngine(engineName);
    }
    handleDebugProtocolMessage(reason, message) {
        const baseSpec = message.sender.split("#")[0];
        if (this.activeManagers.has(baseSpec)) {
            const session = this.activeManagers.get(baseSpec);
            (0, ESTK3DebuggingProtocol_1.DeliverDirectMessage)(session, message.body);
            return true;
        }
        return false;
    }
}
exports.APP_SESSIONS = new ESDAppSessionsManager();

//# sourceMappingURL=ESDAppSessionsManager.js.map
