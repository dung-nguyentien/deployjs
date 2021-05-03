import {Client, ClientChannel, ConnectConfig, SFTPWrapper} from 'ssh2';
import * as shelljs from 'shelljs';

export default class SshConnection {
    private connection: Client;
    private config: ConnectConfig;

    async open(config: ConnectConfig) {
        this.config = config;
        return new Promise((resolve, reject) => {
            this.connection = new Client();
            this.connection
                .on('ready', resolve)
                .on('error', reject)
                .connect(config)
        });
    }

    run(command, option): Promise<{ stdout: string, stderr: string }> {
        return new Promise((resolve, reject) => {
            this.connection.exec(command, option || {}, (error, stream) => {
                if (error) {
                    reject(error);
                } else {
                    let result = {
                        stdout: '',
                        stderr: ''
                    };
                    stream.on('close', function (code, signal) {
                        if (code) {
                            reject(result.stderr);
                        } else {
                            resolve(result);
                        }
                    }).on('data', function (data) {
                        console.log(data);
                        result.stdout += data;
                    }).stderr.on('data', function (data) {
                        result.stderr += data;
                    });
                }
            });
        });
    }

    getSftp(): Promise<SFTPWrapper> {
        return new Promise((resolve, reject) => {
            this.connection.sftp(function (error, sftp) {
                if (error) {
                    reject(error);
                } else {
                    resolve(sftp);
                }
            });
        });
    }

    putFile(localPath, remotePath): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let sftp = await this.getSftp();
            sftp.fastPut(localPath, remotePath, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    syncDir(from, to, options) {
        const sshCommand = this.formatSshCommand({
            port: this.config.port,
            privateKey: this.config.privateKey,
            strict: options.strict,
            extraSshOptions: options.extraSshOptions,
            tty: options.tty,
        })

        const command = this.formatRsyncCommand({
            asUser: options.asUser,
            from,
            to: `${this.config.username}@${this.config.host}:${to}`,
            remoteShell: sshCommand,
            additionalArgs: options.rsyncOptions,
            excludes: options.ignores,
        });

        console.log(command);

        return new Promise((resolve, reject) => {
            shelljs.exec(command, {
                async: true
            }, (error, stream) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stream);
                }
            });
        })
    }

    formatSshCommand({
                         port,
                         privateKey,
                         strict,
                         tty,
                         remote,
                         cwd,
                         command,
                         extraSshOptions,
                         verbosityLevel,
                     }: any) {
        let args = ['ssh']
        if (verbosityLevel) {
            switch (verbosityLevel) {
                case verbosityLevel <= 0:
                    break
                case 1:
                    args = [...args, '-v']
                    break
                case 2:
                    args = [...args, '-vv']
                    break
                default:
                    args = [...args, '-vvv']
                    break
            }
        }
        if (tty) args = [...args, '-tt']
        if (port) args = [...args, '-p', port]
        if (privateKey) args = [...args, '-i', privateKey]
        if (extraSshOptions && typeof extraSshOptions === 'object') {
            Object.keys(extraSshOptions).forEach((sshOptionsKey) => {
                args = [...args, '-o', `${sshOptionsKey}=${extraSshOptions[sshOptionsKey]}`]
            })
        }
        if (strict !== undefined)
            args = [...args, '-o', `StrictHostKeyChecking=${strict}`]
        if (remote) args = [...args, remote]

        const cwdCommand = cwd ? this.wrapCwd(cwd, command) : command
        if (command) args = [...args, this.wrapCommand(cwdCommand)]
        return args.join(' ')
    }

    escapeCommand(command) {
        return command.replace(/"/g, '\\"').replace(/\$/g, '\\$')
    }

    wrapCommand(command) {
        return `"${this.escapeCommand(command)}"`
    }

    wrapCwd(cwd, command) {
        return `cd ${cwd} > /dev/null && ${command}; cd - > /dev/null`
    }

    formatRsyncCommand({
                           asUser,
                           from,
                           to,
                           excludes,
                           additionalArgs,
                           remoteShell,
                       }: any) {
        let args = ['rsync', '--archive', '--compress']
        if (asUser) args = [...args, '--rsync-path', this.wrapCommand(`sudo -u ${asUser} rsync`)]
        if (additionalArgs) args = [...args, ...additionalArgs]
        if (excludes) args = [...args, ...this.formatExcludes(excludes)]
        if (remoteShell) args = [...args, '--rsh', this.wrapCommand(remoteShell)]
        args = [...args, from, to]
        return args.join(' ')
    }

    formatExcludes(excludes) {
        return excludes.reduce(
            (args, current) => [...args, '--exclude', `"${current}"`],
            [],
        )
    }
}
