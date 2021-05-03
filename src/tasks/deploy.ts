import {BaseTask} from '../core/base-task';
import {Task} from '../decorators/task.decorator';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import {equalValues, formatString} from '../helpers/ultil.helper';
import * as moment from 'moment';
import * as rmfr from 'rmfr';

export class Deploy extends BaseTask {
    async getRevision(releaseDir) {
        const file = path.join(this.config.releasePath, releaseDir, 'REVISION');
        const response = await this.execRemote(
            `if [ -f ${file} ]; then cat ${file} 2>/dev/null; fi;`
        );
        return response[0].stdout.trim();
    }

    async getCurrentReleaseDirname() {
        const results =
            (await this.execRemote(`if [ -h ${this.config.currentPath} ]; then readlink ${this.config.currentPath}; fi`)) || [];
        const releaseDirnames = results.map(result => {
            if (!result.stdout) return null;
            const target = result.stdout.replace(/\n$/, '');
            return target.split(path.sep).pop();
        });

        if (!equalValues(releaseDirnames)) {
            throw new Error('Remote servers are not synced.');
        }

        if (!releaseDirnames[0]) {
            this.log.info('No current release found.');
            return null;
        }

        return releaseDirnames[0];
    }


    @Task({
        after: 'init'
    })
    async init() {
        this.config.currentPath = path.join(this.config.deployTo, 'current')
        this.config.releasePath = path.join(this.config.deployTo, 'releases');
    }

    @Task({
        before: 'deploy:fetch'
    })
    async setupWorkspace() {
        const {keepWorkspace, workspace, shallowClone} = this.config;

        this.log.info('Setup workspace...');
        if (workspace) {
            this.config.workspace = workspace;
        }

        if (shallowClone) {
            const tmpDir = await tmp.dir({mode: '0755'});
            this.config.workspace = tmpDir.path;

            if (workspace) {
                this.log.info(`Warning: Workspace path from config ("${workspace}") is being ignored, when shallowClone: true`);
            }

            this.log.info(`Temporary workspace created: "${this.config.workspace}"`);
        }
        if (!fs.existsSync(this.config.workspace)) {
            this.log.info('Create workspace folder: ', this.config.workspace)
            fs.mkdirSync(this.config.workspace, {recursive: true});
        }
        if (!this.config.workspace) {
            throw new Error(
                `Workspace dir is required. Current value is: ${this.config.workspace}`
            );
        }

        if (!keepWorkspace && path.resolve(this.config.workspace) === process.cwd()) {
            throw new Error(
                'Workspace should be a temporary directory. To use current working directory set keepWorkspace: true'
            );
        }

        this.log.info('Workspace ready.');
    }

    @Task({
        after: 'deploy:init'
    })
    async fetch() {
        if (this.config.repositoryUrl) {
            await this.deployer.run('git:init');
        }
    }


    @Task({
        after: 'deploy:fetch'
    })
    async update() {

    }

    @Task({
        before: 'deploy:update'
    })
    async setPreviousRelease() {
        this.config.previousRelease = null;
        const currentReleaseDirname = await this.getCurrentReleaseDirname();
        if (currentReleaseDirname) {
            this.log.info('Previous release found.');
            this.config.previousRelease = currentReleaseDirname;
            console.log(currentReleaseDirname);
        }
    }

    @Task({
        after: 'deploy:set-previous-release'
    })
    async setPreviousRevision() {
        this.config.previousRevision = null;
        if (!this.config.previousRelease) return;

        const revision = await this.getRevision(this.config.previousRelease);
        if (revision) {
            this.log.info('Previous revision found.');
            this.config.previousRevision = revision;
        }
    }

    @Task({
        after: 'deploy:set-previous-revision'
    })
    async createReleasePath() {
        this.config.releaseDirname = moment.utc().format('YYYYMMDDHHmmss');
        this.config.currentReleasePath = path.join(this.config.releasePath, this.config.releaseDirname);
        this.log.info(`Create release path ${this.config.currentReleasePath}`);
        await this.execRemote(`mkdir -p ${this.config.currentReleasePath}`);
        this.log.info('Release path created.');
    }

    @Task({
        after: 'deploy:create-release-path'
    })
    async copyPreviousRelease() {
        const copyParameter = this.config.copy || '-a';
        if (!this.config.previousRelease || this.config.copy === false) return;
        this.log.info(`Copy previous release to ${this.config.currentReleasePath}`);
        await this.execRemote(`cp ${copyParameter} ${path.join(this.config.releasePath, this.config.previousRelease)}/. ${this.config.currentReleasePath}`);
    }

    @Task({
        after: 'deploy:copy-previous-release'
    })
    async remoteCopy() {
        const options = this.config.deploy?.remoteCopy || {
            rsync: '--del'
        };
        const rsyncFrom = this.config.rsyncFrom || this.config.workspace;
        const uploadDirPath = path.resolve(rsyncFrom, this.config.dirToCopy || '');

        this.log.info('Copy project to remote servers.');

        let srcDirectory = `${uploadDirPath}/`;
        if (options.copyAsDir) {
            srcDirectory = srcDirectory.slice(0, -1);
        }
        await this.execRemote(`mkdir -p ${this.config.deployTo}`);
        await this.copyRemote(srcDirectory, this.config.currentReleasePath, options);
        this.log.info('Finished copy.');
    }


    @Task({
        after: 'deploy:remote-copy'
    })
    async setCurrentRevision() {
        this.log.info('Setting current revision and creating revision file.');

        const response = await this.execLocal(
            `git rev-parse ${this.config.branch}`,
            {
                cwd: this.config.workspace
            }
        );
        this.config.currentRevision = response.trim();
        await this.execRemote(
            `echo "${this.config.currentRevision}" > ${path.join(
                this.config.currentReleasePath,
                'REVISION'
            )}`
        );
        this.log.info('Revision file created.');
    }

    @Task({
        after: 'deploy:set-current-revision'
    })
    async removeWorkspace() {
        if (!this.config.keepWorkspace && this.config.shallowClone) {
            this.log.info(`Removing workspace "${this.config.workspace}"`);
            await rmfr(this.config.workspace);
            this.log.info('Workspace removed.');
        }
    }

    @Task({
        after: 'deploy:update'
    })
    async publish() {
        this.log.info(`Publishing release ${this.config.currentReleasePath}`);
        const relativeReleasePath = path.join('releases', this.config.releaseDirname);
        const results = await this.execRemote(
            'cd ' +
            this.config.deployTo +
            ' && ' +
            'if [ -d current ] && [ ! -L current ]; then ' +
            'echo "ERR: could not make symlink"; ' +
            'else ' +
            'ln -nfs ' +
            relativeReleasePath +
            ' current_tmp && ' +
            'mv -fT current_tmp current; ' +
            'fi'
        );
        for (let result of results) {
            if (result.stdout.includes('could not make symlink')) {
                this.log.warning(
                    `Symbolic link at remote not made, as something already exists at ${path.join(
                        this.config.deployTo,
                        'current'
                    )}`
                );
            }
        }

        this.log.info('Release published.');
    }

    @Task({
        after: 'deploy:publish'
    })
    async clean() {
        const command =
            `(ls -rd ${this.config.releasePath}/*|head -n ${this.config.keepReleases || 5};` +
            `ls -d ${this.config.releasePath}/*)|sort|uniq -u|xargs rm -rf`;
        await this.execRemote(command);
    }

    @Task({
        after: 'deploy:clean'
    })
    async finish() {

    }
}
