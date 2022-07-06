"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputChannel = void 0;
const vscode = require("vscode");
const Constants_1 = require("../utils/Constants");
const Utils_1 = require("../utils/Utils");
class ESOutputChannel {
    constructor(name) {
        this.channel = vscode.window.createOutputChannel(name);
    }
    log(message, show = false) {
        this.channel.appendLine(`[${(0, Utils_1.GetCurrentTimestamp)()}] ${message}`);
        if (show) {
            this.channel.show(true);
        }
    }
    clear() {
        this.channel.clear();
    }
}
exports.OutputChannel = new ESOutputChannel(Constants_1.ESOUTPUT_CHANNEL);

//# sourceMappingURL=ESOutputChannel.js.map
