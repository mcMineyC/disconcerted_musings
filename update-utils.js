async function updateGitRepo(git, branch = "blog") {
  try {
    const pull = await git.pull("origin", branch);
    console.log("Git repo successfully updated");

    // Get the modified files from the pull result
    const summary = await git.diffSummary(["HEAD@{1}", "HEAD"]);
    const changedFiles = summary.files.map((file) => file.file);
    console.log(
      changedFiles.filter((file) => file.startsWith("finished/")).length,
      "file(s) changed",
    );

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
