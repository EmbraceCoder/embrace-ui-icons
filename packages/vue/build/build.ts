import {build, type BuildOptions, type Format} from 'esbuild'
import path from 'node:path'
import {pathOutput, pathSrc} from "./paths";
import vue from 'unplugin-vue/esbuild'
import {version} from '../package.json'
import GlobalsPlugin from 'esbuild-plugin-globals'
import consola from "consola";
import chalk from "chalk";
import {emptyDir} from "fs-extra";

const buildBundle = () => {

  const getBuildOptions = (format: Format) => {
    const options: BuildOptions = {
      entryPoints: [
        path.resolve(pathSrc, 'index.ts'),
        path.resolve(pathSrc, 'global.ts')
      ],
      target: 'es2018',
      platform: 'neutral',
      plugins: [
        vue({
          isProduction: true,
          sourceMap: false,
          template: {compilerOptions: {hoistStatic: false}}
        })
      ],
      bundle: true,
      format,
      minifySyntax: true,
      banner: { // 文件头部注释
        js: `/*! Embrace Ui Icons Vue v${version} */\n`,
      },
      outdir: pathOutput
    }
    if (format === 'iife') {
      options.plugins!.push(
        GlobalsPlugin({
          vue: 'Vue',
        }),
      )
      options.globalName = 'EmbraceUiIconsVue'
    } else {
      options.external = ['vue']
    }

    return options
  }
  async function doBuild(minify: boolean) {
    await Promise.all([
      build({
        ...getBuildOptions('esm'),
        entryNames: `[name]${minify ? '.min' : ''}`,
        minify
      }),
      build({
        ...getBuildOptions('iife'),
        entryNames: `[name].iife${minify ? '.min' : ''}`,
        minify
      }),
      build({
        ...getBuildOptions('cjs'),
        entryNames: `[name]${minify ? '.min' : ''}`,
        outExtension: {'.js': '.cjs'},
        minify
      })
    ])
  }
  return Promise.all([doBuild(true), doBuild(false)])
}

consola.info(chalk.blue("cleaning dist ..."))
await emptyDir(pathOutput)
consola.info(chalk.blue("building ..."))
await buildBundle()

