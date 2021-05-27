module.exports = {
    swaggerDefinition: {
        info: {
            titles: `${process.env.APP_NAME} API`,
            description: `${process.env.APP_NAME} API Information`,
            contact: {
                name: `Rupesh Rajhans`
            },
            host: [`${process.env.APP_URL}:${process.env.APP_PORT}`],
            basePath:'/'
        }
    },
    apis: ['./controllers/*.js']
}