import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const migrationDirectory = join(root, 'supabase', 'migrations')
const ledgerConfig = JSON.parse(
  readFileSync(join(root, 'config', 'supabase-migration-ledger.json'), 'utf8'),
)

const migrationPattern = /^(\d{8}|\d{14})_([a-z0-9][a-z0-9_-]*)\.sql$/
const files = readdirSync(migrationDirectory)
  .filter((file) => file.endsWith('.sql'))
  .sort()

const errors = []
const warnings = []
const versions = new Map()

for (const file of files) {
  const match = migrationPattern.exec(file)
  if (!match) {
    errors.push(`${file}: expected <8-or-14-digit-version>_<name>.sql`)
    continue
  }

  const [, version] = match
  const contents = readFileSync(join(migrationDirectory, file), 'utf8').trim()
  if (!contents) errors.push(`${file}: migration is empty`)

  const siblings = versions.get(version) ?? []
  siblings.push(file)
  versions.set(version, siblings)
}

const allowedLegacyDuplicates = new Set(ledgerConfig.allowedLegacyDuplicateVersions ?? [])
for (const [version, siblings] of versions) {
  if (siblings.length < 2) continue
  const message = `${version}: duplicate migration version (${siblings.join(', ')})`
  if (allowedLegacyDuplicates.has(version)) warnings.push(`legacy ${message}`)
  else errors.push(message)
}

for (const allowedVersion of allowedLegacyDuplicates) {
  if ((versions.get(allowedVersion)?.length ?? 0) < 2) {
    errors.push(`${allowedVersion}: legacy duplicate allowlist is stale`)
  }
}

console.log(`Migration files: ${files.length}`)
console.log(`Unique versions: ${versions.size}`)
console.log(`Project ref: ${ledgerConfig.projectRef}`)

for (const warning of warnings) console.warn(`WARNING: ${warning}`)
for (const error of errors) console.error(`ERROR: ${error}`)

if (errors.length) process.exitCode = 1
