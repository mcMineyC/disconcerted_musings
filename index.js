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
const mdTemplate = fs.readFileSync("./public/post_template.html", "utf8");
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
  if (!fs.existsSync(`data/cache/${config.mainIndex}/index.html`)) {
    // console.log("NO INDEX UH OH");
    renderer.renderIndex(config.mainIndex, config, "./public/index.html", fs);
  }
  res.sendFile(`${__dirname}/data/cache/${config.mainIndex}/index.html`);
});
app.get("/style.css", (req, res) => res.sendFile(__dirname + "/public/style.css"));
app.get("/card.css", (req, res) => res.sendFile(__dirname + "/public/card.css"));

app.get("/:name", (req, res) => {
  var name = req.params.name;
  var target = lookupByName(name);
  if (!target) {
    res.status(404).send(fancyError("Not found"));
    return;
  }
  if (!target.indexed) {
    res
      .status(401)
      .send(fancyError("Indexing not turned on for this endpoint"));
    return;
  }
  if (target.token != "undefined" && req.query.token != target.token) {
    //res.status(401).send(fancyError("Unauthorized"));
    res.status(401).sendFile(path.join(__dirname, "./public/token.html"));
    return;
  }
  if (target.raw == true) {
    // res.status(401).send("Unauthorized");
    res.send(
      renderer.renderFileIndexString(
        safePath(target.path),
        name,
        target.title || config.defaultTitle,
        "/" + target.name,
        "./public/index.html",
        fs,
      ),
    );
    return;
  }
  if (
    !fs.existsSync(`data/cache/${name}/index.html`) ||
    target.cache == false
  ) {
    // console.log("NO INDEX FOR", name, "UH OH");
    try {
      renderer.renderIndex(name, config, "./public/index.html", fs);
    } catch (e) {
      if (e == "dirNotFoundError") {
        console.log("You screwed something up in the config.");
        console.log(
          "Some help:\n\tDirname:",
          name,
          "\n\tRelevant entry:",
          target,
        );
        res.status(404).send(fancyError("Not found"));
        return;
      } else if (e == "dirNotSupposedToBeIndexedError") {
        res
          .status(401)
          .send(fancyError("Indexing not turned on for this endpoint"));
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

app.get("/:name/:id(*)", async (req, res) => {
  var target = lookupByName(req.params.name);
  if (!target) {
    res.status(404).send(fancyError("Not found"));
    return;
  }
  if (target.token != "undefined" && req.query.token != target.token) {
   //res.status(401).send(fancyError("Unauthorized"));
    res.status(401).sendFile(path.join(__dirname, "./public/token.html"));
    return;
  }
  const id = req.params.id;
  if (target.raw && target.raw == true) {
    // console.log("Target is raw files");
    const filePath = safePath(`./${target.path}/${id}`);
    // console.log("Trying", filePath);
    if (!fs.existsSync(filePath)) {
      res.status(404).send(fancyError("Not found"));
      return;
    }
    const stats = fs.statSync(filePath);
    if (stats.isDirectory() && target.indexed) {
      console.log("Sending sir index for", filePath);
      res.send(
        renderer.renderFileIndexString(
          safePath(filePath),
          target.name,
          target.title || config.defaultTitle,
          req.path,
          "./public/index.html",
          fs,
        ),
      );
    } else if (stats.isDirectory() && !target.indexed) {
      res.status(401).send(fancyError("Unauthorized"));
    } else {
      try {
        res.sendFile(filePath);
      } catch (e) {
        if (e.toString().includes("NotFoundError")) {
          res.status(404).send(fancyError("Not found"));
        } else {
          res.status(500).send(fancyError("Internal server error"));
        }
      }
    }
  } else {
    var outPath = safePath(`./data/cache/${target.name}/${id}.html`);
    if (!fs.existsSync(safePath(`./${target.path}/${id}.md`))) {
      res.status(404).send("Not found");
      return;
    }
    if (!fs.existsSync(outPath) && target.cache == true) {
      console.log("Rendering", id);
      const success = await markdownUtils.render(
        safePath(`${target.path}/${id}.md`),
        outPath,
        id.substring(0, 1).toUpperCase() + id.substring(1),
        target.name,
        mdTemplate,
        fs,
      );
      if (!success) {
        res.status(500).send("Internal server error");
        return;
      }
      res.sendFile(outPath);
    } else if (!target.cache) {
      console.log("Rendering", id);
      var mdString = await markdownUtils.renderString(
        fs.readFileSync(safePath(`${target.path}/${id}.md`), "utf8"),
        id.substring(0, 1).toUpperCase() + id.substring(1),
        "/" + target.name,
        mdTemplate,
      );
      res.send(mdString);
    } else {
      res.sendFile(outPath);
      console.log("Sending", target.name+"/"+id);
    }
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
  // var dirTargets
  var dirTargets = config.dirs.filter(
    (d) =>
      (d.raw == false || d.indexed == true) && d.path.includes(target.path),
  );
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
          if (file.endsWith(".md")) {
            console.log(`checking for cached file for ${id}`);
            dirTargets.forEach((dt) => {
              if (
                fs.existsSync(safePath(`./data/cache/${dt.name}/${id}.html`))
              ) {
                console.log(`removing cached file for ${id} from ${dt.name}`);
                fs.unlinkSync(safePath(`./data/cache/${dt.name}/${id}.html`));
              }
            });
          }
        });
        dirTargets.forEach((dir) => {
          if (dir.cache == true || (dir.indexed == true && dir.raw == false)) {
            console.log("Purging cached indexes for", dir.name);
            try {
              fs.unlinkSync(`./data/cache/${dir.name}/list.html`);
              console.log("\tRemoved list.html for", dir.name);
            } catch (error) {
              console.log("\tNo post list to delete");
            }
            try {
              fs.unlinkSync(`./data/cache/${dir.name}/index.html`);
              console.log("\tRemoved index.html for", dir.name);
            } catch (error) {
              console.log("\tNo index to delete");
            }
          }
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

app.post("/clearCache", express.json(), async (req, res) => {
  const requestToken = req.body.token;
  if (!superSecretToken || superSecretToken !== requestToken) {
    res.status(401).send({ status: "unauthorized" });
    return;
  }
  var dirTargets = config.dirs.map((d) => d.name);
  console.log("Clearing", dirTargets.length, "directories");
  dirTargets.forEach((dir) => {
    try {
      deleteContainedFiles(safePath(__dirname + "/data/cache/" + dir));
    } catch (e) {
      if (e.toString().includes("ENOENT")) {
        console.log("No cache to clear for", dir);
      } else {
        console.log("Error clearing cache for", dir, e);
      }
    }
  });
  res.send({ status: "success" });
});

async function main() {
  console.log("Starting server...");
  console.log("\tSuper secret token is: ", superSecretToken);
  if (!fs.existsSync("data")) {
    console.log("\tCreating data directory");
    await fs.mkdirSync("data");
    console.log("Make sure your repos are setup before you run this again");
    return;
  }
  if (!fs.existsSync("data/cache")) {
    console.log("\tCreating cache directory");
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
    if (
      !fs.existsSync(`data/cache/${dir.name}`) &&
      (dir.cache == true || dir.indexed == true)
    ) {
      fs.mkdirSync(`data/cache/${dir.name}`);
      console.log("\tCreated cache dir for", dir.name);
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

function lookupByName(name) {
  return config.dirs.filter((d) => d.name == name)[0];
}
function lookupByPath(path) {
  return config.dirs.filter((d) => d.path.includes(path.toString()))[0];
}
function fancyError(text) {
  return `<center><h1>${text}</h1></center>`;
}
function deleteContainedFiles(path) {
  const files = fs.readdirSync(path);
  for (const file of files) {
    const filePath = `${path}/${file}`;
    if (fs.statSync(filePath).isDirectory()) {
      console.log(`Deleting directory ${filePath}`);
      deleteContainedFiles(filePath);
    } else {
      console.log(`Deleting file ${filePath}`);
      fs.unlinkSync(filePath);
    }
  }
}
