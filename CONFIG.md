# Configuration
Copy config.json.example to example.json

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

## Breakdown
- port: what it says on the tin, what port it listens on
- super_secret_token: the token used for the /update endpoint
- mainIndex: the directory that will be shown upon navigating to /
- defaultTitle: the main title for all directories unless otherwise specified
- git: a list of objects defining the Git repositories as data sources
  - branch: the branch that will be pulled from
  - directory: the directory (relative to index.js) that the repo resides in
- dirs: a list of objects defining the directories served (essentially collections)
  - raw: determines whether or not files will be processed (needed for assets such as images)
  - path: the path relative to index.js
