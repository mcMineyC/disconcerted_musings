const express = require("express");
const fs = require("fs");
const app = express();
const port = 3000;
const { markdownUtils } = require("./markdown-utils");
const { updateUtils } = require("./update-utils");

const gitDirectory = "./data/src";
const git = require("simple-git")(gitDirectory);

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

app.get("/", (req, res) => {
  const htmlContent = markdownUtils.process(
    "# Hello World\n\nThis is a test markdown file",
  );
  res.send(htmlContent);
});

app.get("/post/:id", async (req, res) => {
  const id = req.params.id;
  if (!fs.existsSync(`./data/cache/${id}.html`)) {
    if (!fs.existsSync(`./data/src/finished/${id}.md`)) {
      res.status(404).send("Not found");
      return;
    }
    const success = await markdownUtils.render(
      `./data/src/finished/${id}.md`,
      `./data/cache/${id}.html`,
      fs,
    );
    if (!success) {
      res.status(500).send("Internal server error");
      return;
    }
  }
  const htmlContent = fs.readFileSync(
    `./data/cache/${req.params.id}.html`,
    "utf8",
  );
  res.send(htmlContent);
});

app.post("/update", express.json(), async (req, res) => {
  const secretToken = process.env.SECRET_TOKEN;
  const requestToken = req.body.token;

  if (!secretToken || secretToken !== requestToken) {
    res.status(401).send("Unauthorized");
    return;
  }
  try {
    await updateUtils.git(git);
    res.status(200).send("Update successful");
  } catch (error) {
    console.error(error);
    res.status(500).send("Update failed");
  }
});

async function main() {
  if (!fs.existsSync("./data")) {
    await fs.mkdir("./data");
    if (!fs.existsSync("./data/src")) {
      await fs.mkdir("./data/src");
    }
    if (!fs.existsSync("./data/cache")) {
      await fs.mkdir("./data/cache");
    }
  }
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

main();
