import {BaseTask} from "../core/base-task";
import {Task} from "../decorators/task.decorator";

export default class Deploy extends BaseTask {

    @Task()
    async init() {

    }

    @Task()
    async clean() {
        const command =
            `(ls -rd ${this.config.releasesPath}/*|head -n ${this.config.keepReleases};` +
            `ls -d ${this.config.releasesPath}/*)|sort|uniq -u|xargs rm -rf`;
        await this.connection.run(command)
    }

    @Task()
    async fetch() {

    }

    @Task()
    async update() {

    }

    @Task()
    async publish() {

    }

    @Task()
    async finish() {

    }
}
