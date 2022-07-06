"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageReason = exports.ESDCoreStatus = void 0;
var ESDCoreStatus;
(function (ESDCoreStatus) {
    ESDCoreStatus[ESDCoreStatus["ESDCORE_UNDEFINED"] = -2] = "ESDCORE_UNDEFINED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_FAILED"] = -1] = "ESDCORE_FAILED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_SUCCESS"] = 0] = "ESDCORE_SUCCESS";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_SCRIPTHOST_INIT_FAILED"] = 1] = "ESDCORE_SCRIPTHOST_INIT_FAILED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_DEBUGGER_SCRIPTS_LOAD_FAILED"] = 2] = "ESDCORE_DEBUGGER_SCRIPTS_LOAD_FAILED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_INIT_FAILED"] = 3] = "ESDCORE_INIT_FAILED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_DESTROY_FAILED"] = 4] = "ESDCORE_DESTROY_FAILED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_TARGETS_FETCH_FAILED"] = 5] = "ESDCORE_TARGETS_FETCH_FAILED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_BUFFER_LENGTH_LESS"] = 6] = "ESDCORE_BUFFER_LENGTH_LESS";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_SESSION_ENGINES_FETCH_FAILED"] = 7] = "ESDCORE_SESSION_ENGINES_FETCH_FAILED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_NO_SUCH_DEBUG_COMMAND"] = 8] = "ESDCORE_NO_SUCH_DEBUG_COMMAND";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_SCRIPT_EXECUTION_NO_RESULT"] = 9] = "ESDCORE_SCRIPT_EXECUTION_NO_RESULT";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_CLIENT_CONTEXT_NULL"] = 10] = "ESDCORE_CLIENT_CONTEXT_NULL";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_ALREADY_INITIALIZED"] = 11] = "ESDCORE_ALREADY_INITIALIZED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_NOT_INITIALIZED"] = 12] = "ESDCORE_NOT_INITIALIZED";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_NO_LAST_ERROR_INFO"] = 13] = "ESDCORE_NO_LAST_ERROR_INFO";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_ES_ENGINE_NO_ERROR"] = 14] = "ESDCORE_ES_ENGINE_NO_ERROR";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_ES_ENGINE_ERROR"] = 15] = "ESDCORE_ES_ENGINE_ERROR";
    ESDCoreStatus[ESDCoreStatus["ESDCORE_JSX_COMPILATION_FAILED"] = 16] = "ESDCORE_JSX_COMPILATION_FAILED";
})(ESDCoreStatus = exports.ESDCoreStatus || (exports.ESDCoreStatus = {}));
var MessageReason;
(function (MessageReason) {
    MessageReason[MessageReason["kUnknown"] = 0] = "kUnknown";
    MessageReason[MessageReason["kMessage"] = 1] = "kMessage";
    MessageReason[MessageReason["kDelivered"] = 2] = "kDelivered";
    MessageReason[MessageReason["kResponse"] = 3] = "kResponse";
    MessageReason[MessageReason["kError"] = 4] = "kError";
    MessageReason[MessageReason["kTimeout"] = 5] = "kTimeout";
    MessageReason[MessageReason["kLog"] = 6] = "kLog";
    MessageReason[MessageReason["kIdle"] = 7] = "kIdle";
})(MessageReason = exports.MessageReason || (exports.MessageReason = {}));

//# sourceMappingURL=ESDCoreLibTypes.js.map
