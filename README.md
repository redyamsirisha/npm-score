[![NPM version](https://badge.fury.io/js/npm-score.svg)](https://www.npmjs.com/package/npm-score)

# npm-score
An utility to show package score according to [npms.io](https://npms.io/).

![ScreenShot](https://raw.githubusercontent.com/dapaulid/npm-score/master/doc/screenshot.png)


## Purpose

npm-score allows to retrieve a npm package's search score determined by [npms.io](https://npms.io/). Features:

- Write the score report to a JSON file.
- Display a summary about the score.
- Compare the current score to a previously saved report to see how a package improved.


## Installation

To install the command line tool globally, run:
```
npm install -g npm-score
```

You can also integrate npm-score with your own module. First, install it as devDependency:
```
npm install npm-score --save-dev
```

Second, add the following two scripts to your package.json:
```
  "scripts": {
    "score": "node_modules/.bin/npm-score --diff",
    "preversion": "node_modules/.bin/npm-score --save-report --commit --quiet",
    (...)
  },
```

This will save and commit the final npm score for your module whenever you publish a new version.
Later, you can check how well your new version performs compared to the previous by running:
```
npm run score
```

## Usage
```
usage: npm-score [-h] [-v] [-s [file]] [-d [file]] [-c] [-q] [package]

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
  -c, --commit          Commit saved report.
  -q, --quiet           Quiet mode.
```
