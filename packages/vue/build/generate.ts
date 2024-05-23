import consola from "consola";
import chalk from "chalk";
import {ensureDir, emptyDir} from 'fs-extra'
import {readFile, writeFile} from 'node:fs/promises'
import {pathComponents} from "./paths";
import {findWorkspacePackages, Project} from "@pnpm/find-workspace-packages";
import {findWorkspaceDir} from "@pnpm/find-workspace-dir";
import glob from "fast-glob";
import path from 'node:path'
import camelcase from "camelcase";
import {type BuiltInParserName, format} from 'prettier'


consola.info(chalk.blue("generate vue components dir"))

await ensureDir(pathComponents)
await emptyDir(pathComponents)

const files = await getSvgFiles()

async function getSvgFiles() {
  const pkgs = await findWorkspacePackages((await findWorkspaceDir(process.cwd()))!)
  const pkg = pkgs.find(pkg => pkg.manifest.name === "@embrace-ui/icons-svg") as Project
  return glob('*.svg', {cwd: pkg.dir, absolute: true})
}

consola.info(chalk.blue("generating vue files"))
function getName(file: string) {
  const filename = path.basename(file).replace('.svg', '')
  const componentName = camelcase(filename, {pascalCase: true})
  return {
    filename,
    componentName
  }
}
function formatCode(code: string, parser: BuiltInParserName = 'typescript') {
  return format(code, {
    parser,
    semi: false,
    singleQuote: true
  })
}

async function transformToVueComponent(file: string) {
  const content = await readFile(file, 'utf-8')

  const {filename, componentName} = getName(file)

  const code = `
    <template>
        ${content}
    </template>
    <script lang="ts" setup>
        defineOptions({
            name: ${JSON.stringify(componentName)}
        })
    </script>
  `

  const vue = await formatCode(code, 'vue')
  await writeFile(path.resolve(pathComponents, `${filename}.vue`), vue, 'utf-8')
}

await Promise.all(files.map((file) => transformToVueComponent(file)))

consola.info(chalk.blue("generating entry file"))

async function generateEntry(files: string[]) {
  const code = await formatCode(files.map((file) => {
    const {filename, componentName} = getName(file)
    return `export {
      default as ${componentName}
    } from './${filename}.vue'`
  }).join('\n'))
  await writeFile(path.resolve(pathComponents, "index.ts"), code, 'utf-8')
}

await generateEntry(files)
