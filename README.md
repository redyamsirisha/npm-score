[![NPM version](https://badge.fury.io/js/npm-score.svg)](https://www.npmjs.com/package/npm-score)

# npm-score
An utility to show package score according to [npms.io](https://npms.io/).

![ScreenShot](https://raw.githubusercontent.com/dapaulid/npm-score/master/doc/screenshot.png)


## Purpose

npm-score allows to retrieve a npm package's search score determined by [npms.io](https://npms.io/). Features:

- writing the score report to a JSON file
- display a summary about the score
- compare the current score to a previously saved report to see how a package improved


## Installation
```
npm install -g npm-score
```

## Usage
```
usage: npm-score [-h] [-v] [-s [file]] [-d [file]] [package]

Utility to show package score according to npms.io

Positional arguments:
  package               Name of package to score. Use current package when 
                        omitted.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -s [file], --save-report [file]
                        Save report to file. Default: package-score.json
  -d [file], --diff [file]
                        Report for comparison. Default: package-score.json
```
