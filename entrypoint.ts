import * as core from '@actions/core';
import * as index from './index';

(async function main() {
    try {
        // REPO_URL contains the repository URL
        let REPO_URL = core.getInput('REPO_URL');
        if (!REPO_URL) {
            throw Error('No REPO_URL passed')
        }
        // Removing last backslash if it is present
        if (REPO_URL[REPO_URL.length - 1] === '/') {
            REPO_URL = REPO_URL.slice(0, REPO_URL.length - 1);
        }
        // PROJECT_URL contains the project URL
        let PROJECT_URL = core.getInput('PROJECT_URL');
        if (!PROJECT_URL) {
            throw Error('No PROJECT_URL passed')
        }
        // Removing last backslash if it is present
        if (PROJECT_URL[PROJECT_URL.length - 1] === '/') {
            PROJECT_URL = PROJECT_URL.slice(0, PROJECT_URL.length - 1);
        }
        // COLUMN_NAME => Name of the column into which Pull Requests Needs to be added 
        let COLUMN_NAME = core.getInput('COLUMN_NAME');
        if (!COLUMN_NAME) {
            throw Error('No COLUMN_NAME passed')
        }
        // ACCESS_TOKEN contains the ACCESS TOKEN
        let ACCESS_TOKEN = core.getInput('ACCESS_TOKEN');
        if (!ACCESS_TOKEN) {
            throw Error('No ACCESS_TOKEN passed')
        }
        // storing current Hours
        let currentHours = new Date().getHours();
        // Considering Pull Requests from Last 24 Hours
        let HOURS_FLAG = 24;

        let { projectEndpoint } = index.constructProjectEndpoint(PROJECT_URL);
        let { pullReqListEndpoint, uName } = index.constructPullReqListEndpoint(REPO_URL);
        core.info(`Project Endpoint: ${projectEndpoint}`)
        core.info(`Pull Request List EndPoint: ${pullReqListEndpoint}`);
        let authToken = index.constructAuthToken(uName, ACCESS_TOKEN);
        let columnEndpoint = await index.getColumnEndpoint(projectEndpoint, PROJECT_URL);
        core.info(`Column Endpoint: ${columnEndpoint}`);
        let cardEndpoint = await index.getCardEndpoint(columnEndpoint, authToken, COLUMN_NAME);
        core.info(`Card Endpoint: ${columnEndpoint}`);
        core.info(`Updating Pull Requests`);
        await index.updateProjectColumn(pullReqListEndpoint, cardEndpoint, authToken, COLUMN_NAME, currentHours, HOURS_FLAG);
        core.info('Update Success');
    } catch (err) {
        core.error(err);
    }
})()