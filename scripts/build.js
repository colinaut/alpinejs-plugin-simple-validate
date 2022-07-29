/* eslint-disable */
let fs = require('fs')

const pluginName = 'alpine.validate'

//CDN
build({
    entryPoints: [`builds/cdn.js`],
    outfile: `dist/${pluginName}.min.js`,
    bundle: true,
    minify: true,
    sourcemap: false,
    platform: 'browser',
    define: { CDN: true },
    target: "es2019",
})
//Example
build({
    entryPoints: [`builds/cdn.js`],
    outfile: `examples/${pluginName}.js`,
    bundle: true,
    minify: false,
    sourcemap: false,
    platform: 'browser',
    define: { CDN: true },
    target: "es2019",
})
//Module
build({
    entryPoints: [`builds/module.js`],
    outfile: `dist/${pluginName}.esm.js`,
    bundle: true,
    platform: 'neutral',
    mainFields: ['main', 'module'],
    target: "es2019",
})

build({
    entryPoints: [`builds/module.js`],
    outfile: `dist/${pluginName}.cjs.js`,
    bundle: true,
    target: ['node10.4'],
    platform: 'node',
    target: "es2019",
})


function build(options){
    options.define || (options.define = {})
    options.define['process.env.NODE_ENV'] = process.argv.includes('--watch') ? `'production'` : `'development'`

    return require('esbuild').build({
        watch: process.argv.includes('--watch'),
        // external: ['alpinejs'],
        ...options,
    }).catch(() => process.exit(1))
}
