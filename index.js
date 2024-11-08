const fs = require("fs");
var config = require("./config.json");
const express = require("express");
const app = express();
const port = process.env.PORT || config.port || 3000;
const markdownUtils = require("./markdown-utils");
const updateUtils = require("./update-utils");
const renderer = require("./rendering");

var git = [];

const superSecretToken =
  process.env.SUPER_SECRET_TOKEN || config.superSecretToken;
const mdTemplate = fs.readFileSync("./template.html", "utf8");
const path = require("path");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

app.get("/", (req, res) => {
  if (!fs.existsSync("data/cache/index.html")) {
    console.log("NO INDEX UH OH");
    try {
      var index = fs.readFileSync("./public/index.html", "utf8");
      if (!fs.existsSync("data/cache/list.html")) {
        console.log("NO POST LIST UH OH");
        renderer.renderPosts(fs);
      }
      index = index
        .replace(
          /\{\{ post-list \}\}/g,
          fs.readFileSync("data/cache/list.html", "utf8"),
        )
        .replace(/\{\{ title \}\}/g, "The Disconcerted Musings of Somebody");
      fs.writeFileSync("data/cache/index.html", index);
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal server error");
      return;
    }
  }
  res.sendFile(__dirname + "/data/cache/index.html");
});
app.get("/style.css", (req, res) =>
  res.sendFile(__dirname + "/public/style.css"),
);

app.get("/:name/:id", async (req, res) => {
  var target = config.dirs.filter((d) => d.name == req.params.name);
  if (target.length == 0) {
    res.status(404).send("Not found");
    return;
  }
  target = target[0];
  if (target.token != "undefined" && req.query.token != target.token) {
    res.status(401).send("Unauthorized");
    return;
  }
  const id = req.params.id;
  var outPath = safePath(`./data/cache/${target.name}/${id}.html`);
  if (!fs.existsSync(safePath(`./${target.path}/${id}.md`))) {
    res.status(404).send("Not found");
    return;
  }
  if (!fs.existsSync(outPath) && target.cache) {
    const success = await markdownUtils.render(
      safePath(`${target.path}/${id}.md`),
      outPath,
      id.substring(0, 1).toUpperCase() + id.substring(1),
      fs,
    );
    if (!success) {
      res.status(500).send("Internal server error");
      return;
    }
    res.sendFile(outPath);
  } else if (!target.cache) {
    var mdString = await markdownUtils.renderString(
      fs.readFileSync(safePath(`${target.path}/${id}.md`), "utf8"),
      id.substring(0, 1).toUpperCase() + id.substring(1),
      mdTemplate,
    );
    res.send(mdString);
  }
});

app.post("/update", express.json(), async (req, res) => {
  const requestToken = req.body.token;
  if (!superSecretToken || superSecretToken !== requestToken) {
    res.status(401).send({ status: "unauthorized" });
    return;
  }
  const target = git.filter((g) => g.name == req.body.name)[0];
  if (!target) {
    res.status(404).send({ status: "error", message: "Repository not found" });
    return;
  }

  try {
    var gitResponse = await updateUtils.git(
      target.sgi,
      target.branch,
      target.path,
      fs,
    );
    if (!gitResponse.success)
      res
        .status(500)
        .send({ status: "error", message: "Failed to update git" });
    try {
      try {
        await fs.unlinkSync("./data/cache/list.html");
      } catch (error) {
        console.log("No post list to delete");
      }
      try {
        await fs.unlinkSync("./data/cache/index.html");
      } catch (error) {
        console.log("No index to delete");
      }
      gitResponse.changedFiles.forEach((file) => {
        if (file.startsWith("finished/")) {
          const id = file.substring(9, file.length - 3);
          if (fs.existsSync(safePath(`./data/cache/${id}.html`))) {
            console.log(`removing cached file for ${id}`);
            fs.unlinkSync(safePath(`./data/cache/${id}.html`));
          }
        }
      });
    } catch (error) {
      console.error(error);
    }
    res.status(200).send({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ status: "error", error: error });
  }
});

async function main() {
  console.log("Starting server...");
  // console.log("\tSecret token is: ", secretToken);
  console.log("\tSuper secret token is: ", superSecretToken);
  if (!fs.existsSync("data")) {
    await fs.mkdirSync("data");
  }
  if (!fs.existsSync("data/cache")) {
    fs.mkdirSync("data/cache");
  }
  config.git.forEach((repo) => {
    git.push({
      name: repo.name,
      branch: repo.branch,
      path: repo.directory,
      sgi: require("simple-git")(repo.directory),
    });
  });
  config.dirs.forEach((dir) => {
    if (!fs.existsSync(`data/cache/${dir.name}`) && dir.cache) {
      return fs.mkdirSync(`data/cache/${dir.name}`);
    }
  });
  app.listen(port, () => {
    console.log(`\nServer running at http://localhost:${port}`);
  });
}

main();

function safePath(userInput) {
  const normalizedPath = path.normalize(userInput);
  const resolvedPath = path.resolve(__dirname, normalizedPath);

  // Check if the resolved path is within the base directory
  if (resolvedPath.startsWith(__dirname + "/data")) {
    return resolvedPath;
  } else {
    throw new Error("Path traversal attempt detected!");
  }
}
