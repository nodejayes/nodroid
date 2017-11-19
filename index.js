#!/bin/bash node

const {mkdirSync, writeFileSync} = require('fs');
const {join} = require('path');
const {spawn, spawnSync} = require('child_process');
const clean = require('rimraf');
const readline = require('readline');
const packageJson = require('./package.json');

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

function createFolders(project) {
    return new Promise((resolve, reject) => {
        root = join(process.cwd(), project);
        clean(root, () => {
            mkdirSync(root);
            mkdirSync(join(root, '.vscode'));
            mkdirSync(join(root, 'spec'));
            mkdirSync(join(root, 'src'));
            resolve();
        });
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
    writeFileSync(join(root, 'README.md'),
        contents[6], OVERWRITE_UTF8);
    writeFileSync(join(root, 'src', 'index.js'), '', OVERWRITE_UTF8);
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
            'add', '--dev', 'babel-cli', 'babel-plugin-istanbul', 'babel-preset-es2015', 'babel-preset-stage-2',
            'babel-register', 'chai', 'esdoc', 'esdoc-standard-plugin', 'eslint', 'eslint-config-google', 'mocha',
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
    p.main = './src/index.js';
    p.license = lic;
    p.scripts = {
        start: 'babel-node ./src/index.js',
        test: 'NODE_ENV=test babel-node ./node_modules/.bin/nyc ./node_modules/.bin/mocha -R tap --recursive ./spec/',
        build: 'babel ./src -d ./dist',
        docs: 'esdoc'
    };
    p.author = {
        name: authorName,
        email: authorEmail
    };
    writeFileSync(packFile, JSON.stringify(p, null, 4), OVERWRITE_UTF8);
}

function query(msg) {
    return new Promise((resolve, reject) => {
        rl.question(msg, resolve);
    });
}

async function run() {
    projectName = await query('Name of your Project?:');
    authorName = await query('Author?:');
    authorEmail = await query('Authors Email?:');
    lic = await query('License?:');
    if (typeof projectName !== 'string' || projectName.length < 1) {
        throw Error(`invalid project name ${projectName}`);
    }
    console.info(`create Project ${projectName}`);

    const VSCODE_SETTINGS_JSON = `
{
    "nodeTdd.activateOnStartup": true,
    "nodeTdd.coverageThreshold": 85,
    "nodeTdd.reporter": "tap",
    "nodeTdd.showCoverage": true,
    "eslint.autoFixOnSave": true
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
        "linebreak-style": "off"
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
    ]);
    updatePackageJson();
}

if (process.argv[1] === 'init') {
    run()
    .then(process.exit)
    .catch(console.error);
} else {
    console.info(`
Node Droid v${packageJson.version}

#### HELP

nodroid [command]
    nodroid init -- init a new Node Droid Project
    `);
    process.exit(0);
}
