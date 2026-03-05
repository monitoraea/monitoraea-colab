module.exports = [
    {
        method: 'get', route: '/', func: async () => {
            return false;
        },
        method: 'post', route: '/', func: async () => {
            return false;
        },
        method: 'put', route: '/:id', func: async () => {
            return false;
        },
        method: 'delete', route: '/:id', func: async () => {
            return false;
        }
    }
]