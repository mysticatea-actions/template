import { execSync } from "child_process"
import { sync as rm } from "rimraf"
import { version } from "../package.json"

const cd = process.chdir
const sh = (command: string) => {
    console.log("$", command)
    const stdout = execSync(command, {
        encoding: "utf8",
        stdio: ["inherit", "pipe", "inherit"],
    }).trim()
    console.log(stdout)
    return stdout
}
const ok = (command: string) => {
    try {
        sh(command)
        return true
    } catch {
        return false
    }
}

const origin = sh("git remote get-url origin")
const sha1 = sh('git log -1 --format="%h"')
const commitMessage = `🔖 ${version} (built with ${sha1})`
const isStable = /^\d+\.\d+\.\d+$/u.test(version)
const vNBranch = `v${version.split(".")[0]}`

// Delete the tag `npm version` created to use it for the release commit.
sh(`git tag -d "v${version}"`)

// Make the release commit that contains only `dist` directory.
cd("./dist")
sh("git init")
sh(`git remote add origin "${origin}"`)
sh("git add .")
sh(`git commit -m "${commitMessage}"`)
// Push the release to the vN branch (e.g., `v0`, `v1`, ...) if stable.
if (isStable) {
    if (ok(`git fetch origin "${vNBranch}"`)) {
        sh(`git checkout "${vNBranch}"`)
        rm("*")
        sh("git checkout master -- .")
        sh("git add .")
        sh(`git commit -m "${commitMessage}"`)
    } else {
        sh(`git checkout -b "${vNBranch}"`)
    }
    sh(`git push origin "${vNBranch}"`)
}
// Push the release tag.
sh(`git tag "v${version}"`)
sh(`git push origin "v${version}"`)

// Clean
rm(".git")
cd("..")
sh("git pull")
