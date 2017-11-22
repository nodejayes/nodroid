# Node Droid

Creates a Standard Template for a Empty NodeJs Project.

## Requirements before we can start

First of all we have to Download and Install VSCode from [here](https://code.visualstudio.com/). After the installation I recommend to install these extensions.

### VSCode Extensions

| Extension                                | Description                                                 |
|------------------------------------------|-------------------------------------------------------------|
| ESLint                                   | linting Code on the Fly                                     |
| Node TDD                                 | Helps to execute Tests when Code is changed                 |
| Coverage Gutters                         | Show Code Coverage on the Fly                               |
| Document This                            | Fast and Easy Documentation Generation                      |
| npm && npm intellisense                  | enables Intellisense in package.json                        |
| Path Autocomplete                        | Intellisense for Paths                                      |
| Project Manager                          | working with multiple Projects                              |
| GIT Lens                                 | brings GIT Informations in the Code                         |
| GraphQl for VSCode                       | brings GraphQl Syntax Highliting and Intellisense to VSCode |
| Linux Themes for VS Code && vscode-icons | better Styling                                              |

The second dependency is Yarn. This tool builds NPM and allows you to install the packages faster. To install Yarn please follow the instructions [here](https://yarnpkg.com/en/docs/install).

## Install Tool

Now we are ready to install the nodroid command. To do this we only need to execute the following command.

```bash
yarn global add nodroid
```

## Usage

```bash
nodroid init

Name of your Project?:{input name of Project}
Author?:{input the name of the Author}
Authors Email?:{input Email of the Author}
License?:{input License Type}
```

## Folder Structure

| Folder       | Description                    |
|--------------|--------------------------------|
| .vscode      | Settings for VSCode            |
| node_modules | dependencies                   |
| spec         | Folder for Tests               |
| src          | Source Code Folder             |
| dist         | buildfolder for Release        |
| coverage     | generated Coverage Folder      |
| docs         | generated Documentation Folder |

## Scripts

| Script | What it does                         |
|--------|--------------------------------------|
| start  | start the index.js in the src Folder |
| test   | run the Tests and generate Coverage  |
| build  | build the Code for Release usage     |
| docs   | generate the Documentation           |

## under the Hood

| Package               | Using for...                                           |
|-----------------------|--------------------------------------------------------|
| babel-cli             | use Babel Commands for Transpiling                     |
| babel-plugin-istanbul | used for generation of Coverage                        |
| babel-preset-es2015   | transpiling Rules to ES2015                            |
| babel-preset-stage-2  | transpiling Rules for newest ES Features               |
| babel-register        | helps to transpile Code for Testing                    |
| chai                  | assert Testing Tool                                    |
| mocha                 | Test Runner                                            |
| sinon                 | Mocking Tool                                           |
| nyc                   | Coverage Reporter                                      |
| esdoc                 | Documentation Generator for ES2017                     |
| esdoc-standard-plugin | the Default Pugin for esdoc                            |
| eslint                | check Javascript Code for Errors                       |
| eslint-config-google  | eslint Google Ruleset                                  |
| nodemon               | used to restart Processes when Source Code has changed |