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
