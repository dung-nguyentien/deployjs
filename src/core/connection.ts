import {Client, ClientChannel, ConnectConfig, SFTPWrapper} from 'ssh2';

export default class Connection {
    private connection: Client;

    async open(config: ConnectConfig) {
        return new Promise((resolve, reject) => {
            this.connection = new Client();
            this.connection
                .on('ready', resolve)
                .on('error', reject)
                .connect(config)
        });
    }

    run(command): Promise<ClientChannel> {
        return new Promise((resolve, reject) => {
            this.connection.exec(command, (error, stream) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stream);
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
}
