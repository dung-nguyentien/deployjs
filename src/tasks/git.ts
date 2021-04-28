import {BaseTask} from '../core/base-task';
import {Task} from '../decorators/task.decorator';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';

export default class Git extends BaseTask {
    @Task()
    async init() {
        this.log.info(`Initialize local repository in ${this.config.workspace}`);
        await this.execLocal('git init', {cwd: this.config.workspace});
        this.log.info('Repository initialized.');
    }

    @Task({
        after: 'git:init'
    })
    async setGitConfig() {
        if (!this.config.gitConfig) return;

        this.log.info(`Set custom git config options for ${this.config.workspace}`);

        await Promise.all(
            Object.keys(this.config.gitConfig || {}).map(key =>
                this.execLocal(`git config ${key} "${this.config.gitConfig[key]}"`, {
                    cwd: this.config.workspace
                })
            )
        );
        this.log.info('Git config set.');
    }

    @Task({
        after: 'git:set-git-config'
    })
    async addRemote() {
        this.log.info('List local remotes.');

        const res = await this.execLocal('git remote', {
            cwd: this.config.workspace
        });

        const remotes = res.stdout ? res.stdout.split(/\s/) : [];
        const method = remotes.indexOf('shipit') !== -1 ? 'set-url' : 'add';

        this.log.info(
            `Update remote ${this.config.repositoryUrl} to local repository ${this.config.workspace}`
        );

        // Update remote.
        await this.execLocal(
            `git remote ${method} shipit ${this.config.repositoryUrl}`,
            {cwd: this.config.workspace}
        );

        this.log.info('Remote updated.');
    }

    @Task({
        after: 'git:add-remote'
    })
    async fetch() {
        let fetchCommand = 'git fetch shipit --prune';
        const fetchDepth = this.config.shallowClone ? ' --depth=1' : '';
        fetchCommand += `${fetchDepth} && ${fetchCommand} "refs/tags/*:refs/tags/*"`;
        this.log.info('Fetching repository ' + this.config.repositoryUrl);
        await this.execLocal(fetchCommand, {cwd: this.config.workspace});
        this.log.info('Repository fetched.');
    }

    @Task({
        after: 'git:fetch'
    })
    async checkout() {
        this.log.info('Checking out commit-ish' + this.config.branch);
        await this.execLocal(`git checkout ${this.config.branch}`, {
            cwd: this.config.workspace
        });
        this.log.info('Checked out.');
    }

    @Task({
        after: 'git:checkout'
    })
    async reset() {
        this.log.info('Resetting the working tree');
        await this.execLocal('git reset --hard HEAD', {
            cwd: this.config.workspace
        });
        this.log.info('Reset working tree.');
    }

    @Task({
        after: 'git:reset'
    })
    async merge() {
        this.log.info('Testing if commit-ish is a branch.');

        const res = await this.execLocal(
            `git branch --list ${this.config.branch}`,
            {
                cwd: this.config.workspace
            }
        );

        const isBranch = !!res.stdout;

        if (!isBranch) {
            this.log.info('No branch, no merge.');
            return;
        }

        this.log.info('Commit-ish is a branch, merging...');

        await this.execLocal(`git merge shipit/${this.config.branch}`, {
            cwd: this.config.workspace
        });

        this.log.info('Branch merged.');
    }

    @Task({
        after: 'git:merge'
    })
    async updateSubmodules() {
        if (!this.config.updateSubmodules) return;

        this.log.info('Updating submodules.');
        await this.execLocal('git submodule update --init --recursive', {
            cwd: this.config.workspace
        });
        this.log.info('Submodules updated');
    }

}
