const quote = (value) => JSON.stringify(value)

const toWorkspaceRelative = (files, prefix) =>
  files
    .filter((file) => file.startsWith(prefix))
    .map((file) => file.slice(prefix.length))

module.exports = {
  "apps/web/**/*.{ts,tsx}": (files) => {
    const webFiles = toWorkspaceRelative(files, "apps/web/")
    if (!webFiles.length) {
      return []
    }

    return `npm run lint --workspace=apps/web --if-present -- ${webFiles.map(quote).join(" ")}`
  },

  "apps/mobile/**/*.{ts,tsx}": (files) => {
    const mobileFiles = toWorkspaceRelative(files, "apps/mobile/")
    if (!mobileFiles.length) {
      return []
    }

    return `npm run lint --workspace=apps/mobile -- ${mobileFiles.map(quote).join(" ")}`
  },

  "services/api/**/*.py": (files) => {
    if (!files.length) {
      return []
    }

    const args = files.map(quote).join(" ")
    return [`ruff check --fix ${args}`, `ruff format ${args}`]
  },
}
