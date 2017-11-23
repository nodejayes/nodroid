#!/usr/bin/env node

const {mkdirSync, writeFileSync, existsSync, readFileSync} = require('fs');
const {join} = require('path');
const {spawn, spawnSync} = require('child_process');
const clean = require('rimraf');
const readline = require('readline');
const packageJson = require('./package.json');
const _ = require('lodash');
const vali = require('validator');
const VALID_LICENSE = readJsonFile(join(__dirname, 'license.json'));

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function query(msg) {
    return new Promise((resolve, reject) => {
        rl.question(msg, resolve);
    });
}

function readJsonFile(path) {
    return JSON.parse(readFileSync(path, {encoding:'utf-8'}).toString('utf-8'));
}

const OVERWRITE_UTF8 = {
    encoding: 'utf-8',
    flag: 'w',
};
const YARN_CONFIG_CACHE = {};

let projectName = '';
let authorName = '';
let authorEmail = '';
let lic = '';
let root = '';
let clear = 'n';
let resolvePath = '';
let resolveAlias = '';

function writeFolders() {
    if (!existsSync(join(root, '.vscode'))) {
        mkdirSync(join(root, '.vscode'));
    }
    if (!existsSync(join(root, 'spec'))) {
        mkdirSync(join(root, 'spec'));
    }
    if (!existsSync(join(root, 'src'))) {
        mkdirSync(join(root, 'src'));
    }
}

async function createFolders(project) {
    root = join(process.cwd(), project);
    let existsRoot = existsSync(root);
    if (existsRoot) {
        clear = await query(`${root} already exists overwrite? (j/N):`);
    }
    return new Promise((resolve, reject) => {
        if (existsRoot) {
            if (clear.toLowerCase() === 'j') {
                clean(root, () => {
                    mkdirSync(root);
                    writeFolders();
                    resolve();
                });
            } else {
                writeFolders();
                resolve();
            }
        } else {
            mkdirSync(root);
            writeFolders();
            resolve();
        }
    });
}

function createFiles(contents) {
    writeFileSync(join(root, '.vscode', 'settings.json'),
        contents[0], OVERWRITE_UTF8);
    writeFileSync(join(root, '.esdoc.json'),
        contents[1], OVERWRITE_UTF8);
    writeFileSync(join(root, '.eslintrc'),
        contents[2], OVERWRITE_UTF8);
    writeFileSync(join(root, '.gitignore'),
        contents[3], OVERWRITE_UTF8);
    writeFileSync(join(root, '.npmignore'),
        contents[4], OVERWRITE_UTF8);
    writeFileSync(join(root, '.nycrc'),
        contents[5], OVERWRITE_UTF8);
    writeFileSync(join(root, '.babelrc'),
        contents[8], OVERWRITE_UTF8);
    writeFileSync(join(root, '.vscode', 'launch.json'),
        contents[7], OVERWRITE_UTF8);
    writeFileSync(join(root, 'README.md'),
        contents[6], OVERWRITE_UTF8);
    writeFileSync(join(root, 'src', 'index.js'), 
        '', OVERWRITE_UTF8);
    writeFileSync(join(root, 'jsconfig.json'),
        contents[9], OVERWRITE_UTF8);
}

function yarnInit() {
    return new Promise((resolve, reject) => {
        let yarn = spawn('yarn', ['init', '--yes'], {
            cwd: root
        });
        yarn.stdout.on('data', (d) => {
            console.info(d.toString('utf-8'));
        });
        yarn.stderr.on('data', (d) => {
            console.info(d.toString('utf-8'));
        });
        yarn.on('close', () => {
            resolve();
        });
    });
}

function yarnInstall() {
    return new Promise((resolve, reject) => {
        let yarn = spawn('yarn', [
            'add', '--dev', 'babel-cli', 'babel-plugin-istanbul', 'babel-preset-env', 'babel-preset-stage-2', 'babel-plugin-module-resolver',
            'babel-register', 'babel-plugin-transform-runtime', 'chai', 'esdoc', 'esdoc-standard-plugin', 'eslint', 'eslint-config-google', 'mocha',
            'nodemon', 'nyc', 'sinon'
        ], {
            cwd: root
        });
        yarn.stdout.on('data', (d) => {
            console.info(d.toString('utf-8'));
        });
        yarn.stderr.on('data', (d) => {
            console.info(d.toString('utf-8'));
        });
        yarn.on('close', () => {
            resolve();
        });
    });
}

function updatePackageJson() {
    let packFile = join(root, 'package.json');
    let p = require(packFile);
    p.main = './dist/index.js';
    p.license = lic;
    p.scripts = {
        start: 'babel-node ./src/index.js',
        test: 'NODE_ENV=test babel-node ./node_modules/nyc/bin/nyc.js ./node_modules/mocha/bin/mocha -R tap --recursive ./spec/',
        build: 'babel ./src -d ./dist',
        docs: 'esdoc'
    };
    p.author = {
        name: authorName,
        email: authorEmail
    };
    writeFileSync(packFile, JSON.stringify(p, null, 4), OVERWRITE_UTF8);
}

async function run() {
    projectName = await query('Name of your Project:');
    while (!_.isString(projectName) || projectName.length < 1) {
        console.info(`invalid project name ${projectName}`);
        projectName = await query('Name of your Project:');
    }
    authorName = await query('Author:');
    while (!_.isString(authorName)) {
        console.info(`invalid author name ${authorName}`);
        authorName = await query('Author:');
    }
    authorEmail = await query('Authors Email:');
    while (!vali.isEmail(authorEmail)) {
        console.info(`invalid author email ${authorEmail}`);
        authorEmail = await query('Authors Email:');
    }
    lic = await query('License:');
    while (!_.isString(lic) || lic.length < 1 || VALID_LICENSE.indexOf(lic) === -1) {
        console.info(`invalid license ${lic}`);
        lic = await query('License:');
    }

    console.info(`create Project ${projectName}`);

    const BABELRC_SETTINGS = `
{
    "presets": [
        ["env", {
            "targets": {
                "node": "8.9.1"
            }
        }],
        "stage-2"
    ],
    "plugins": [
        "istanbul",
        "transform-runtime",
        [
            "module-resolver",
            {
                "alias": {
                    "~": "./src"
                }
            }
        ]
    ]
}
    `;
    const VSCODE_SETTINGS_JSON = `
{
    "nodeTdd.activateOnStartup": true,
    "nodeTdd.coverageThreshold": 85,
    "nodeTdd.reporter": "tap",
    "nodeTdd.showCoverage": true,
    "eslint.autoFixOnSave": true,
    "path-autocomplete.pathMappings": {
        "~": "\$\{workspace\}/src"
    }
}
    `;
    const ESDOC_SETTINGS = `
{
    "source": "./src",
    "destination": "./docs",
    "plugins": [
        {"name": "esdoc-standard-plugin"}
    ]
}
    `;
    const ESLINT_SETTINGS = `
{
    "globals": {
        "Promise": true
    },
    "env": {
        "es6": true,
        "mocha": true,
        "node": true
    },
    "extends": "google",
    "parserOptions": {
        "ecmaVersion": 8,
        "sourceType": "module"
    },
    "rules": {
        "no-console": "off",
        "max-len": ["error", {
            "code": 300,
            "tabWidth": 4,
            "ignoreComments": true,
            "ignoreStrings": true
        }],
        "linebreak-style":"off"
    }
}
    `;
    const GITIGNORE = `
.nyc_output/**
coverage/**
node_modules/**
    `;
    const NPMIGNORE = `
.nyc_output/**
.vscode/**
coverage/**
node_modules/**
spec/**
src/**
.babelrc
.esdoc.json
.gitignore
.npmignore
.nycrc
    `;
    const NYC_SETTINGS = `
{
    "report-dir": "./coverage",
    "reporter": [
        "html",
        "lcov"
    ],
    "clean": true,
    "include": [
        "src/**/*.js"
    ],
    "exclude": [
        "spec/**/*.spec.js"
    ],
    "require": [
        "babel-register"
    ],
    "sourceMap": false,
    "instrument": true,
    "all": true
}
    `;
    const VSCODE_DEBUG = `
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Program",
            "program": "\$\{workspaceFolder\}/src/index.js",
            "console": "integratedTerminal"
        },
        {
            "type": "node",
            "request": "launch",
            "name": "Tests",
            "program": "\$\{workspaceFolder\}/node_modules/.bin/babel-node",
            "args": [
                "\$\{workspaceFolder\}/node_modules/.bin/nyc",
                "\$\{workspaceFolder\}/node_modules/.bin/mocha",
                "--recursive",
                "\$\{workspaceFolder\}/spec/"
            ],
            "env": {
                "NODE_ENV": "test"
            },
            "console": "integratedTerminal"
        }
    ]
}
    `;
    const JSCONFIG = `
{
    "compilerOptions": {
        "baseUrl": "./",
        "paths": {
            "~/*": [
                "src/*"
            ]
        }
    },
    "exclude": [
        "node_modules"
    ]
}
    `;
    const README = `
# ${projectName}
    `;

    await createFolders(projectName);
    await yarnInit();
    await yarnInstall();
    createFiles([
        VSCODE_SETTINGS_JSON,
        ESDOC_SETTINGS,
        ESLINT_SETTINGS,
        GITIGNORE,
        NPMIGNORE,
        NYC_SETTINGS,
        README,
        VSCODE_DEBUG,
        BABELRC_SETTINGS,
        JSCONFIG
    ]);
    updatePackageJson();
}

async function resolve () {
    if (process.argv.length < 5) {
        throw new Error(`not enough parameter`);
    }
    resolveAlias = process.argv[3];
    resolvePath = process.argv[4];
    if(typeof resolveAlias !== 'string' || resolveAlias.length < 1) {
        throw new Error(`invalid parameter resolveAlias ${resolveAlias}`);
    }
    let fullpath = join(process.cwd(), resolvePath);
    if (typeof resolvePath !== 'string' || resolvePath.length < 1 || !existsSync(fullpath)) {
        throw new Error(`invalid parameter resolvePath ${resolvePath}`);
    }
    let jsconfigPath = join(process.cwd(), 'jsconfig.json');
    let babelrcPath = join(process.cwd(), '.babelrc');
    let vsconfigPath = join(process.cwd(), '.vscode', 'settings.json');

    let jsconfig = readJsonFile(jsconfigPath);
    let babelrc = readJsonFile(babelrcPath);
    let vsconfig = readJsonFile(vsconfigPath);

    let babelpluginidx = null;
    let i = 0;
    while (i < babelrc.plugins.length) {
        let e = babelrc.plugins[i];
        if (_.isArray(e) && e[0] === 'module-resolver') {
            babelpluginidx = i;
            i = babelrc.plugins.length;
        }
        i++;
    }

    if (babelpluginidx === null) {
        throw new Error('missing babel-plugin-module-resolver');
    }

    if (_.isArray(jsconfig.compilerOptions.paths[`${resolveAlias}/*`]) ||
        _.isString(babelrc.plugins[babelpluginidx][1].alias[resolveAlias]) ||
        _.isString(vsconfig['path-autocomplete.pathMappings'][resolveAlias])) {
        throw new Error(`alias already taken ${resolveAlias}`);
    }
    
    vsconfig['path-autocomplete.pathMappings'][resolveAlias] = `\$\{workspace\}/${resolvePath}`;
    jsconfig.compilerOptions.paths[`${resolveAlias}/*`] = [`${resolvePath}/*`];
    babelrc.plugins[babelpluginidx][1].alias[resolveAlias] = `./${resolvePath}`;
    
    writeFileSync(vsconfigPath, JSON.stringify(vsconfig, null, 4), OVERWRITE_UTF8);
    writeFileSync(jsconfigPath, JSON.stringify(jsconfig, null, 4), OVERWRITE_UTF8);
    writeFileSync(babelrcPath, JSON.stringify(babelrc, null, 4), OVERWRITE_UTF8);
    console.info(`Alias ${resolveAlias} added resolve to ${fullpath}`);
    process.exit(0);
}

switch (process.argv[2]) {
    case 'init':
        run()
        .then(process.exit)
        .catch(console.error);
        break;
    case 'resolve':
        resolve();
        break;
    default:
        console.info(`
        Node Droid v${packageJson.version}
        
        #### HELP
        
        nodroid [command]
            nodroid init                    -- init a new Node Droid Project
            nodroid resolve {alias} {path}  -- add a path alias
            `);
            process.exit(0);
}