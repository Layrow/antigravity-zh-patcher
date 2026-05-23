import os from "node:os";
import path from "node:path";

export const workspaceRoot = path.resolve(new URL("..", import.meta.url).pathname);

export const apps = {
  antigravity: "/Applications/Antigravity.app",
  ide: "/Applications/Antigravity IDE.app"
};

export const resources = {
  antigravityAsar: path.join(apps.antigravity, "Contents/Resources/app.asar"),
  ideNlsMessages: path.join(apps.ide, "Contents/Resources/app/out/nls.messages.json"),
  ideNlsKeys: path.join(apps.ide, "Contents/Resources/app/out/nls.keys.json"),
  ideCli: path.join(apps.ide, "Contents/Resources/app/bin/antigravity-ide"),
  ideUserArgv: path.join(os.homedir(), ".antigravity-ide/argv.json"),
  ideExtensions: path.join(os.homedir(), ".antigravity-ide/extensions")
};

export const backupRoot = path.join(workspaceRoot, "backups");

