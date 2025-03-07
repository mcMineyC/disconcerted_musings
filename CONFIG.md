# Configuration
Copy config.json.example to example.json
Make sure the directories specified in the "git" option exist and are git repos that are properly set up.  In the future I might change the config to only specify "sources", so that there can be a Git source, local source, remote source, etc.
If you have a private repo that houses the files, you will need to be logged into your account to pull changes (when using Github I recommend [their gh tool](https://cli.github.com/) since it supports a seamless device activation strategy)

Example config:
```json
{
  "port": 3000,
  "super_secret_token": "mySecretToken123",
  "mainIndex": "public",
  "defaultTitle": "My Awesome Blog",
  "git": [
    {
      "branch": "master",
      "directory": "data/src"
    },
    [any more git repos]
  ],
  "dirs": [
    {
      "raw": false,
      "path": "data/src/public",
      "name": "public",
      "indexed": true,
      "public": true,
      "token": "undefined",
      "cache": true
    },
    [other directories, clipped for brevity]
  ]
}
```
## Terminology
Collection/directory: essentially a folder containing published content
Index: a list of Markdown files in a given collection
Git repo: a collection of folders hosted on any Git provider (GitHub, GitLab, BitBucket, self-hosted, etc) that tracks changes over time

## Breakdown
- port: what it says on the tin, what port it listens on
- super_secret_token: the token used for the /update endpoint.  DO NOT, under ==**ANY**== circumstances give out this token or publish it in your repos
- mainIndex: the directory that will be shown upon navigating to /
- defaultTitle: the main title for all directories unless otherwise specified
- git: a list of objects defining the Git repositories as data sources
  - branch: the branch that will be pulled from
  - directory: the directory (relative to index.js) that the repo resides in
- dirs: a list of objects defining the directories served (essentially collections)
  - raw: determines whether or not files will be processed (needed for assets such as images)
  - path: the path relative to index.js that the collection originates from
  - name: the identifier for the collection
  - indexed: whether or not an index of files in said collection is served
  - token: a token used to authenticate users and restrict access to collections
  - cache: if the content should be cached after a render (essentially, whether it should be rendered on the fly or rendered once per update)
 
