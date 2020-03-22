import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fetch from 'node-fetch';
import * as fs from 'fs';


// RegExp Expressions of correct repo and project URL
let projectUrlRegex = /https:\/\/github.com\/(orgs|users)\/([^/]+)\/projects\/([\d]+)/;
let repoUrlRegex = /https:\/\/github.com\/([^/]+)\/([^/]+)\/?/;

// Function to iterate the pullRequests and update the Project Column
async function updateProjectColumn(pullReqListEndpoint, cardEndpoint, authToken, COLUMN_NAME, currentHours, HOURS_FLAG) {
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
async function getColumnEndpoint(projectEndpoint: string, PROJECT_URL) {
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

// Helper Function to iterate the pullRequests and update the Project Column
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

// Function to construct Pull Request List Endpoint [GitHub APIs]
function constructPullReqListEndpoint(REPO_URL) {
    let isValid = repoUrlRegex.test(REPO_URL);
    if (!isValid) {
        throw Error('Not A Valid Repo URL');
    }
    let projectMeta = REPO_URL.replace('https://github.com/', '').split('/');
    let type = projectMeta[0];
    let uName = projectMeta[1];
    return { pullReqListEndpoint: `https://api.github.com/repos/${type}/${uName}/pulls`, uName }
}

// Function to construct Project Endpoint [GitHub APIs]
function constructProjectEndpoint(PROJECT_URL) {
    let isValid = projectUrlRegex.test(PROJECT_URL)
    if (!isValid) {
        throw Error("Invalid Project URL");
    }
    let projectMeta = PROJECT_URL.replace('https://github.com/', '').split('/');
    let type = projectMeta[0];
    let projectName = projectMeta[1];
    return { projectEndpoint: `https://api.github.com/${type}/${projectName}/projects` }
}

// Helper Function to Construct Auth Token
function constructAuthToken(uName, SECRET_TOKEN) {
    return Buffer.from(`${uName}:${SECRET_TOKEN}`).toString('base64');
}

async function main() {
    try {
        // REPO_URL contains the repository URL
        // let REPO_URL = 'https://github.com/hercules-iitrpr/test-project-automation'
        let REPO_URL = core.getInput('REPO_URL');
        if (!REPO_URL) {
            throw Error('No REPO_URL passed')
        }
        // PROJECT_URL contains the project URL
        // let PROJECT_URL = 'https://github.com/orgs/hercules-iitrpr/projects/1';
        let PROJECT_URL = core.getInput('PROJECT_URL');
        if (!PROJECT_URL) {
            throw Error('No PROJECT_URL passed')
        }
        // COLUMN_NAME => Name of the column into which Pull Requests Needs to be added 
        // let COLUMN_NAME = "In Progress (Community)";
        let COLUMN_NAME = core.getInput('COLUMN_NAME');
        if (!COLUMN_NAME) {
            throw Error('No COLUMN_NAME passed')
        }
        // SECRET_TOKEN contains the ACCESS TOKEN
        // let SECRET_TOKEN = '<--TEST-SECRET-TOKEN-->'
        let SECRET_TOKEN = core.getInput('SECRET_TOKEN');
        if (!SECRET_TOKEN) {
            throw Error('No SECRET_TOKEN passed')
        }
        // storing current Hours
        let currentHours = new Date().getHours();
        // Hours to consider
        let HOURS_FLAG = 5

        let { projectEndpoint } = constructProjectEndpoint(PROJECT_URL);
        let { pullReqListEndpoint, uName } = constructPullReqListEndpoint(REPO_URL);
        console.log(`Project Endpoint ${projectEndpoint}`)
        console.log(`Pull Request List EndPoint ${pullReqListEndpoint}`);
        let authToken = constructAuthToken(uName, SECRET_TOKEN);
        let columnEndpoint = await getColumnEndpoint(projectEndpoint, PROJECT_URL);
        console.log(`Column Endpoint: ${columnEndpoint}`);
        let cardEndpoint = await getCardEndpoint(columnEndpoint, authToken, COLUMN_NAME);
        console.log(`Card Endpoint: ${columnEndpoint}`);
        console.log(`Updating Pull Requests`);
        await updateProjectColumn(pullReqListEndpoint, cardEndpoint, authToken, COLUMN_NAME, currentHours, HOURS_FLAG);
        console.log('Updation Success');
    } catch (err) {
        console.log(err);
        console.log("Exiting");
    }

}

// Function returns the desired Card Endpoint after verifing its name with COLUMN_NAME 
async function getCardEndpoint(columnEndpoint: string, authToken: string, COLUMN_NAME) {
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
