"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESDEngineSessionsManager = void 0;
const ESOutputChannel_1 = require("./ESOutputChannel");
class ESDEngineSessionsManager {
    constructor(_hostApp) {
        this.activeSessions = new Map();
        this.hostApplication = _hostApp;
    }
    getActiveSessionCount() {
        return this.activeSessions.size;
    }
    registerSession(session) {
        const engineName = session.getEngineName();
        if (this.activeSessions.has(engineName)) {
            const errMsg = `Failed to register a Debug Session because a Debug Session for engine "${engineName}" already exists!`;
            ESOutputChannel_1.OutputChannel.log(errMsg);
            console.error(errMsg);
            return false;
        }
        this.activeSessions.set(engineName, session);
        return true;
    }
    unregisterSession(session) {
        const engineName = session.getEngineName();
        if (!this.activeSessions.has(engineName)) {
            const errMsg = `Failed to unregister a Debug Session because a Debug Session for engine "${engineName}" is not registered!`;
            ESOutputChannel_1.OutputChannel.log(errMsg);
            console.error(errMsg);
            return false;
        }
        this.activeSessions.delete(engineName);
        return true;
    }
    isSessionActiveForEngine(engineName) {
        return this.activeSessions.has(engineName);
    }
    getActiveSessionForEngine(engineName) {
        return this.activeSessions.get(engineName);
    }
    OnESTKLaunchConnectRequest(request) {
    }
    OnESTKBreakConnectRequest(request) {
        const breakEngine = request.break["@engine"];
        if (this.activeSessions.has(breakEngine)) {
            this.activeSessions.get(breakEngine).OnESTKBreakConnectRequest(request);
        }
    }
    OnESTKBreak(request) {
        const breakEngine = request["@engine"];
        if (this.activeSessions.has(breakEngine)) {
            this.activeSessions.get(breakEngine).OnESTKBreak(request);
        }
    }
    OnESTKExit(request) {
        const exitEngine = request["@engine"];
        if (this.activeSessions.has(exitEngine)) {
            this.activeSessions.get(exitEngine).OnESTKExit(request);
        }
    }
    OnESTKEngineName(request) {
        if (request["@new"] === undefined || request["@new"] === "") {
            const oldEngineName = request["@old"];
            if (this.activeSessions.has(oldEngineName)) {
                const debugSession = this.activeSessions.get(oldEngineName);
                debugSession.onEngineShutdown();
            }
        }
        else if (request["@old"] === undefined || request["@old"] === "") {
        }
        else {
            const oldEngineName = request["@old"];
            if (this.activeSessions.has(oldEngineName)) {
                const debugSession = this.activeSessions.get(oldEngineName);
                this.activeSessions.delete(oldEngineName);
                const newEngineName = request["@new"];
                if (this.activeSessions.has(newEngineName)) {
                    const errMsg = `Encountered engine renaming event for host "${this.hostApplication}" from "${oldEngineName}" to "${newEngineName}" but a session is already active for the new name!`;
                    ESOutputChannel_1.OutputChannel.log(errMsg);
                    console.error(errMsg);
                }
                else {
                    debugSession.onEngineRenamed(newEngineName);
                    this.activeSessions.set(newEngineName, debugSession);
                }
            }
        }
    }
    OnESTKPrint(request) {
        const printEngine = request["@engine"];
        if (this.activeSessions.has(printEngine)) {
            this.activeSessions.get(printEngine).OnESTKPrint(request);
        }
    }
}
exports.ESDEngineSessionsManager = ESDEngineSessionsManager;

//# sourceMappingURL=ESDEngineSessionsManager.js.map
