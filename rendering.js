var postHtmlTemplate = `
    <div class="post-block">
      <a href="/{{ name }}/{{ id }}" style="display: flex; justify-content: space-between; align-items: center;">
        <h2>{{ title }}</h2>
        <p>{{ modified }}</p>
      </a>
    </div>
  `;
function renderList(dirname, path, fs) {
  console.log("Posts updating");
  const posts = fs.readdirSync(path);
  var plist = [];
  var htmlTemplate = postHtmlTemplate;
  posts
    .filter((p) => p.substring(0, 1) != ".")
    .forEach((post) => {
      console.log('"' + post + '"');
      var id = post.split(".")[0];
      var created = fs.statSync(`${path}/${post}`).mtime;
      let prettyTitle = id.substring(0, 1).toUpperCase() + id.substring(1);
      if (id.match(/^(\d{1,2})-(\d{1,2})-(\d{2}|\d{4})$/)) {
        prettyTitle = "Somebody's Daily Note: " + prettyTitle;
      }
      var modifiedDate = new Date(
        created.getTime() - created.getTimezoneOffset() * 60000,
      );
      plist.push({
        id: id,
        title: prettyTitle,
        modified: modifiedDate,
      });
    });
  plist.sort((a, b) => b.modified - a.modified);
  plist = plist.map((post) => {
    return htmlTemplate
      .replace(/\{\{ id \}\}/g, post.id)
      .replace(/\{\{ title \}\}/g, post.title)
      .replace(
        /\{\{ modified \}\}/g,
        post.modified.getMonth() +
          1 +
          "-" +
          post.modified.getDate() +
          "-" +
          post.modified.getFullYear(),
      )
      .replace(/\{\{ name \}\}/g, dirname);
  });
  plist = plist.join("\n");
  fs.writeFileSync(`./data/cache/${dirname}/list.html`, plist);
}

function renderIndex(name, config, templatePath, fs) {
  var dirr = { name: "nullisfalseandyoucanttellmeotherwise12345!" };
  for (var x = 0; x < config.dirs.length; x++) {
    if (config.dirs[x].name == name) {
      console.log("Found dir");
      dirr = config.dirs[x];
    }
  }
  const dirname = dirr.name;
  if (dirr.name == "nullisfalseandyoucanttellmeotherwise12345!") {
    console.log("NO DIR FOUND");
    throw "dirNotFoundError";
  }
  if (!dirr.indexed) {
    throw "dirNotSupposedToBeIndexedError";
  }
  var index = fs.readFileSync(templatePath, "utf8");
  if (!fs.existsSync(`data/cache/${name}/list.html`)) {
    console.log("NO POST LIST UH OH");
    renderList(dirname, dirr.path, fs);
  }
  index = index
    .replace(
      /\{\{ post-list \}\}/g,
      fs.readFileSync(`data/cache/${name}/list.html`, "utf8"),
    )
    .replace(/\{\{ title \}\}/g, dirr.title || config.defaultTitle);
  fs.writeFileSync(`data/cache/${name}/index.html`, index);
}

function renderFileIndexString(
  dirPath,
  dirname,
  title,
  currentPath,
  templatePath,
  fs,
) {
  var index = fs.readFileSync(templatePath, "utf8");
  const posts = fs.readdirSync(dirPath);
  var plist = [];
  var htmlTemplate = postHtmlTemplate.replace(
    /\/\{\{ name \}\}\/\{\{ id \}\}/g,
    "/{{ id }}",
  );

  // Add parent directory entry
  if (currentPath.split("/").slice(1).pop() != dirname)
    plist.push({
      id: currentPath.split("/").slice(1, -1).join("/"),
      title: "..",
      modified: new Date(),
    });

  posts.forEach((file) => {
    var created = fs.statSync(`${dirPath}/${file}`).mtime;
    var modifiedDate = new Date(
      created.getTime() - created.getTimezoneOffset() * 60000,
    );
    plist.push({
      id: currentPath.substring(1) + "/" + file,
      title: file,
      modified: modifiedDate,
    });
  });
  plist.sort((a, b) => b.modified - a.modified);
  plist = plist.map((post) => {
    return htmlTemplate
      .replace(/\{\{ id \}\}/g, post.id)
      .replace(/\{\{ title \}\}/g, post.title)
      .replace(
        /\{\{ modified \}\}/g,
        post.modified.getMonth() +
          1 +
          "-" +
          post.modified.getDate() +
          "-" +
          post.modified.getFullYear(),
      )
      .replace(/\{\{ name \}\}/g, dirname);
  });
  plist = plist.join("\n");
  index = index
    .replace(/\{\{ post-list \}\}/g, plist)
    .replace(/\{\{ title \}\}/g, title);
  return index;
}

module.exports = {
  renderIndex: renderIndex,
  renderList: renderList,
  renderFileIndexString: renderFileIndexString,
};

/*

<style>
  .post-block a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
  }
  .post-block h2 {
    margin: 0;
  }
</style>
<div class="post-block">
      <a href="/post/test">
        <h2>Test</h2>
        <span>10-31-2024</span>
      </a>
    </div>

*/
