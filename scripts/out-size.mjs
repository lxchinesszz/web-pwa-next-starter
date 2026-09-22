import fs from "node:fs"
import path from "node:path"

const OUT_DIR = path.resolve(
    process.cwd(),
    "out",
)

function getFileType(filePath) {
    const extension =
        path.extname(filePath)

    if (extension) {
        return extension.toLowerCase()
    }

    return path.basename(filePath)
}

function collectStats(directory) {
    const types = new Map()

    let totalSize = 0
    let totalFiles = 0

    const entries =
        fs.readdirSync(directory, {
            withFileTypes: true,
        })

    for (const entry of entries) {
        const filePath =
            path.join(
                directory,
                entry.name,
            )

        if (entry.isDirectory()) {
            const result =
                collectStats(filePath)

            totalSize +=
                result.totalSize

            totalFiles +=
                result.totalFiles

            for (
                const [type, stats]
                of result.types
                ) {
                const current =
                    types.get(type) ?? {
                        files: 0,
                        size: 0,
                    }

                current.files +=
                    stats.files

                current.size +=
                    stats.size

                types.set(
                    type,
                    current,
                )
            }

            continue
        }

        if (!entry.isFile()) {
            continue
        }

        const stat =
            fs.statSync(filePath)

        const type =
            getFileType(filePath)

        const current =
            types.get(type) ?? {
                files: 0,
                size: 0,
            }

        current.files++
        current.size += stat.size

        types.set(
            type,
            current,
        )

        totalFiles++
        totalSize += stat.size
    }

    return {
        types,
        totalFiles,
        totalSize,
    }
}

function formatBytes(bytes) {
    if (bytes === 0) {
        return "0 B"
    }

    const units = [
        "B",
        "KB",
        "MB",
        "GB",
    ]

    const index =
        Math.min(
            Math.floor(
                Math.log(bytes) /
                Math.log(1024),
            ),
            units.length - 1,
        )

    const value =
        bytes /
        1024 ** index

    return `${value.toFixed(2)} ${units[index]}`
}

function printLine() {
    console.log(
        "─".repeat(46),
    )
}

function printRow(
    type,
    files,
    size,
) {
    console.log(
        `${type.padEnd(20)}${String(files).padStart(8)}${formatBytes(size).padStart(18)}`,
    )
}

if (!fs.existsSync(OUT_DIR)) {
    console.error(
        "❌ out directory not found.",
    )

    process.exit(1)
}

const {
    types,
    totalFiles,
    totalSize,
} = collectStats(OUT_DIR)

// 按总大小从大到小排列
const sortedTypes =
    [...types.entries()]
        .sort(
            ([, a], [, b]) =>
                b.size - a.size,
        )

console.log("")
console.log("📦 Build Output")
console.log("")

console.log(
    `${"Type".padEnd(20)}${"Files".padStart(8)}${"Size".padStart(18)}`,
)

printLine()

for (
    const [type, stats]
    of sortedTypes
    ) {
    printRow(
        type,
        stats.files,
        stats.size,
    )
}

printLine()

printRow(
    "TOTAL",
    totalFiles,
    totalSize,
)

console.log("")
