const config = require('config')

const stripe = require('stripe')(config.STRIPE.SECRET_KEY, {
    apiVersion: config.STRIPE.API_VERSION
});


/**
 * Create a customer in Stripe
 * @param {Object} The customer. See: https://stripe.com/docs/api/customers/create
 */
async function createCustomer(customer) {
    return stripe.customers.create(customer)
}

/**
 * Create a customer in Stripe
 * @param {String} The customer's email 
 */
 async function getCustomerPerEmail(email) {
    return stripe.customers.list({ email })
}

/**
 * Create a subscription object in Stripe
 */
async function createSubscription(subscription) {
    return stripe.subscriptions.create(subscription)
}

module.exports = {
    createSubscription,
    getCustomerPerEmail,
    createCustomer
}
