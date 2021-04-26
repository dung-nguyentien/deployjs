import * as fs from 'fs';
import * as path from 'path';

export const config = {
    rootPath: null,
    taskPath: () => {
        return path.join(config.rootPath, 'src/tasks');
    },
    tasks: []
};
