const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const vsts = require("vso-node-api");

// The collection URL for your account
// e.g. https://account.visualstudio.com/DefaultCollection
const collectionURL = process.env.COLLECTIONURL;    

// A Personal Auth Token for authenticating to the server
// See: https://www.visualstudio.com/en-us/docs/integrate/get-started/authentication/pats
const token = process.env.TOKEN;

// Create the connection to the VSTS account using the above URL and token
var authHandler = vsts.getPersonalAccessTokenHandler(token);
var connection = new vsts.WebApi(collectionURL, authHandler);

// Get an instance of the Git API to use to work with PRs
var vstsGit = connection.getGitApi();

app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.send("Hello World!" + token);
})

app.listen(3000, function () {
    console.log("Example app listening on port 3000!");
})

app.post("/", function (req, res) {

    // Get the details about the PR from the service hook payload
    var repoId = req.body.resource.repository.id;
    var pullRequestId = req.body.resource.pullRequestId;
    var title = req.body.resource.title;

    console.log(repoId);
    console.log(pullRequestId);
    console.log(title); 

    vstsGit.getPullRequestById(pullRequestId).then( result => {
        console.log(result);
    });

    // Build the status object that we want to post.
    // Assume that the PR is ready for review...
    var prStatus = {
        "state": "succeeded",
        "description": "Ready for review",
        "targetUrl": "http://www.visualstudio.com",
        "context": {
            "name": "wip-checker",
            "genre": "continuous-integration"
        }
    }

    // Check the title to see if there is "WIP" in the title.
    if (title.includes("WIP")) {
        prStatus.state = "pending";
        prStatus.description = "Work in progress"
    }

    // Post the status to the PR
    vstsGit.createPullRequestStatus(prStatus, repoId, pullRequestId).then( result => {
        console.log(result);
    });

    res.send("Received the POST");
})