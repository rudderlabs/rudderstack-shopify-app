// import fs from 'fs';
// import Bugsnag from '@bugsnag/js';

// let version = 'notset';
// try {
//     version = fs.readFileSync('./dist/.version.txt', 'utf8');
// } catch (error) {
//     logger.error(error);
// }
let version = '1.0.0';  // TODO: make this dynamic

const bugsnag = {
    apiKey: process.env.BUGSNAG_KEY,
    appVersion: version,
    redactedKeys: ['authorization', 'password', 'token'],
};

// export const bugsnagClient = Bugsnag.createClient({
//     apiKey: process.env.API_BUGSNAG_KEY,
//     appVersion: version,
// });

export default bugsnag;
