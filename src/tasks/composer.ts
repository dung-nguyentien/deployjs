import {BaseTask} from '../core/base-task';
import {Task} from '../decorators/task.decorator';

export default class Composer extends BaseTask {
    @Task({
        before: 'init'
    })
    async install() {
        console.log('installzzzzzzz');
    }
}
