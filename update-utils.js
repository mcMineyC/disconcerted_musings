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
    // console.log(err);
    if (
      e.git != undefined &&
      e.git.message == "Exiting because of an unresolved conflict."
    ) {
      console.log("Change conflict. Attempting to fix");
      await git.reset("hard");
      return {
        success: false,
        needsRunAgain: true,
      };
    } else if (
      err
        .toString()
        .indexOf(
          "The following untracked working tree files would be overwritten by merge:",
        ) != -1
    ) {
      console.log("Removing untracked files");
      const regex =
        /error: The following untracked working tree files would be overwritten by merge:\n([\s*\S.*]*)\nPlease move or remove them before you merge./gm;
      const match = err.toString().match(regex);
      if (match) {
        const files = match[1].split("\n").map((f) => f.trim());
        files.forEach((file) => {
          if (fs.existsSync(path + "/" + file)) {
            if (fs.lstatSync(path + "/" + file).isDirectory()) {
              deleteFolderRecursive(path + "/" + file, fs);
            } else {
              fs.unlinkSync(path + "/" + file);
            }
          }
        });
      }
      // await git.stash();
      return {
        success: false,
        needsRunAgain: true,
      };
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
