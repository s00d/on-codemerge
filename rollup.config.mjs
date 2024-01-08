import path from "path";
import { fileURLToPath } from 'url';
import typescript from 'rollup-plugin-typescript2';
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import filesize from 'rollup-plugin-filesize';
import progress from 'rollup-plugin-progress';
import postcss from 'rollup-plugin-postcss';
import sass from 'sass';
import fs from "fs";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = './src';
const extensions = ['.ts', '.js'];

const distFolderPath = './packages';

async function getConfig() {
    const pkg = await import('./package.json', { assert: { type: 'json' } });
    const preamble = `/*!
    * allof-merge v${pkg.version}
    * Copyright (C) (C) 2012-${new Date().getFullYear()} ${pkg.author}
    * Date: ${new Date().toUTCString()}
    */`;

    const entryPoints = ['main'];
    const files = fs.readdirSync(distFolderPath, { withFileTypes: true });

    files.forEach(file => {
        if (file.isDirectory()) {
            entryPoints.push(file.name)
        }
    });

    return entryPoints.map(entry => ({
        input: path.resolve(dirname, entry === 'main' ? `src/index.ts` : `packages/${entry}/src/index.ts`),
        output: [
            { file: `dist/${entry}.esm.js`, format: 'esm', sourcemap: true, exports: 'named' },
            { file: `dist/${entry}.iife.js`, format: 'iife', sourcemap: true, name: entry, exports: 'named' },
            { file: `dist/${entry}.umd.js`, format: 'umd', name: 'AllofMerge', sourcemap: true, exports: 'named' }
        ],
        plugins: [
            resolve({ extensions }),
            commonjs({ include: 'node_modules/**' }),
            json(),
            progress(),
            filesize({ showGzippedSize: true }),
            typescript({
                tsconfig: './tsconfig.json',
                clean: true,
                useTsconfigDeclarationDir: true,
                objectHashIgnoreUnknownHack: false,
                declarationDir: `dist/${entry}`

            }),
            babel({
                babelHelpers: 'bundled',
                exclude: 'node_modules/**',
                include: [`${inputPath}/**/*`],
                extensions
            }),
            terser({ format: { preamble, comments: false } }),
            postcss({
                // Для инлайнинга стилей в JavaScript используйте следующие опции:
                use: {
                    sass: sass,
                    includePaths: ['src/styles'],
                },
                inject: false,
                extract: true,
            }),
        ]
    }));
}

export default getConfig();
