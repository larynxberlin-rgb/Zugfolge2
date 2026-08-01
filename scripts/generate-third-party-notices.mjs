import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

const REPOSITORY_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const OUTPUT_PATH = path.join(
  REPOSITORY_ROOT,
  "public",
  "legal",
  "THIRD-PARTY-NOTICES.txt",
);

export const DISTRIBUTED_WEB_PACKAGES = Object.freeze([
  "react",
  "react-dom",
  "scheduler",
  "react-server-dom-webpack",
  "@vitejs/plugin-rsc",
  "tailwindcss",
  "vinext",
  "rolldown",
  "vite",
]);
export const LICENSE_TEXT_FALLBACKS = Object.freeze({
  "@vitejs/plugin-rsc": "@vitejs/plugin-react",
});

function normalizeText(value) {
  return value.replaceAll("\r\n", "\n").trimEnd();
}

export function normalizedTextSha256(value) {
  return createHash("sha256")
    .update(value.replaceAll("\r\n", "\n").replaceAll("\r", "\n"))
    .digest("hex")
    .toUpperCase();
}

async function findLicenseFile(packageDirectory, packageName, metadata) {
  const candidates = (await readdir(packageDirectory))
    .filter((name) => /^LICEN[CS]E(?:\..*)?$/i.test(name))
    .sort();
  if (candidates.length > 0) {
    return path.join(packageDirectory, candidates[0]);
  }

  const fallbackPackageName = LICENSE_TEXT_FALLBACKS[packageName];
  if (!fallbackPackageName) {
    throw new Error(`No license file found in ${packageDirectory}`);
  }
  const fallbackDirectory = path.join(
    REPOSITORY_ROOT,
    "node_modules",
    ...fallbackPackageName.split("/"),
  );
  const fallbackMetadata = JSON.parse(
    await readFile(path.join(fallbackDirectory, "package.json"), "utf8"),
  );
  if (fallbackMetadata.license !== metadata.license) {
    throw new Error(
      `${packageName} and ${fallbackPackageName} do not declare the same license`,
    );
  }
  if (
    fallbackMetadata.repository?.type !== metadata.repository?.type ||
    fallbackMetadata.repository?.url !== metadata.repository?.url
  ) {
    throw new Error(
      `${packageName} and ${fallbackPackageName} are not from the same repository`,
    );
  }
  return findLicenseFile(fallbackDirectory, fallbackPackageName, fallbackMetadata);
}

export async function generateThirdPartyNotices() {
  const lockSource = await readFile(
    path.join(REPOSITORY_ROOT, "pnpm-lock.yaml"),
    "utf8",
  );
  const lock = parseYaml(lockSource);
  const lockDigest = normalizedTextSha256(lockSource);
  const packages = [];
  const virtualStoreEntries = await readdir(
    path.join(REPOSITORY_ROOT, "node_modules", ".pnpm"),
  );

  for (const name of DISTRIBUTED_WEB_PACKAGES) {
    const lockKeyPrefix = `${name}@`;
    const lockedVersions = Object.keys(lock.packages ?? {})
      .filter((key) => key.startsWith(lockKeyPrefix))
      .map((key) => key.slice(lockKeyPrefix.length));
    if (lockedVersions.length !== 1) {
      throw new Error(
        `${name} must resolve to exactly one pnpm package version; found ${lockedVersions.join(", ")}`,
      );
    }
    const version = lockedVersions[0];
    const virtualPrefix = `${name.replace("/", "+")}@`;
    let packageDirectory;
    let metadata;
    for (const virtualEntry of virtualStoreEntries
      .filter((entry) => entry.startsWith(virtualPrefix))
      .sort()) {
      const candidateDirectory = path.join(
        REPOSITORY_ROOT,
        "node_modules",
        ".pnpm",
        virtualEntry,
        "node_modules",
        ...name.split("/"),
      );
      const candidateMetadata = await readFile(
        path.join(candidateDirectory, "package.json"),
        "utf8",
      )
        .then(JSON.parse)
        .catch((error) => {
          if (error?.code === "ENOENT") return null;
          throw error;
        });
      if (candidateMetadata?.name === name && candidateMetadata.version === version) {
        packageDirectory = candidateDirectory;
        metadata = candidateMetadata;
        break;
      }
    }
    if (!packageDirectory || !metadata) {
      throw new Error(`${name}@${version} is absent from the pnpm virtual store`);
    }
    if (metadata.name !== name) {
      throw new Error(`${name} resolved to unexpected package ${metadata.name}`);
    }
    const lockEntry = lock.packages?.[`${name}@${metadata.version}`];
    if (!lockEntry) {
      throw new Error(
        `${name}@${metadata.version} is absent from pnpm-lock.yaml`,
      );
    }
    if (!lockEntry.resolution?.integrity) {
      throw new Error(`${name}@${metadata.version} has no lockfile integrity`);
    }
    if (!metadata.license) {
      throw new Error(`${name}@${metadata.version} has no declared license`);
    }

    const licenseText = normalizeText(
      await readFile(
        await findLicenseFile(packageDirectory, name, metadata),
        "utf8",
      ),
    );
    packages.push({
      name,
      version: metadata.version,
      license: metadata.license,
      licenseText,
      digest: createHash("sha256").update(licenseText).digest("hex"),
    });
  }

  const groups = new Map();
  for (const entry of packages) {
    const group = groups.get(entry.digest) ?? {
      license: entry.license,
      licenseText: entry.licenseText,
      packages: [],
    };
    group.packages.push(`${entry.name}@${entry.version}`);
    groups.set(entry.digest, group);
  }

  const lines = [
    "Zugfolge web distribution — third-party notices",
    "================================================",
    "",
    "Generated by scripts/generate-third-party-notices.mjs from the exact",
    "pnpm-lock.yaml and installed license files. A declared same-repository",
    "fallback is used only when a package omits its repository license file.",
    "Do not edit by hand.",
    `pnpm-lock.yaml SHA-256: ${lockDigest}`,
    "",
    "The Zugfolge license matrix does not relicense these components. Each",
    "component remains subject to the license reproduced below.",
    "",
    "Reviewed distributed/build-output package set:",
    ...packages.map(
      ({ name, version, license }) => `- ${name}@${version} — ${license}`,
    ),
    "",
  ];

  for (const group of groups.values()) {
    lines.push(
      "----------------------------------------------------------------",
      `Packages: ${group.packages.join(", ")}`,
      `License: ${group.license}`,
      "",
      group.licenseText,
      "",
    );
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export async function checkThirdPartyNotices() {
  const expected = await generateThirdPartyNotices();
  const actual = await readFile(OUTPUT_PATH, "utf8").catch((error) => {
    if (error?.code === "ENOENT") return null;
    throw error;
  });
  if (actual !== expected) {
    throw new Error(
      "public/legal/THIRD-PARTY-NOTICES.txt is missing or stale; run " +
        "node scripts/generate-third-party-notices.mjs",
    );
  }
}

async function main() {
  if (process.argv.includes("--check")) {
    await checkThirdPartyNotices();
    return;
  }
  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, await generateThirdPartyNotices(), "utf8");
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}
