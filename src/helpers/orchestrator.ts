export class Orchestrator {
    public queues = [];
    public events: any[] = [];

    public add(name, action) {
        this.queues.push({
            name,
            action
        });
    }

    async emit(name) {
        let events = this.events.filter(e => e.name === name);
        for (let event of events) {
            if (typeof event.action === 'string') {
                await this.run(event.action);
            } else {
                await event.action();
            }
        }
    }

    async run(name: string) {
        let queue = this.queues.find(q => q.name === name);
        if (!queue) {
            throw new TypeError('Can not find task: \t' + name);
        }
        await this.emit(`before:${name}`);
        await queue.action();
        await this.emit(`after:${name}`);
    }

    public on(event: string, action) {
        this.events.push({
            name: event,
            action: action
        })
    }
}
