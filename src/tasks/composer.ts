import {BaseTask} from '../core/base-task';
import {Task} from '../decorators/task.decorator';

export class Composer extends BaseTask {
    @Task({
    })
    async install() {
        console.log('installzzzzzzz');
    }
}
