import path from 'node:path'
import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'
import { UserConfigExport } from 'vite'
import { name } from './package.json'
import { fileURLToPath } from 'node:url'


const app = async (): Promise<UserConfigExport> => {
  const formattedName = name.match(/[^/]+$/)?.[0] ?? name

  return defineConfig({
    plugins: [
      dts({
        insertTypesEntry: true,
      }),
    ],
    resolve: {
      alias: [
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      ]
    },
    ssr: {
      target: 'node',
    },
    build: {
      ssr: true,
      cssMinify: true,
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: formattedName,
        formats: ['es', 'umd'],
        fileName: (format) => `${formattedName}.${format}.js`,
      },
      rollupOptions: {
        external: ['react', 'react/jsx-runtime', 'react-dom', 'tailwindcss', 'react-firebase-hooks'],
        output: {
          banner: '"use client";',
          globals: {
            "react-firebase-hooks/auth/dist/index.esm.js": "react-firebase-hooks/auth",
            "firebase/auth": "firebase/auth"
          },
        },
      },
    }
  })
}
export default app
