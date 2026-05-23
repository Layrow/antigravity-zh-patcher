import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { apps, resources } from "./paths.js";

function plistValue(plist, key) {
  return execFileSync("/usr/libexec/PlistBuddy", ["-c", `Print :${key}`, plist], {
    encoding: "utf8"
  }).trim();
}

function appInfo(appPath) {
  const plist = `${appPath}/Contents/Info.plist`;
  if (!fs.existsSync(plist)) {
    return null;
  }

  return {
    path: appPath,
    name: plistValue(plist, "CFBundleName"),
    id: plistValue(plist, "CFBundleIdentifier"),
    version: plistValue(plist, "CFBundleShortVersionString"),
    executable: plistValue(plist, "CFBundleExecutable")
  };
}

const antigravity = appInfo(apps.antigravity);
const ide = appInfo(apps.ide);

console.log("Antigravity 汉化探测结果");
console.log("");
console.log(JSON.stringify({ antigravity, ide }, null, 2));
console.log("");
console.log("关键资源：");
for (const [key, value] of Object.entries(resources)) {
  console.log(`- ${key}: ${fs.existsSync(value) ? "FOUND" : "MISSING"} ${value}`);
}

if (fs.existsSync(resources.ideNlsMessages)) {
  const messages = JSON.parse(fs.readFileSync(resources.ideNlsMessages, "utf8"));
  console.log(`- IDE NLS messages: ${Array.isArray(messages) ? messages.length : "unknown"} 条`);
}

