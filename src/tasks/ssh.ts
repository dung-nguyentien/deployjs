import {BaseTask} from '../core/base-task';
import {Task} from '../decorators/task.decorator';
import SshConnection from '../core/ssh-connection';

export class Ssh extends BaseTask {
    @Task({
        before: 'deploy:init'
    })
    async initConnections() {
        let connections: SshConnection[] = [];

        for (let server of this.config.servers) {
            let connection = new SshConnection();
            await connection.open({});
            connections.push(connection);
        }
        this.deployer.connections = connections;
    }
}
