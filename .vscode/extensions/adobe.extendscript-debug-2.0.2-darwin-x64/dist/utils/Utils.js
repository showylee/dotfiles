"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrimMiddle = exports.GetIsCurrentPlatformSupported = exports.GetCurrentPlatform = exports.GetCurrentTimestamp = exports.ShowErrorPrompt = void 0;
const vscode = require("vscode");
function ShowErrorPrompt(error) {
    vscode.window.showErrorMessage(error.toString(), {
        modal: true,
    });
}
exports.ShowErrorPrompt = ShowErrorPrompt;
function GetCurrentTimestamp() {
    const toTwoDigits = (v) => v < 10 ? `0${v}` : v;
    const toThreeDigits = (v) => v < 10 ? `00${v}` : v < 100 ? `0${v}` : v;
    const currentTime = new Date();
    return `${currentTime.getFullYear()}-${toTwoDigits(currentTime.getMonth() + 1)}-${toTwoDigits(currentTime.getDate())} ${toTwoDigits(currentTime.getHours())}:${toTwoDigits(currentTime.getMinutes())}:${toTwoDigits(currentTime.getSeconds())}.${toThreeDigits(currentTime.getMilliseconds())}`;
}
exports.GetCurrentTimestamp = GetCurrentTimestamp;
function GetCurrentPlatform() {
    return `${process.platform}-${process.arch}`;
}
exports.GetCurrentPlatform = GetCurrentPlatform;
function GetIsCurrentPlatformSupported() {
    const platform = GetCurrentPlatform();
    return platform === "win32-ia32" ||
        platform === "win32-x64" ||
        platform === "darwin-x64";
}
exports.GetIsCurrentPlatformSupported = GetIsCurrentPlatformSupported;
function TrimMiddle(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    let leftHalf = maxLength >> 1;
    let rightHalf = maxLength - leftHalf - 1;
    const rightPoint = text.codePointAt(text.length - rightHalf - 1);
    if (rightPoint && rightPoint >= 0x10000) {
        --rightHalf;
        ++leftHalf;
    }
    const leftPoint = text.codePointAt(leftHalf - 1);
    if (leftHalf > 0 && leftPoint && leftPoint >= 0x10000) {
        --leftHalf;
    }
    return text.substring(0, leftHalf) + '\u2026' + text.substring(text.length - rightHalf, text.length);
}
exports.TrimMiddle = TrimMiddle;

//# sourceMappingURL=Utils.js.map
