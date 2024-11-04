async function updateGitRepo(git) {
  try {
    await git.pull("origin", "blog");
    console.log("Git repo successfully updated");
    return true;
  } catch (err) {
    console.error("Failed to update git repo:", err);
    throw err;
    return false;
  }
}

module.exports = {
  git: updateGitRepo,
};
