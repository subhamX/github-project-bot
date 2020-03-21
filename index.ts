import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fetch from 'node-fetch';
import * as fs from 'fs';

// REPO_URL contains the repository URL
let REPO_URL = 'https://github.com/hercules-iitrpr/test-project-automation'
// PROJECT_URL contains the project URL
let PROJECT_URL = 'https://github.com/orgs/hercules-iitrpr/projects/1';
// COLUMN_NAME => column name into which Community Pull Requests Needs to be added 
let COLUMN_NAME = "In Progress (Community)";
let currentHours = new Date().getHours();
// SECRET_TOKEN contains the ACCESS TOKEN
let SECRET_TOKEN = '<--TEST-SECRET-TOKEN-->'
// Hours to consider
let HOURS_FLAG = 5

let projectUrlRegex = /https:\/\/github.com\/(orgs|users)\/([^/]+)\/projects\/([\d]+)/;
let repoUrlRegex = /https:\/\/github.com\/([^/]+)\/([^/]+)\/?/;

async function updatePullRequests(pullReqListEndpoint, cardEndpoint, authToken) {
    try {
        let res = await fetch(pullReqListEndpoint, {})
        let json: Array<any> = await res.json();
        for (let pullReq of json) {
            let createdAtHours = new Date(pullReq["created_at"]).getHours();
            let hoursDiff = currentHours - createdAtHours;
            if (hoursDiff <= HOURS_FLAG) {
                // Adding PR Card To Column
                console.log(`Adding ${pullReq['title']} into: ${COLUMN_NAME}`);
                await addPRCardToColumn(cardEndpoint, pullReq["id"], authToken);
            }
        }
    } catch (err) {
        console.log(err);
    }
}


// Function verifies the projectEndpoint and returns the columnEndpoint of desired project
async function getColumnEndpoint(projectEndpoint: string) {
    let res = await fetch(projectEndpoint, {
        'headers': {
            'Accept': 'application/vnd.github.inertia-preview+json'
        }
    });
    let json: Array<any> = await res.json();
    if (json["message"] === 'Not Found') {
        // Invalid Project Associated With The User
        throw new Error("No Projects Associated With The User");
    }
    let project = json.find((e) => {
        return e.html_url == PROJECT_URL;
    })
    if (project) {
        return project["columns_url"];
    } else {
        // Invalid Project URL
        throw new Error("Invalid Project URL");
    }

}

async function addPRCardToColumn(cardsEndpoint, pullRequestId, authToken) {
    var options = {
        method: 'POST',
        headers: {
            'Accept': 'application/vnd.github.inertia-preview+json',
            'Authorization': `Basic ${authToken}`
        },
        body: JSON.stringify({
            "content_type": "PullRequest",
            "content_id": pullRequestId
        })
    };
    let res = await fetch(cardsEndpoint, options)
    let json = await res.json();
    if (json['errors']) {
        console.log(json['errors'][0]['message']);
    }
}

// let cardEndpoint = 'https://api.github.com/projects/columns/8413851/cards';

function constructPullReqListEndpoint() {
    let isValid = repoUrlRegex.test(REPO_URL);
    if (!isValid) {
        throw Error('Not A Valid Repo URL');
    }
    let projectMeta = REPO_URL.replace('https://github.com/', '').split('/');
    let type = projectMeta[0];
    let uName = projectMeta[1];
    return { pullReqListEndpoint: `https://api.github.com/repos/${type}/${uName}/pulls`, uName }
}

function constructProjectEndpoint() {
    let isValid = projectUrlRegex.test(PROJECT_URL)
    if (!isValid) {
        throw Error("Invalid Project URL");
    }
    let projectMeta = PROJECT_URL.replace('https://github.com/', '').split('/');
    let type = projectMeta[0];
    let projectName = projectMeta[1];
    return { projectEndpoint: `https://api.github.com/${type}/${projectName}/projects` }
}


function constructAuthToken(uName) {
    return Buffer.from(`${uName}:${SECRET_TOKEN}`).toString('base64');
}

async function main() {
    try {
        let { projectEndpoint } = constructProjectEndpoint();
        let { pullReqListEndpoint, uName } = constructPullReqListEndpoint();
        console.log(`Project Endpoint ${projectEndpoint}`)
        console.log(`Pull Request List EndPoint ${pullReqListEndpoint}`);
        let authToken = constructAuthToken(uName);
        let columnEndpoint = await getColumnEndpoint(projectEndpoint);
        console.log(`Column Endpoint: ${columnEndpoint}`);
        let cardEndpoint = await getCardEndpoint(columnEndpoint, authToken);
        console.log(`Card Endpoint: ${columnEndpoint}`);
        console.log(`Updating Pull Requests`);
        await updatePullRequests(pullReqListEndpoint, cardEndpoint, authToken);
        console.log('Updation Success');
    } catch (err) {
        console.log(err);
        console.log("Exiting");
    }

}

// Function returns the desired Card Endpoint after verifing its name with COLUMN_NAME 
async function getCardEndpoint(columnEndpoint: string, authToken: string) {
    var options = {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github.inertia-preview+json',
            'Authorization': `Basic ${authToken}`
        },
    };
    let res = await fetch(columnEndpoint, options)
    let json: Array<any> = await res.json();
    if (json.length == 0) {
        // No Column In The Project
        throw new Error('No Column In The Project')
    }
    let column = json.find((e) => {
        return e.name == COLUMN_NAME;
    })
    if (column) {
        return column["cards_url"];
    } else {
        // No column exist with the given COLUMN_NAME
        throw new Error('No column exist with the given COLUMN_NAME')
    }
}

main();
