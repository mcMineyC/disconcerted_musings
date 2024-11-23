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
  if (!fs.existsSync("data/cache/post/index.html") || true) {
    console.log("NO INDEX UH OH");
    renderer.renderIndex("post", config, "./public/index.html", fs);
  }
  res.sendFile(__dirname + "/data/cache/post/index.html");
});
app.get("/style.css", (req, res) =>
  res.sendFile(__dirname + "/public/style.css"),
);
app.get("/:name", (req, res) => {
  var name = req.params.name;
  if (!fs.existsSync(`data/cache/${name}/index.html`) || true) {
    console.log("NO INDEX FOR", name, "UH OH");
    try {
      renderer.renderIndex(name, config, "./public/index.html", fs);
    } catch (e) {
      if (e == "dirNotFoundError") {
        res.status(404).send("<center><h1>Not found</h1></center>");
        return;
      } else if (e == "dirNotSupposedToBeIndexedError") {
        res
          .status(401)
          .send(
            "<center><h1>Indexing not turned on for this endpoint</h1></center>",
          );
        return;
      }
      res
        .status(500)
        .send(
          "<center><h1>Internal server error</h1><p>" + e + "</p></center>",
        );
    }
  }
  console.log("Sending index for", name, "to client");
  res.sendFile(__dirname + `/data/cache/${name}/index.html`);
});

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
  if (!req.body.name || target == undefined) {
    res.status(500).send({
      status: "error",
      message: "Repository name not provided or incorrect",
    });
    return;
  }
  const dirTargets = config.dirs.filter((d) => d.path.includes(target.path));
  if (dirTargets.length == 0) dirTargets = null;
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
    if (gitResponse.success == false && gitResponse.needsRunAgain == true) {
      console.log("Rerunning");
      gitResponse = await updateUtils.git(
        target.sgi,
        target.branch,
        target.path,
        fs,
      );
    }
    if (!gitResponse.success) {
      res
        .status(500)
        .send({ status: "error", message: "Failed to update git" });
      return;
    }
    try {
      if (dirTargets != null) {
        gitResponse.changedFiles.forEach((file) => {
          const id = file.split("/").pop().split(".")[0];
          if (!file.startsWith())
            console.log(`checking for cached file for ${id}`);
          dirTargets.forEach((dt) => {
            if (fs.existsSync(safePath(`./data/cache/${dt.name}/${id}.html`))) {
              console.log(`removing cached file for ${id} from ${dt.name}`);
              fs.unlinkSync(safePath(`./data/cache/${dt.name}/${id}.html`));
            }
            try {
              fs.unlinkSync(`./data/cache/${dt.name}/list.html`);
            } catch (error) {
              console.log("No post list to delete");
            }
            try {
              fs.unlinkSync(`./data/cache/${dt.name}/index.html`);
            } catch (error) {
              console.log("No index to delete");
            }
          });
        });
      }
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
