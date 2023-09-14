import {
  DependencyCategory,
  createRollupConfig,
  tsPresetConfigBuilder,
} from '@guanghechen/rollup-config'
import path from 'node:path'

const builtinIds = new Set(['@guanghechen/shared'])
const externalIds = new Set(['./index.mjs'])

export default async function rollupConfig() {
  const { default: manifest } = await import(path.resolve('package.json'), {
    assert: { type: 'json' },
  })
  const config = await createRollupConfig({
    manifest,
    env: {
      sourcemap: false,
    },
    presetConfigBuilders: [
      tsPresetConfigBuilder({
        typescriptOptions: {
          tsconfig: 'tsconfig.src.json',
        },
      }),
    ],
    classifyDependency: id => {
      if (builtinIds.has(id)) return DependencyCategory.BUILTIN
      if (externalIds.has(id)) return DependencyCategory.EXTERNAL
      return DependencyCategory.UNKNOWN
    },
  })
  return config
}
