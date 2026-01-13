import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import chalk from 'chalk';
import figures from 'figures';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const envs = {
    token: process.env.FIREBASE_TOKEN,
    qa: {
        project: process.env.FIREBASE_PROJECT_ID_QA,
        location: process.env.FIREBASE_LOCATION_QA,
        backendId: process.env.FIREBASE_BACKEND_ID_QA,
        branch: process.env.FIREBASE_GIT_BRANCH_QA,
        credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_QA
    },
    dev: {
        project: process.env.FIREBASE_PROJECT_ID_DEV,
        location: process.env.FIREBASE_LOCATION_DEV,
        backendId: process.env.FIREBASE_BACKEND_ID_DEV,
        branch: process.env.FIREBASE_GIT_BRANCH_DEV,
        credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS_DEV
    }
};

const now = () => new Date().toTimeString().split(' ')[0];
const log = (...a) => console.log(`[${now()}]`, ...a);
const error = (...a) => console.error(`[${now()}]`, ...a);

const okList = [];
const failList = [];

const targets = Object.keys(envs).filter(e => process.argv.includes(`-${e}`));
if (targets.length === 0) {
    log('Usage: node deploy.mjs [-prod] [-qa] [-dev]');
    process.exit(0);
}

function deployBackend(cfg, label) {
    const { project, backendId, branch, credentials } = cfg;

    if (![project, backendId, branch, credentials].every(Boolean)) {
        error(`${chalk.red(figures.cross)}  Missing config for ${label}`);
        failList.push(label);
        return Promise.resolve();
    }

    log(`${chalk.cyan(figures.play)}  Deploying ${chalk.bold(label)} → backend ‘${backendId}’ `
        + `(branch ${chalk.yellow(branch)}) in project ${chalk.green(project)}`);

    const cmd = [
        'firebase', 'apphosting:rollouts:create', backendId,
        '--git-branch', branch,
        '--project', project,
        '--non-interactive', '--json'
    ];

    const child = spawn(cmd[0], cmd.slice(1), {
        env: { ...process.env, GOOGLE_APPLICATION_CREDENTIALS: path.join(__dirname, credentials) },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', d =>
        log(`${chalk.dim(label)} › ${d.toString().trim().split('\n').join(`\n${chalk.dim(label)} › `)}`));
    child.stderr.on('data', d =>
        error(`${chalk.dim(label)} › ${d.toString().trim().split('\n').join(`\n${chalk.dim(label)} › `)}`));

    return new Promise(res => {
        child.on('close', code => {
            if (code === 0) {
                okList.push(label);
                log(`${chalk.green(figures.tick)}  ${label} rollout command exited 0`);
            } else {
                failList.push(label);
                error(`${chalk.red(figures.cross)}  ${label} rollout command exited ${code}`);
            }
            log(chalk.gray('─'.repeat(60)));
            res();
        });
    });
}

await Promise.all(targets.map(env => deployBackend(envs[env], env)));

if (okList.length) {
    log(`${chalk.green(figures.tick)}  Succeeded: ${chalk.bold(okList.join(', '))}`);
}
if (failList.length) {
    error(`${chalk.red(figures.cross)}  Failed   : ${chalk.bold(failList.join(', '))}`);
    process.exitCode = 1;
} else {
    log(chalk.green(figures.tick), 'All requested rollouts initiated successfully.');
}
