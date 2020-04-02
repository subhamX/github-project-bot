import * as fetch from 'node-fetch';
import * as core from '@actions/core';

// RegExp Expressions of correct repo and project URL
let projectUrlRegex = /https:\/\/github.com\/(orgs|users)\/([^/]+)\/projects\/([\d]+)\/?/;
let repoUrlRegex = /https:\/\/github.com\/([^/]+)\/([^/]+)\/?/;

// Function to iterate the pullRequests and update the Project Column
export async function updateProjectColumn(pullReqListEndpoint: string, cardEndpoint: string, authToken: string, COLUMN_NAME: string, currentHours: number, HOURS_FLAG: number) {
    try {
        let res = await fetch(pullReqListEndpoint, {})
        let json: Array<any> = await res.json();
        for (let pullReq of json) {
            let createdAtHours = new Date(pullReq["created_at"]).getHours();
            let hoursDiff = currentHours - createdAtHours;
            if (hoursDiff <= HOURS_FLAG) {
                // Adding PR Card To Column
                let res = await addPRCardToColumn(cardEndpoint, pullReq["id"], authToken);
                if (!res.error) {
                    if (!res.already_added) {
                        // Successfully added
                        core.info(`Added [PR Title: ${pullReq['title']}]`);
                    }

                } else {
                    core.info(`Failed to Add [PR Title: ${pullReq['title']}]`);
                    core.error(res.message);
                }
            }
        }
    } catch (err) {
        core.info(err);
    }
}


// Function verifies the projectEndpoint and returns the columnEndpoint of desired project
export async function getColumnEndpoint(projectEndpoint: string, PROJECT_URL: string) {
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
        throw new Error("Project URL doesn't exist");
    }

}

// Helper Function to iterate the pullRequests and update the Project Column
export async function addPRCardToColumn(cardsEndpoint: string, pullRequestId: number, authToken: string): Promise<{ 'error': boolean, 'message'?: string, 'already_added'?: boolean }> {
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
        if (json['errors'][0]['message'] == 'Project already has the associated issue') {
            // PR is already linked to the project
            return { 'error': false, 'already_added': true };
        } else {
            return { 'error': true, 'message': json['errors'][0]['message'], 'already_added': false };
        }
    } else {
        return { 'error': false };
    }
}

// Function to construct Pull Request List Endpoint [GitHub APIs]
export function constructPullReqListEndpoint(REPO_URL: string) {
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
export function constructProjectEndpoint(PROJECT_URL) {
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
export function constructAuthToken(uName: string, ACCESS_TOKEN: string) {
    return Buffer.from(`${uName}:${ACCESS_TOKEN}`).toString('base64');
}



// Function returns the desired Card Endpoint after verifing its name with COLUMN_NAME 
export async function getCardEndpoint(columnEndpoint: string, authToken: string, COLUMN_NAME: string) {
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
