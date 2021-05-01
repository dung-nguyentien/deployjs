import * as program from 'commander';
import {Deployer} from '../deployer';

program
    .usage('<environment> <project>')
    .option('--projects', 'List available project')
    .option('--config', 'Set config file');

program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.help();
}

const [environment, project, config] = program.args;
console.log(environment, project, config);
const deployer = new Deployer({environment});

// try {
//     const module = require(env.configPath);
//     const initialize =
//         typeof module.default === 'function' ? module.default : module;
//     initialize(deployer);
// } catch (error) {
//     console.error(chalk.red('Could not load async config'));
//     throw error;
// }
// console.log('Vo day');
