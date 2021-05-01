import {BaseTask} from '../core/base-task';
import {Task} from '../decorators/task.decorator';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import {equalValues, formatString} from '../helpers/ultil.helper';
import * as moment from 'moment';
import * as rmfr from 'rmfr';

export default class Deploy extends BaseTask {
    async getRevision(releaseDir) {
        const file = path.join(this.config.releasesPath, releaseDir, 'REVISION');
        const response = await this.execRemote(
            `if [ -f ${file} ]; then cat ${file} 2>/dev/null; fi;`
        );
        return response[0].stdout.trim();
    }

    async getCurrentReleaseDirname() {
        const results =
            (await this.execRemote(
                formatString(
                    'if [ -h %s ]; then readlink %s; fi',
                    this.config.currentPath,
                    this.config.currentPath
                )
            )) || [];

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
            // eslint-disable-next-line no-param-reassign
            this.config.workspace = tmpDir.path;

            if (workspace) {
                this.log.info(`Warning: Workspace path from config ("${workspace}") is being ignored, when shallowClone: true`);
            }

            this.log.info(`Temporary workspace created: "${this.config.workspace}"`);
        }

        if (!this.config.workspace || !fs.existsSync(this.config.workspace)) {
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
        if (this.config.respositoryUrl) {
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
    async copyPreviousRelease() {
        const copyParameter = this.config.copy || '-a';
        if (!this.config.previousRelease || this.config.copy === false) return;
        this.log.info(`Copy previous release to ${this.config.releasePath}`);
        await this.execRemote(
            formatString(
                'cp %s %s/. %s',
                copyParameter,
                path.join(this.config.releasePath, this.config.previousRelease),
                this.config.releasePath
            )
        );
    }

    @Task({
        after: 'deploy:copy-previous-release'
    })
    async createReleasePath() {
        this.config.releaseDirname = moment.utc().format('YYYYMMDDHHmmss');
        this.config.releasePath = path.join(this.config.releasePath, this.config.releaseDirname);
        this.log.info(`Create release path ${this.config.releasePath}`);
        await this.execRemote(`mkdir -p ${this.config.releasePath}`);
        this.log.info('Release path created.');
    }

    @Task({
        after: 'deploy:create-release-path'
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
        await this.copyRemote(srcDirectory, this.config.releasePath, options);
        this.log.info('Finished copy.');
    }

    @Task({
        after: 'deploy:remote-copy'
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
    async setPreviousRelease() {
        this.config.previousRelease = null;
        const currentReleaseDirname = await this.getCurrentReleaseDirname();
        if (currentReleaseDirname) {
            this.log.info('Previous release found.');
            this.config.previousRelease = currentReleaseDirname;
        }
    }

    @Task({
        after: 'deploy:set-previous-release'
    })
    async setCurrentRevision() {
        this.log.info('Setting current revision and creating revision file.');

        const response = await this.execLocal(
            `git rev-parse ${this.config.branch}`,
            {
                cwd: this.config.workspace
            }
        );

        this.config.currentRevision = response.stdout.trim();
        await this.execRemote(
            `echo "${this.config.currentRevision}" > ${path.join(
                this.config.releasePath,
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
        this.log.info(`Publishing release ${this.config.releasePath}`);
        const relativeReleasePath = path.join('releases', this.config.releaseDirname);
        const res = await this.execRemote(
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
        const failedresult =
            res && res.stdout
                ? res.stdout.filter(r => r.indexOf('could not make symlink') > -1)
                : [];
        if (failedresult.length && failedresult.length > 0) {
            this.log.warning(
                `Symbolic link at remote not made, as something already exists at ${path.join(
                    this.config.deployTo,
                    'current'
                )}`
            );
        }
        this.log.info('Release published.');
    }

    @Task({
        after: 'deploy:publish'
    })
    async clean() {
        const command =
            `(ls -rd ${this.config.releasesPath}/*|head -n ${this.config.keepReleases};` +
            `ls -d ${this.config.releasesPath}/*)|sort|uniq -u|xargs rm -rf`;
        await this.execRemote(command);
    }

    @Task({
        after: 'deploy:clean'
    })
    async finish() {

    }
}
