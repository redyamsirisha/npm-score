#!/usr/bin/env node
//------------------------------------------------------------------------------
/**
 * @license
 * Copyright (c) Daniel Pauli <dapaulid@gmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
//------------------------------------------------------------------------------
'use strict';

//------------------------------------------------------------------------------
// imports
//------------------------------------------------------------------------------

// Node.js
const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

// third-party
const argparse = require('argparse');
const chalk = require('chalk');
const stripAnsi = require('strip-ansi');


//------------------------------------------------------------------------------
// constants
//------------------------------------------------------------------------------

const THIS_PKG = require('../package.json');
const DEFAULT_SCORE_FILE = 'package-score.json';


//------------------------------------------------------------------------------
// functions
//------------------------------------------------------------------------------

function getCurrentPackageName() {
    let dir = process.cwd();
    while (dir) {
        try {
            const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
            return pkg.name;
        } catch (err) {
            // go to parent directory
            const parent = path.dirname(dir);
            dir = (parent !== dir ? parent : null);
        }
    }
    // not found
    return null;
}

//------------------------------------------------------------------------------

async function getActualPackageReport(packagename) {
    // get package score from https://npms.io
    const query = "https://api.npms.io/v2/package/" + packagename;
    try {
        return {
            query, result: await httpGET(query)
        }
    } catch (err) {
        fail("failed to get package score for " + packagename, err);
    }
}

//------------------------------------------------------------------------------

function savePackageReport(filename, report) {
    fs.writeFileSync(filename, JSON.stringify(report, null, 2), 'utf-8');
}

//------------------------------------------------------------------------------

function loadPackageReport(filename) {
    return JSON.parse(fs.readFileSync(filename, 'utf-8'));
}

//------------------------------------------------------------------------------

function outputScoreSummary(published_version, score, ref_score) {

    // package name
    hrule('-');
    console.log(chalk.bold.yellow("*** npms package score report ***"));
    hrule('-');
    output("package", score.collected.metadata.name);

    // version info
    const rated_version = score.collected.metadata.version;
    const outdated = rated_version != published_version;
    output("published", published_version);
    output("rated", rated_version);
    const analyzed_at = new Date(score.analyzedAt);
    output("analyzed on", analyzed_at.toLocaleDateString());
    output("analyzed at", analyzed_at.toLocaleTimeString());
    output("up-to-date", outdated ? "no" : "yes");

    // npm and GitHub info
    hrule('-');
    const npm = score.collected.npm;
    const ref_npm = ref_score && ref_score.collected.npm;
    output("npm weekly dl", npm.downloads[1].count,
        ref_npm && ref_npm.downloads[1].count);
    output("npm dependents", npm.dependentsCount,
        ref_npm && ref_npm.dependentsCount);
    output("npm stars", npm.starsCount);
    const github = score.collected.github;
    const ref_github = ref_score && ref_score.collected.github;
    output("GitHub forks", github ? github.forksCount : '-',
        ref_github && ref_github.forksCount);
    output("GitHub stars", github ? github.starsCount : '-',
        ref_github && ref_github.starsCount);

    // score details
    hrule('-');
    output("quality", percent(score.score.detail.quality),
        ref_score && percent(ref_score.score.detail.quality));
    output("popularity", percent(score.score.detail.popularity),
        ref_score && percent(ref_score.score.detail.popularity));
    output("maintenance", percent(score.score.detail.maintenance),
        ref_score && percent(ref_score.score.detail.maintenance));

    // total score
    hrule('=');
    output(chalk.bold("TOTAL SCORE"), (outdated ? chalk.red('outdated  ') : '') + percent(score.score.final),
        ref_score && percent(ref_score.score.final));
    hrule('=');
}

//------------------------------------------------------------------------------

async function commitReport(filename) {
    // check status
    const status = await exec('git status --porcelain ' + filename);
    if (status.startsWith('??')) {
        // unversioned
        // add and commit
        await exec('git add ' + filename + ' && git commit -m "Add package score." ' + filename);
    } else if (status.startsWith('M')) {
        // modified
        await exec('git commit -m "Update package score." ' + filename);
    } else {
        // unchanged, or unkown
    }
}

//------------------------------------------------------------------------------
// helpers
//------------------------------------------------------------------------------

class Failed extends Error {
    constructor(message) {
        super(message);
        this.name = 'Failed';
    }
}

//------------------------------------------------------------------------------

function fail(message, err) {
    if (err) {
        message += ": " + (err.message || err);
    }
    throw new Failed(message);
}

//------------------------------------------------------------------------------

function httpGET(url) {
    return new Promise((resolve, reject) => {

        const https = require('https');

        https.get(url, (resp) => {
            let data = '';
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                if (resp.statusCode == 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(JSON.parse(data));
                }
            });
        }).on("error", (err) => {
            reject(err);
        });

    });
}

//------------------------------------------------------------------------------

function exec(cmd) {
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

//------------------------------------------------------------------------------

function percent(x) {
    return Math.round(x * 100) + "%";
}

//------------------------------------------------------------------------------

function diff(x, ref_x) {
    const is_percent = typeof x === 'string' && x.endsWith('%');
    if (is_percent) {
        x = parseFloat(x.substr(0, x.length - 1));
        ref_x = parseFloat(ref_x.substr(0, ref_x.length - 1));
    }
    let d = x - ref_x;
    if (d > 0) {
        // value increased
        d = chalk.green('+' + d);
    } else if (d < 0) {
        // value decreased
        d = chalk.red('-' + d);
    } else {
        // value stayed the same
        return null;
    }
    if (is_percent) {
        // difference of two percentages == percentage point (pp)
        d = d + ' pp';
    } else {
        d = d + '   '; // for proper padding
    }
    return d;
}

//------------------------------------------------------------------------------

function output(name, value, ref_value) {
    const d = (ref_value != null) && diff(value, ref_value);
    console.log(padEnd(name, 16) + chalk.bold.gray(' : ') + padStart(value, 14), 
        d ? padStart(d, 10) : '');
}

//------------------------------------------------------------------------------

function padStart(s, n) {
    s = "" + s;
    return s.padStart(n - stripAnsi(s).length + s.length);
}

//------------------------------------------------------------------------------

function padEnd(s, n) {
    s = "" + s;
    return s.padEnd(n - stripAnsi(s).length + s.length);
}

//------------------------------------------------------------------------------

function hrule(ch) {
    console.log(chalk.bold.gray(ch.repeat(33)));
}


//------------------------------------------------------------------------------
// main
//------------------------------------------------------------------------------

async function main() {

    // parse command line arguments
    const parser = new argparse.ArgumentParser({
        version: THIS_PKG.version,
        addHelp: true,
        description: THIS_PKG.description
    });
    parser.addArgument('package', {
        nargs: '?',
        help: 'Name of package to score. Use current package when omitted.'
    });
    parser.addArgument(['-s', '--save-report'], {
        metavar: 'file',
        nargs: '?',
        constant: DEFAULT_SCORE_FILE,
        help: 'Save report to file. Default: ' + DEFAULT_SCORE_FILE
    });
    parser.addArgument(['-d', '--diff'], {
        metavar: 'file',
        nargs: '?',
        constant: DEFAULT_SCORE_FILE,
        help: 'Report for comparison. Default: ' + DEFAULT_SCORE_FILE
    });
    parser.addArgument(['-c', '--commit'], {
        action: 'storeTrue',
        help: 'Commit saved report.'
    });
    parser.addArgument(['-q', '--quiet'], {
        action: 'storeTrue',
        help: 'Quiet mode.'
    });    
    
    const args = parser.parseArgs();

    // get package name
    const packagename = args.package || getCurrentPackageName();
    if (!packagename) {
        fail("no module name specified and no module found in current working directory");
    }

    // get package score from https://npms.io
    const report = await getActualPackageReport(packagename);

    // save report if specified
    if (args.save_report) {
        savePackageReport(args.save_report, report);
        // commit report if specified
        if (args.commit) {
            await commitReport(args.save_report);
        }
    }

    // load reference score if specified
    let ref_score;
    if (args.diff) {
        // exists?
        if (fs.existsSync(args.diff)) {
            // yes -> load it
            ref_score = loadPackageReport(args.diff).result;
        } else {
            // no -> trace warning
            console.warn("Warning: cannot display differences, " + args.diff + " not found.");
        }
    }

    // get published package version from npm
    let published_version;
    try {
        published_version = await exec("npm show " + packagename + " version");
    } catch (err) {
        fail("failed to get published package version", err);
    }

    // output summary
    if (!args.quiet) {
        outputScoreSummary(published_version, report.result, ref_score);
    }
}

// entry point
if (require.main === module) {
    // call main
    main().catch((err) => {
        // handle error
        if (err instanceof Failed) {
            // known error, no stack trace
            console.error(THIS_PKG.name + ":", err.message);
        } else {
            // unknown error, output stack trace
            console.error(THIS_PKG.name + ":", err);
        }
        // fail
        process.exit(1);
    });
}

//------------------------------------------------------------------------------
// end of file
//------------------------------------------------------------------------------
