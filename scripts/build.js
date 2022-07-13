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
})
//Module
build({
    entryPoints: [`builds/module.js`],
    outfile: `dist/${pluginName}.esm.js`,
    bundle: true,
    bundle: true,
    platform: 'neutral',
    mainFields: ['main', 'module'],
})
build({
    entryPoints: [`builds/module.js`],
    outfile: `dist/${pluginName}.cjs.js`,
    bundle: true,
    target: ['node10.4'],
    platform: 'node',
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
