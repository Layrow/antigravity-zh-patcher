import fs from "node:fs";
import { backupRoot, resources } from "./paths.js";
import { copyFileWithDirs, latestBackup } from "./fs-utils.js";

const restoreTargets = [
  ["antigravity-app.asar", resources.antigravityAsar],
  ["ide-argv.json", resources.ideUserArgv],
  ["ide-nls.messages.json", resources.ideNlsMessages]
];

let restored = 0;
for (const [label, target] of restoreTargets) {
  const backup = latestBackup(backupRoot, label);
  if (!backup) {
    continue;
  }

  copyFileWithDirs(backup, target);
  console.log(`已恢复 ${target} <- ${backup}`);
  restored += 1;
}

if (restored === 0) {
  console.log("没有找到可恢复的备份。");
}
