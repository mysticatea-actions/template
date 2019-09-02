import { execSync } from "child_process"
import { sync as rimraf } from "rimraf"
import { version } from "../package.json"

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
process.chdir("./dist")
sh("git init")
sh(`git remote add origin "${origin}"`)
sh("git add .")
sh(`git commit -m "${commitMessage}"`)
if (isStable && ok(`git fetch origin "${vNBranch}"`)) {
    // Push it after the current vN branch if this is stable.
    sh(`git checkout "${vNBranch}"`)
    rimraf("*")
    sh("git checkout master -- .")
    sh("git add .")
    sh(`git commit -m "${commitMessage}"`)
} else {
    // Push it as an orphan commit if this is beta.
    sh(`git checkout -b "${vNBranch}"`)
}
sh(`git tag "v${version}"`)
sh(`git push origin "${vNBranch}" "v${version}"`)

// Clean
rimraf(".git")
process.chdir("..")
sh("git pull")
