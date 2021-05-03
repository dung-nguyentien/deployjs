import {BaseProject} from '../../src/core/base-project';

export class Test extends BaseProject {
    public config() {
        return {
            default: {
                repositoryUrl: 'git@bitbucket.org:foodypocket/foodypocket-backend.git',
            },
            develop: {
                servers: [
                    {
                        host: 'localhost',
                        port: 49153,
                        user: 'root',
                        password: 'root'
                    }
                ]
            }
        }
    }

    public tasks() {
        this.after('init', () => {

        })
    }
}
