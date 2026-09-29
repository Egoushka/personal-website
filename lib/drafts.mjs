// Where drafts and their evidence packs live (docs/writing/README.md).
// Always the main checkout's content/drafts/, whichever worktree runs the script:
// the folder is gitignored, and removing a worktree deletes its ignored files
// without a word, so a pack kept in a worktree dies with the branch. A post is
// corrected months after it ships, and the correction starts from its pack.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * content/drafts/ of the main checkout when `root` is the top of a linked
 * worktree; `root`'s own content/drafts/ otherwise — in the main checkout,
 * outside git, and in a tree below the top of a checkout, which is how the
 * tests run the scripts over fixtures.
 * @param {string} root
 */
export function draftsDir(root) {
  const own = path.join(root, "content", "drafts");
  const git = (/** @type {string[]} */ ...args) =>
    execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    if (fs.realpathSync(git("rev-parse", "--show-toplevel")) !== fs.realpathSync(root)) return own;
    const common = git("rev-parse", "--path-format=absolute", "--git-common-dir");
    // A bare repository or a separate git dir has no main checkout to point at.
    if (path.basename(common) !== ".git") return own;
    return path.join(path.dirname(common), "content", "drafts");
  } catch {
    return own;
  }
}
