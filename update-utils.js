async function updateGitRepo(git, branch = "blog", path, fs) {
  try {
    const pull = await git.pull("origin", branch);
    console.log("Git repo successfully updated");
    changedFiles = [];
    try {
      const summary = await git.diffSummary(["HEAD@{1}", "HEAD"]);
      changedFiles = summary.files.map((file) => file.file);
      console.log(changedFiles.length, "file(s) changed");
    } catch (err) {
      // Shut up
    }
    return {
      success: true,
      changedFiles,
    };
  } catch (err) {
    var e = JSON.parse(JSON.stringify(err, null, 2));
    if (
      e.git != undefined &&
      e.git.message == "Exiting because of an unresolved conflict."
    ) {
      console.log("Change conflict. Attempting to fix");
      git.reset("hard");
      updateGitRepo(git, branch, path, fs);
    } else {
      console.log("Failed to update git repo", err);
      throw err;
    }
  }
}

function deleteFolderRecursive(path, fs) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach((file) => {
      const curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}
module.exports = {
  git: updateGitRepo,
};
