import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { backupRoot, resources, workspaceRoot } from "./paths.js";
import { backupFile, ensureDir, readJson } from "./fs-utils.js";

const languagePackId = "MS-CEINTL.vscode-language-pack-zh-hans";
const locale = "zh-cn";

function findLanguagePackDir() {
  if (!fs.existsSync(resources.ideExtensions)) {
    return null;
  }

  return fs
    .readdirSync(resources.ideExtensions, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name.toLowerCase().startsWith("ms-ceintl.vscode-language-pack-zh-hans-"))
    .sort()
    .reverse()
    .map((name) => path.join(resources.ideExtensions, name))
    .find((dir) => fs.existsSync(path.join(dir, "package.json"))) ?? null;
}

function setLocaleArgv() {
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
  console.log(`已设置 IDE 显示语言为 ${locale}。`);
}

function collectLanguagePackTranslations(languagePackDir) {
  const pkg = readJson(path.join(languagePackDir, "package.json"));
  const localization = pkg.contributes?.localizations?.find((item) => item.languageId === locale);
  if (!localization) {
    throw new Error(`语言包中没有找到 ${locale} 本地化配置: ${languagePackDir}`);
  }

  const translations = {};
  for (const item of localization.translations ?? []) {
    translations[item.id] = path.resolve(languagePackDir, item.path);
  }

  if (!translations.vscode || !fs.existsSync(translations.vscode)) {
    throw new Error(`语言包缺少 vscode 主翻译文件: ${languagePackDir}`);
  }

  return { pkg, translations };
}

function mergeMainTranslations(mainTranslationPath) {
  const main = readJson(mainTranslationPath);
  const overrides = readJson(path.join(workspaceRoot, "translations/antigravity-ide-overrides.zh-CN.json"));
  const contents = { ...main.contents };

  for (const [moduleName, moduleOverrides] of Object.entries(overrides)) {
    contents[moduleName] = {
      ...(contents[moduleName] ?? {}),
      ...moduleOverrides
    };
  }

  return {
    ...main,
    contents
  };
}

function buildNlsMessages(mergedMain) {
  const keys = readJson(resources.ideNlsKeys);
  const defaultMessages = readJson(resources.ideNlsMessages);
  const messages = [];
  let index = 0;
  let translated = 0;

  for (const [moduleName, moduleKeys] of keys) {
    const moduleTranslations = mergedMain.contents[moduleName];
    for (const key of moduleKeys) {
      const translatedMessage = moduleTranslations?.[key];
      if (typeof translatedMessage === "string") {
        messages.push(translatedMessage);
        translated += 1;
      } else {
        messages.push(defaultMessages[index]);
      }
      index += 1;
    }
  }

  return { messages, translated, total: defaultMessages.length };
}

function writeLanguagePackConfig(languagePackDir) {
  if (!fs.existsSync(resources.ideProduct)) {
    throw new Error(`Antigravity IDE product.json not found: ${resources.ideProduct}`);
  }

  const { pkg, translations } = collectLanguagePackTranslations(languagePackDir);
  const mergedMain = mergeMainTranslations(translations.vscode);
  ensureDir(resources.ideZhGenerated);

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({
      languagePackVersion: pkg.version,
      product: readJson(resources.ideProduct).commit,
      overrides: mergedMain.contents
    }))
    .digest("hex")
    .slice(0, 12);
  const generatedMain = path.join(resources.ideZhGenerated, `main.${hash}.i18n.json`);
  fs.writeFileSync(generatedMain, `${JSON.stringify(mergedMain, null, 2)}\n`);

  const translationConfig = {
    ...translations,
    vscode: generatedMain
  };
  const languagePacks = {
    [locale]: {
      hash,
      extensions: [
        {
          extensionIdentifier: {
            id: languagePackId.toLowerCase()
          },
          version: pkg.version
        }
      ],
      translations: translationConfig
    }
  };

  if (fs.existsSync(resources.ideLanguagePacks)) {
    const backup = backupFile(resources.ideLanguagePacks, backupRoot, "ide-languagepacks.json");
    console.log(`已备份 languagepacks.json: ${backup}`);
  }
  fs.writeFileSync(resources.ideLanguagePacks, `${JSON.stringify(languagePacks, null, 2)}\n`);

  const product = readJson(resources.ideProduct);
  const cacheDir = path.join(resources.ideUserData, "clp", `${hash}.${locale}`, product.commit);
  ensureDir(cacheDir);
  const { messages, translated, total } = buildNlsMessages(mergedMain);
  fs.writeFileSync(path.join(cacheDir, "nls.messages.json"), JSON.stringify(messages), "utf8");
  fs.writeFileSync(path.join(path.dirname(cacheDir), "tcf.json"), JSON.stringify(translationConfig), "utf8");

  console.log(`已生成 IDE 中文主翻译: ${generatedMain}`);
  console.log(`已写入 IDE 语言包配置: ${resources.ideLanguagePacks}`);
  console.log(`已预生成 NLS 缓存: ${path.join(cacheDir, "nls.messages.json")}`);
  console.log(`NLS 覆盖：${translated}/${total}`);
}

ensureDir(backupRoot);
ensureDir(resources.ideUserData);

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

const languagePackDir = findLanguagePackDir();
if (!languagePackDir) {
  throw new Error(`中文语言包目录未找到: ${resources.ideExtensions}`);
}

setLocaleArgv();
writeLanguagePackConfig(languagePackDir);
console.log("请完全退出并重新打开 Antigravity IDE 后验证。");
