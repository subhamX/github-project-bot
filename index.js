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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var core = require("@actions/core");
var fetch = require("node-fetch");
// RegExp Expressions of correct repo and project URL
var projectUrlRegex = /https:\/\/github.com\/(orgs|users)\/([^/]+)\/projects\/([\d]+)/;
var repoUrlRegex = /https:\/\/github.com\/([^/]+)\/([^/]+)\/?/;
// Function to iterate the pullRequests and update the Project Column
function updateProjectColumn(pullReqListEndpoint, cardEndpoint, authToken, COLUMN_NAME, currentHours, HOURS_FLAG) {
    return __awaiter(this, void 0, void 0, function () {
        var res, json, _i, json_1, pullReq, createdAtHours, hoursDiff, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    return [4 /*yield*/, fetch(pullReqListEndpoint, {})];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    json = _a.sent();
                    _i = 0, json_1 = json;
                    _a.label = 3;
                case 3:
                    if (!(_i < json_1.length)) return [3 /*break*/, 6];
                    pullReq = json_1[_i];
                    createdAtHours = new Date(pullReq["created_at"]).getHours();
                    hoursDiff = currentHours - createdAtHours;
                    if (!(hoursDiff <= HOURS_FLAG)) return [3 /*break*/, 5];
                    // Adding PR Card To Column
                    console.log("Adding " + pullReq['title'] + " into: " + COLUMN_NAME);
                    return [4 /*yield*/, addPRCardToColumn(cardEndpoint, pullReq["id"], authToken)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [3 /*break*/, 8];
                case 7:
                    err_1 = _a.sent();
                    console.log(err_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
// Function verifies the projectEndpoint and returns the columnEndpoint of desired project
function getColumnEndpoint(projectEndpoint, PROJECT_URL) {
    return __awaiter(this, void 0, void 0, function () {
        var res, json, project;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch(projectEndpoint, {
                        'headers': {
                            'Accept': 'application/vnd.github.inertia-preview+json'
                        }
                    })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    json = _a.sent();
                    if (json["message"] === 'Not Found') {
                        // Invalid Project Associated With The User
                        throw new Error("No Projects Associated With The User");
                    }
                    project = json.find(function (e) {
                        return e.html_url == PROJECT_URL;
                    });
                    if (project) {
                        return [2 /*return*/, project["columns_url"]];
                    }
                    else {
                        // Invalid Project URL
                        throw new Error("Invalid Project URL");
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Helper Function to iterate the pullRequests and update the Project Column
function addPRCardToColumn(cardsEndpoint, pullRequestId, authToken) {
    return __awaiter(this, void 0, void 0, function () {
        var options, res, json;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/vnd.github.inertia-preview+json',
                            'Authorization': "Basic " + authToken
                        },
                        body: JSON.stringify({
                            "content_type": "PullRequest",
                            "content_id": pullRequestId
                        })
                    };
                    return [4 /*yield*/, fetch(cardsEndpoint, options)];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    json = _a.sent();
                    if (json['errors']) {
                        console.log(json['errors'][0]['message']);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
// Function to construct Pull Request List Endpoint [GitHub APIs]
function constructPullReqListEndpoint(REPO_URL) {
    var isValid = repoUrlRegex.test(REPO_URL);
    if (!isValid) {
        throw Error('Not A Valid Repo URL');
    }
    var projectMeta = REPO_URL.replace('https://github.com/', '').split('/');
    var type = projectMeta[0];
    var uName = projectMeta[1];
    return { pullReqListEndpoint: "https://api.github.com/repos/" + type + "/" + uName + "/pulls", uName: uName };
}
// Function to construct Project Endpoint [GitHub APIs]
function constructProjectEndpoint(PROJECT_URL) {
    var isValid = projectUrlRegex.test(PROJECT_URL);
    if (!isValid) {
        throw Error("Invalid Project URL");
    }
    var projectMeta = PROJECT_URL.replace('https://github.com/', '').split('/');
    var type = projectMeta[0];
    var projectName = projectMeta[1];
    return { projectEndpoint: "https://api.github.com/" + type + "/" + projectName + "/projects" };
}
// Helper Function to Construct Auth Token
function constructAuthToken(uName, SECRET_TOKEN) {
    return Buffer.from(uName + ":" + SECRET_TOKEN).toString('base64');
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var REPO_URL, PROJECT_URL, COLUMN_NAME, SECRET_TOKEN, currentHours, HOURS_FLAG, projectEndpoint, _a, pullReqListEndpoint, uName, authToken, columnEndpoint, cardEndpoint, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    REPO_URL = core.getInput('REPO_URL');
                    if (!REPO_URL) {
                        throw Error('No REPO_URL passed');
                    }
                    PROJECT_URL = core.getInput('PROJECT_URL');
                    if (!PROJECT_URL) {
                        throw Error('No PROJECT_URL passed');
                    }
                    COLUMN_NAME = core.getInput('COLUMN_NAME');
                    if (!COLUMN_NAME) {
                        throw Error('No COLUMN_NAME passed');
                    }
                    SECRET_TOKEN = core.getInput('SECRET_TOKEN');
                    if (!SECRET_TOKEN) {
                        throw Error('No SECRET_TOKEN passed');
                    }
                    currentHours = new Date().getHours();
                    HOURS_FLAG = 5;
                    projectEndpoint = constructProjectEndpoint(PROJECT_URL).projectEndpoint;
                    _a = constructPullReqListEndpoint(REPO_URL), pullReqListEndpoint = _a.pullReqListEndpoint, uName = _a.uName;
                    console.log("Project Endpoint " + projectEndpoint);
                    console.log("Pull Request List EndPoint " + pullReqListEndpoint);
                    authToken = constructAuthToken(uName, SECRET_TOKEN);
                    return [4 /*yield*/, getColumnEndpoint(projectEndpoint, PROJECT_URL)];
                case 1:
                    columnEndpoint = _b.sent();
                    console.log("Column Endpoint: " + columnEndpoint);
                    return [4 /*yield*/, getCardEndpoint(columnEndpoint, authToken, COLUMN_NAME)];
                case 2:
                    cardEndpoint = _b.sent();
                    console.log("Card Endpoint: " + columnEndpoint);
                    console.log("Updating Pull Requests");
                    return [4 /*yield*/, updateProjectColumn(pullReqListEndpoint, cardEndpoint, authToken, COLUMN_NAME, currentHours, HOURS_FLAG)];
                case 3:
                    _b.sent();
                    console.log('Updation Success');
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _b.sent();
                    console.log(err_2);
                    console.log("Exiting");
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// Function returns the desired Card Endpoint after verifing its name with COLUMN_NAME 
function getCardEndpoint(columnEndpoint, authToken, COLUMN_NAME) {
    return __awaiter(this, void 0, void 0, function () {
        var options, res, json, column;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/vnd.github.inertia-preview+json',
                            'Authorization': "Basic " + authToken
                        }
                    };
                    return [4 /*yield*/, fetch(columnEndpoint, options)];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    json = _a.sent();
                    if (json.length == 0) {
                        // No Column In The Project
                        throw new Error('No Column In The Project');
                    }
                    column = json.find(function (e) {
                        return e.name == COLUMN_NAME;
                    });
                    if (column) {
                        return [2 /*return*/, column["cards_url"]];
                    }
                    else {
                        // No column exist with the given COLUMN_NAME
                        throw new Error('No column exist with the given COLUMN_NAME');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
main();
