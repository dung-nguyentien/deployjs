import {BaseTask} from '../core/base-task';
import {Task} from '../decorators/task.decorator';
import SshConnection from '../core/ssh-connection';

export class Ssh extends BaseTask {
    @Task({
        before: 'deploy:init'
    })
    async initConnections() {
        let connections: SshConnection[] = [];
        console.log(this.config);
        for (let server of this.config.servers) {
            let connection = new SshConnection();
            await connection.open({
                host: server.host,
                username: server.user,
                password: server.password,
                port: server.port
            });
            connections.push(connection);
        }
        this.deployer.connections = connections;
    }
}
