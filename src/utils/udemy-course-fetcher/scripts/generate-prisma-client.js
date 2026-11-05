const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const serviceDirectory = path.resolve(__dirname, '..')
const sourceSchemaPath = path.resolve(serviceDirectory, '../../../prisma/schema.prisma')
const temporaryDirectory = fs.mkdtempSync(path.join(serviceDirectory, '.prisma-schema-'))
const temporarySchemaPath = path.join(temporaryDirectory, 'schema.prisma')

/**
 * The repository schema defines multiple generated clients. The Udemy Lambda
 * needs the same models, but its client must be generated inside this service's
 * node_modules with the AWS Lambda query engine. Strip only the top-level
 * generator blocks before adding that service-specific generator.
 */
function withoutGeneratorBlocks(schema) {
    const output = []
    let generatorDepth = 0

    schema.split('\n').forEach(line => {
        if (generatorDepth === 0 && /^\s*generator\s+\w+\s*\{/.test(line)) {
            generatorDepth = 1
            return
        }

        if (generatorDepth > 0) {
            generatorDepth += (line.match(/\{/g) || []).length
            generatorDepth -= (line.match(/\}/g) || []).length
            return
        }

        output.push(line)
    })

    return output.join('\n').trimStart()
}

const lambdaGenerator = `generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}`

let exitCode = 1

try {
    const sourceSchema = fs.readFileSync(sourceSchemaPath, 'utf8')
    fs.writeFileSync(
        temporarySchemaPath,
        `${lambdaGenerator}\n\n${withoutGeneratorBlocks(sourceSchema)}`,
    )

    const prismaExecutable = require.resolve('prisma/build/index.js', {
        paths: [serviceDirectory],
    })
    const result = spawnSync(
        process.execPath,
        [prismaExecutable, 'generate', '--schema', temporarySchemaPath],
        {
            cwd: serviceDirectory,
            env: {
                ...process.env,
                PRISMA_HIDE_UPDATE_MESSAGE: 'true',
            },
            stdio: 'inherit',
        },
    )

    if (result.error) {
        throw result.error
    }

    exitCode = result.status ?? 1
} finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
}

process.exitCode = exitCode
