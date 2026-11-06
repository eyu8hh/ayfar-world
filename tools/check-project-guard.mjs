#!/usr/bin/env node
/**
 * AYFAR WORLD repository guard.
 * No dependencies; run with Node.js 20+.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const errors = [];
const read = (path) => readFileSync(resolve(root, path), "utf8");

function requireMatch(value, pattern, message) {
  const match = value.match(pattern);
  if (!match) errors.push(message);
  return match;
}

const statePath = "docs/STATE.md";
const configPath = "js/supabase-config.js";
const setupPath = "supabase/AI-QUIZ-SETUP.md";

for (const path of [statePath, configPath, setupPath, "manifest.json"]) {
  if (!existsSync(join(root, path))) errors.push(`Required file is missing: ${path}`);
}

if (errors.length === 0) {
  const state = read(statePath);
  const config = read(configPath);
  const setup = read(setupPath);
  const manifest = JSON.parse(read("manifest.json"));

  const expected = requireMatch(
    state,
    /Supabase project ref \(repository-configured\): `([a-z0-9]{20})`/,
    "Could not read the 20-character repository-configured Supabase ref from docs/STATE.md."
  )?.[1];

  const runtimeRef = requireMatch(
    config,
    /url:\s*["']https:\/\/([a-z0-9-]+)\.supabase\.co["']/,
    "Could not read the Supabase project ref from js/supabase-config.js."
  )?.[1];

  const setupRef = requireMatch(
    setup,
    /supabase link --project-ref\s+([a-z0-9-]+)/,
    "Could not read the Supabase project ref from supabase/AI-QUIZ-SETUP.md."
  )?.[1];

  if (expected && runtimeRef && expected !== runtimeRef) {
    errors.push(`Supabase ref mismatch: docs/STATE.md says ${expected}, runtime config says ${runtimeRef}.`);
  }
  if (expected && setupRef && expected !== setupRef) {
    errors.push(`Supabase ref mismatch: docs/STATE.md says ${expected}, setup guide says ${setupRef}.`);
  }

  const iconPath = manifest?.icons?.[0]?.src;
  if (typeof iconPath !== "string" || !iconPath) {
    errors.push("manifest.json does not define a first PWA icon path.");
  } else if (!existsSync(resolve(root, iconPath))) {
    errors.push(`PWA manifest icon does not exist: ${iconPath}`);
  }
}

let trackedFiles = [];
try {
  trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
} catch {
  errors.push("Could not enumerate tracked files. Run this guard inside a Git checkout.");
}

const secretPatterns = [
  { name: "private-key PEM block", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "GitHub access token", regex: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b/ },
  { name: "OpenAI API key", regex: /\bsk-(?:proj-|svcacct-|live-)?[A-Za-z0-9_-]{32,}\b/ },
  { name: "Supabase secret API key", regex: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/ },
  { name: "AWS access key ID", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    name: "possible Supabase service-role credential assignment",
    regex: /(?:SUPABASE_SERVICE_ROLE_KEY|service_role_key)\s*[:=]\s*["'`][A-Za-z0-9._-]{80,}["'`]/i
  }
];

for (const path of trackedFiles) {
  if (/^\.env(?:$|\.)/.test(path) && !/^\.env\.(?:example|sample|template)$/.test(path)) {
    errors.push(`Potential environment file is tracked: ${path}`);
    continue;
  }

  let content;
  try {
    const bytes = readFileSync(resolve(root, path));
    if (bytes.includes(0)) continue; // Skip binary assets.
    content = bytes.toString("utf8");
  } catch {
    continue;
  }

  for (const rule of secretPatterns) {
    if (rule.regex.test(content)) {
      errors.push(`Possible ${rule.name} detected in tracked file: ${path}`);
    }
  }
}

if (errors.length) {
  console.error("AYFAR project guard failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("AYFAR project guard passed.");
  console.log("- Repository-configured Supabase refs are consistent.");
  console.log("- PWA manifest icon exists.");
  console.log(`- Scanned ${trackedFiles.length} tracked files for high-confidence credential patterns.`);
}
