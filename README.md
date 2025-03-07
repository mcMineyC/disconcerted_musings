# Disconcerted Musings
This project is yet another Markdown content hosting platform.  The goal of this is not to use any too-fancy browser features for a consstent experience.  I made this specificially to fulfill my needs: taking notes in [Obsidian.md](https://obsidian.md) and publishing them.  I'm aware of [Quartz](https://github.com/jackyzha0/quartz) but I wanted to reinvent the wheel.

# Deploying
1. Install Node.js (I used v20) and NPM.
2. Clone the repo
3. Run ```npm i```
4. Tweak the config to your needs (check [CONFIG.md](/CONFIG.md)!)
5. Run ```node index.js``` in the background (needs to be continuously running so that it can handle new content)
6. You're done!

# Usage
## General use
Each directory specified in config.json will be exposed at {base url}/{collection}
When setting ```raw: false```, file names are not needed.  However, be aware that trying to process raw files (images, audio, etc) as markdown content (NOT setting ```raw: true```) will cataclysmically fail.

## Update endpoint
Instead of manually pulling updates from the sourced Git repos, Musings allows you to autonoomously update the repos using a special endpoint.
It is a POST request at ```/update```.  An example request looks like follows:
```json
{
  "token": [the super_secrect_token defined in config.json],
  "name": [any defined collection name]
}
```

Example Github Actions workflow:

```.github/workflows/update.yaml```

```yaml
name: Update API Endpoint

on:
  push:
    branches:
      - [your branch name]

jobs:
  send-update-request:
    runs-on: ubuntu-latest
    
    steps:
      - name: Install curl
        run: sudo apt-get update && sudo apt-get install -y curl

      - name: Send POST request to update endpoint
        run: |
          curl -X POST \
               -H "Content-Type: application/json" \
               -d '{"token":"${{ secrets.super_secret_token }}", "name": "[collection name]"}' \
               "${{ secrets.secret_url }}/update"
```
Make sure to define both super_secret_token and secret_url (publicly accessible deployment url) in the workflow secrets

# Architecture
TODO
