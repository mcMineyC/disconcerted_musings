async function updateGitRepo(git) {
  try {
    const pull = await git.pull("origin", "blog");
    console.log("Git repo successfully updated");

    // Get the modified files from the pull result
    const summary = await git.diffSummary(["HEAD@{1}", "HEAD"]);
    const changedFiles = summary.files.map((file) => file.file);

    return {
      success: true,
      changedFiles,
    };
  } catch (err) {
    console.error("Failed to update git repo:", err);
    throw err;
  }
}

module.exports = {
  git: updateGitRepo,
};
