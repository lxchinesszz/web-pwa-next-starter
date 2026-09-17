/**
 * Upload a static Web/PWA build directly to 100-ai-apps on UPYUN.
 * Usage: node scripts/youpai-sync.mjs <localDir> </kebab-case-appSlug/>
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { appConfig } from "../app.config.ts";

export const service = "100-ai-apps";
export const origin = "https://apps.springlearn.cn";
export const keychainServices = {
    operator: "100-ai-apps-upyun-operator",
    password: "100-ai-apps-upyun-password",
};

const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".wasm": "application/wasm",
    ".webmanifest": "application/manifest+json",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".xml": "application/xml; charset=utf-8",
};

const md5 = (data) => createHash("md5").update(data).digest("hex");

export function readKeychainCredential(
    serviceName,
    {
        platform = process.platform,
        username = os.userInfo().username,
        execute = execFileSync,
    } = {},
) {
    if (platform !== "darwin") {
        return undefined;
    }

    try {
        const value = execute(
            "security",
            ["find-generic-password", "-a", username, "-s", serviceName, "-w"],
            {
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"],
            },
        ).trim();
        return value || undefined;
    } catch {
        return undefined;
    }
}

export function resolveCredentials(
    environment = process.env,
    {
        platform = process.platform,
        username = os.userInfo().username,
        readCredential = (serviceName) =>
            readKeychainCredential(serviceName, { platform, username }),
    } = {},
) {
    const operator =
        environment.UPYUN_OPERATOR ||
        (platform === "darwin" ? readCredential(keychainServices.operator) : undefined);
    const password =
        environment.UPYUN_PASSWORD ||
        (platform === "darwin" ? readCredential(keychainServices.password) : undefined);

    if (!operator || !password) {
        const missing = [
            !operator && "UPYUN_OPERATOR",
            !password && "UPYUN_PASSWORD",
        ].filter(Boolean);
        const fallback =
            platform === "darwin"
                ? "matching macOS Keychain items were not found or could not be read"
                : `macOS Keychain fallback is unavailable on ${platform}`;
        throw new Error(`Missing ${missing.join(" and ")}; ${fallback}`);
    }

    return { operator, password };
}

export function validateRemoteDir(remoteDir) {
    if (!remoteDir || !/^\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/.test(remoteDir)) {
        throw new Error("remoteDir must be a non-root, single-level kebab-case path such as /trip/");
    }
    return remoteDir;
}

export async function validateLocalDir(localDir) {
    if (!localDir) {
        throw new Error("localDir is required");
    }
    const resolved = path.resolve(localDir);
    let details;
    try {
        details = await stat(resolved);
    } catch (error) {
        if (error?.code === "ENOENT") {
            throw new Error(`localDir does not exist: ${resolved}`);
        }
        throw error;
    }
    if (!details.isDirectory()) {
        throw new Error(`localDir is not a directory: ${resolved}`);
    }
    return resolved;
}

export async function filesIn(directory, prefix = "") {
    const files = [];
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
        const relative = path.posix.join(prefix, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await filesIn(path.join(directory, entry.name), relative)));
        } else if (entry.isFile()) {
            files.push(relative);
        } else {
            throw new Error(`Refusing non-regular build entry: ${relative}`);
        }
    }
    return files;
}

function put(remotePath, body, operator, password) {
    const uri = encodeURI(`/${service}${remotePath}`);
    const date = new Date().toUTCString();
    const length = body.length;
    const signature = md5(`PUT&${uri}&${date}&${length}&${md5(password)}`);

    return new Promise((resolve, reject) => {
        const request = https.request(
            {
                hostname: "v0.api.upyun.com",
                method: "PUT",
                path: uri,
                headers: {
                    Authorization: `UPYUN ${operator}:${signature}`,
                    Date: date,
                    "Content-Length": length,
                    "Content-MD5": md5(body),
                    "Content-Type": mimeTypes[path.extname(remotePath).toLowerCase()] || "application/octet-stream",
                    "x-upyun-auto-mkdir": "true",
                },
            },
            (response) => {
                response.resume();
                response.on("end", () => resolve(response.statusCode));
                response.on("error", reject);
            },
        );
        request.setTimeout(30_000, () => request.destroy(new Error("UPYUN request timed out")));
        request.on("error", reject);
        request.end(body);
    });
}

export async function main(args = process.argv.slice(2), environment = process.env) {
    if (args.length !== 0 && args.length !== 2) {
        throw new Error("Usage: node scripts/youpai-sync.mjs <localDir> </kebab-case-appSlug/>");
    }

    const [localDirInput = "out", remoteDirInput = `/${appConfig.slug}/`] = args;
    const remoteDir = validateRemoteDir(remoteDirInput);
    const localDir = await validateLocalDir(localDirInput);
    const { operator, password } = resolveCredentials(environment);

    const files = (await filesIn(localDir)).sort((left, right) => left.localeCompare(right));
    console.log(`PUBLISH ${service}${remoteDir}: ${files.length} files`);
    console.log(`URL ${origin}${remoteDir}`);

    for (const file of files) {
        const body = await readFile(path.join(localDir, file));
        const remotePath = `${remoteDir}${file}`;
        const status = await put(remotePath, body, operator, password);
        if (!status || status < 200 || status >= 300) {
            throw new Error(`Upload failed: HTTP ${status ?? "unknown"} at ${remotePath}`);
        }
        console.log(`UPLOADED ${remotePath}`);
    }
}

const isEntryPoint = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntryPoint) {
    main().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}
