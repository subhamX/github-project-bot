# GitHub Project Bot
**Description:** 🔰 `GitHub Project Bot` fetches recently created Pull Requests and updates the Project Column 🔰

**Usage:** This GitHub action allows you to use any webhook events to automate the process of updation of project cards with recently created `Pull Requests`

### Inputs

**`REPO_URL:`**
Complete URL of Repository whose Pull Request you want to automate

**`PROJECT_URL:`**
Complete URL of GitHub Project you want to use 

**`COLUMN_NAME:`**
Name of an existing column of the project specifed above into which you want to place pull-requests

**`ACCESS_TOKEN:`**
An Access Token to create new Project Card

<br/>

## Organization-scope project

1. Set the URL of Organization-scope project to `PROJECT_URL`
2. Set the name of an existing column of the project specifed above into which you want to place pull-requests to `COLUMN_NAME`
3. Use ${{ secrets.MY_KEY }} to set the access token to `ACCESS_TOKEN`


## Used Owned project

1. Set the URL of User owned project to `PROJECT_URL`
2. Set the name of an existing column of the project into which you want to place pull-requests to `COLUMN_NAME`
3. Use ${{ secrets.MY_KEY }} to set the access token to `ACCESS_TOKEN`


## Example - 
Scheduling the workflow to run at specific UTC time using `cron`. 
The following cron schedule expression will run `At every 5th minute from 0 through 59` and will run the following `TWO STEPS`
```
name: Add Recently Created Pull Requests to Project Column
on:
  schedule:
    - cron: "0/5 * * * *"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Handle Repo1
      uses: subhamX/github@v1
      env:
        ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
        COLUMN_NAME: In Progress
        PROJECT_URL: https://github.com/orgs/ORG/projects/1
        REPO_URL: https://github.com/ORG/repo1
    - name: Handle Repo2
      uses: subhamX/github@v1
      env:
        ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
        COLUMN_NAME: In Progress
        PROJECT_URL: https://github.com/orgs/ORG/projects/1
        REPO_URL: https://github.com/ORG/repo2
```
