import {Deployer} from '../deployer';

export class Index {
    constructor(private deployer: Deployer) {
    }

    config() {
        return {
            default: {
                workspace: '/var/www/aaz/builds/deploy',
                deployTo: '/var/www/aaz/deploy',
                ignores: ['.git'],
                shallowClone: false,
                keepWorkspace: true,
                deploy: {
                    remoteCopy: {
                        copyAsDir: true,
                    },
                }
            },
            develop: {
                branch: 'develop'
            }
        };
    }
}
