import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { backupRoot, resources } from "./paths.js";
import { backupFile, ensureDir } from "./fs-utils.js";

const languagePackId = "MS-CEINTL.vscode-language-pack-zh-hans";
const locale = "zh-cn";

ensureDir(backupRoot);

if (!fs.existsSync(resources.ideCli)) {
  throw new Error(`Antigravity IDE CLI not found: ${resources.ideCli}`);
}

console.log("检查中文语言包...");
const installed = execFileSync(resources.ideCli, ["--list-extensions"], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"]
}).toLowerCase();

if (!installed.includes(languagePackId.toLowerCase())) {
  console.log("安装中文语言包...");
  execFileSync(resources.ideCli, ["--install-extension", languagePackId, "--force"], {
    stdio: "inherit"
  });
} else {
  console.log("中文语言包已安装。");
}

if (fs.existsSync(resources.ideUserArgv)) {
  const backup = backupFile(resources.ideUserArgv, backupRoot, "ide-argv.json");
  console.log(`已备份 argv.json: ${backup}`);
}

const original = fs.existsSync(resources.ideUserArgv)
  ? fs.readFileSync(resources.ideUserArgv, "utf8")
  : "{\n}\n";

let next = original;
if (/"locale"\s*:/.test(next)) {
  next = next.replace(/"locale"\s*:\s*"[^"]*"/, `"locale": "${locale}"`);
} else {
  next = next.replace(/\{/, `{\n\t"locale": "${locale}",`);
}

fs.writeFileSync(resources.ideUserArgv, next);
console.log(`已设置 IDE 显示语言为 ${locale}。重启 Antigravity IDE 后生效。`);

