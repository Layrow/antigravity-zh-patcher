import os from "node:os";
import path from "node:path";

export const workspaceRoot = path.resolve(new URL("..", import.meta.url).pathname);

export const apps = {
  antigravity: "/Applications/Antigravity.app",
  ide: "/Applications/Antigravity IDE.app"
};

export const resources = {
  antigravityAsar: path.join(apps.antigravity, "Contents/Resources/app.asar"),
  ideProduct: path.join(apps.ide, "Contents/Resources/app/product.json"),
  ideNlsMessages: path.join(apps.ide, "Contents/Resources/app/out/nls.messages.json"),
  ideNlsKeys: path.join(apps.ide, "Contents/Resources/app/out/nls.keys.json"),
  ideCli: path.join(apps.ide, "Contents/Resources/app/bin/antigravity-ide"),
  ideUserArgv: path.join(os.homedir(), ".antigravity-ide/argv.json"),
  ideUserData: path.join(os.homedir(), ".antigravity-ide"),
  ideExtensions: path.join(os.homedir(), ".antigravity-ide/extensions"),
  ideLanguagePacks: path.join(os.homedir(), ".antigravity-ide/languagepacks.json"),
  ideZhGenerated: path.join(os.homedir(), ".antigravity-ide/antigravity-zh")
};

export const backupRoot = path.join(workspaceRoot, "backups");
