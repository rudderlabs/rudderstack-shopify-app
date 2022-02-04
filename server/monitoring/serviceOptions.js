import bugsnag from './bugsnag';
// import requestTracer from './requestTracer';

const serviceOptions = {
    bugsnag,
    prometheus: {
        collectDefaultMetrics: true,
        defaultLabels: {
            application_name: 'rudder-shopify-app',
        },
    }
};

export default serviceOptions;

