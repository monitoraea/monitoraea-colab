class Service {
    config = {}

    setup(config) {
        this.config = config;
    }

    get(item) {
        if (!item) return this.config;

        return this.config[item];
    }
}

const singletonInstance = new Service();
module.exports = singletonInstance;