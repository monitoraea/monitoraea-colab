const services = require('.');

module.exports = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Origens Brasil® API",
            version: "0.1.0",
            description:
                "Esta é a documentacao da API do Origens Brasil® com OpenAPI",
            license: {
                name: "MIT",
                url: "https://spdx.org/licenses/MIT.html",
            },
            contact: {
                name: "Origens Brasil®",
                url: "https://www.origensbrasil.org.br",
                email: "contato@origensbrasil.org.br",
            },
        },
        servers: [
            {
                url: "http://localhost:4004", /* TODO */
            },
        ],
    },
    apis: services.reduce((accum, m) => [
        ...accum, 
        `./services/${m}/schema.js`,
        `./services/${m}/routes.js`,
    ], []),
};