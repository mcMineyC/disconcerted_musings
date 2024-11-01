function renderPosts(fs) {
  const posts = fs.readdirSync("./data/src/finished");
  var htmlTemplate = `
    <div class="post-block">
      <a href="/post/{{ id }}" style="display: flex; justify-content: space-between; align-items: center;">
        <h2>{{ title }}</h2>
        <p>{{ modified }}</p>
      </a>
    </div>
  `;
  var plist = [];
  posts.forEach((post) => {
    var id = post.split(".")[0];
    var created = fs.statSync(`./data/src/finished/${post}`).mtime;
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
      );
  });
  plist = plist.join("\n");
  fs.writeFileSync("./data/cache/list.html", plist);
}
export const renderer = {
  renderPosts: renderPosts,
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
