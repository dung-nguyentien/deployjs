import {BaseTask} from '../core/base-task';
import {Task} from '../decorators/task.decorator';
import * as fs from 'fs';
import * as path from 'path';
import * as tmp from 'tmp';
import {CommandHelper} from '../helpers/command.helper';

export default class Deploy extends BaseTask {

    @Task()
    async init() {

    }

    @Task()
    async clean() {
        const command =
            `(ls -rd ${this.config.releasesPath}/*|head -n ${this.config.keepReleases};` +
            `ls -d ${this.config.releasesPath}/*)|sort|uniq -u|xargs rm -rf`;
        await this.connection.run(command);
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

    @Task()
    async fetch() {
        if (this.config.respositoryUrl) {
            await this.deployer.run('git:init');
        }
    }


    @Task()
    async update() {

    }

    @Task()
    async publish() {
        this.log.info(`Publishing release ${this.config.releasePath}`);

        const relativeReleasePath = path.join('releases', this.config.releaseDirname);

        CommandHelper.create()
            .cd(this.config.deployTo)
            .and()
            .if('[ -d current ] && [ ! -L current ];')
            .echo('ERR: could not make symlink')
            .else()
            .ln('-nfs', relativeReleasePath, 'current_tmp')
            .and()
            .mv('-fT', 'current_tmp', 'current')
            .endIf();

        /* eslint-disable prefer-template */
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

    @Task()
    async finish() {

    }
}
