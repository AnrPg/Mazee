"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
var Client = /** @class */ (function () {
    function Client(config) {
        this.config = config;
    }
    Client.prototype.ping = function () { return "ok"; };
    return Client;
}());
exports.Client = Client;
