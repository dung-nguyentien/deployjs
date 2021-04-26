import Deployer from './src/deployer';

let deployer = new Deployer();
deployer.before('init', () => {
    console.log('ok');
});
deployer.init();
