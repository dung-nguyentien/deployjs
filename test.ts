import {Deployer} from './deployer';

let deployer = new Deployer();
deployer.before('init', () => {
    console.log('ok');
});
deployer.init();
