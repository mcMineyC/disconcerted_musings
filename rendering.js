const { markdownUtils } = require("./markdown-utils");
function renderPosts(fs) {
  const posts = fs.readdirSync("./data/src/finished");
  posts.forEach((post) => {
    console.log(`Rendering ${post}`);
  });
  fs.writeFileSync("./data/cache/list.html", "List of posts");
}
export const renderer = {
  renderPosts: renderPosts,
};
