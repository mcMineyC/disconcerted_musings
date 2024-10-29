async function updateGitRepo(require) {
  const gitDirectory = "./data/src";
  const git = require("simple-git")(gitDirectory);
  try {
    await git.pull("origin", "blog");
    console.log("Git repo successfully updated");
    return true;
  } catch (err) {
    console.error("Failed to update git repo:", err);
    return false;
  }
}

export const updateUtils = {
  git: updateGitRepo,
};
