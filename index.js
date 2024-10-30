const express = require("express");
const fs = require("fs");
const app = express();
const port = 3000;
const { markdownUtils } = require("./markdown-utils");
const { updateUtils } = require("./update-utils");

const gitDirectory = "./data/src";
const git = require("simple-git")(gitDirectory);

const secretToken = process.env.SECRET_TOKEN;
const superSecretToken = process.env.SUPER_SECRET_TOKEN;
const mdTemplate = fs.readFileSync("./template.html", "utf8");

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
    "# Hello World\nThis is a test markdown file, being rendered on the fly\n - A simple list i think\n - Another item\n\n## A subheading\n\nThis is a paragraph\n\n[Link to Google](https://www.google.com)\n\n> A blockquote\n\n**Bold text**\n\n*Italic text*",
  );
  res.send(htmlContent);
});

app.get("/post/:id", async (req, res) => {
  const id = req.params.id;
  if (!fs.existsSync(`./data/cache/${id}.html`) || true) {
    if (!fs.existsSync(`./data/src/finished/${id}.md`)) {
      res.status(404).send("Not found");
      return;
    }
    const success = await markdownUtils.render(
      `./data/src/finished/${id}.md`,
      `./data/cache/${id}.html`,
      id.substring(0, 1).toUpperCase() + id.substring(1),
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

app.get("/wip/:id", async (req, res) => {
  let requestToken = req.query.token;

  if (!secretToken || secretToken !== requestToken) {
    res.status(401).send({ status: "unauthorized" });
    return;
  }
  const id = req.params.id;
  if (!fs.existsSync(`./data/src/wip/${id}.md`)) {
    res.status(404).send("Not found");
    return;
  }
  try {
    const htmlContent = await markdownUtils.renderString(
      fs.readFileSync(`./data/src/wip/${id}.md`, "utf-8"),
      id.substring(0, 1).toUpperCase() + id.substring(1),
      mdTemplate,
    );
    res.send(htmlContent);
  } catch (error) {
    res.status(500).send("Internal server error\n" + error);
    return;
  }
});

app.post("/update", express.json(), async (req, res) => {
  const requestToken = req.body.token;

  if (!superSecretToken || superSecretToken !== requestToken) {
    res.status(401).send({ status: "unauthorized" });
    return;
  }
  try {
    await updateUtils.git(git);
    res.status(200).send({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error" });
  }
});

async function main() {
  console.log("Starting server...");
  console.log("\tSecret token is: ", secretToken);
  console.log("\tSuper secret token is: ", superSecretToken);
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
