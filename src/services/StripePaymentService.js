const config = require('config');

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
 * Get or create a customer in Stripe by email
 * @param {Object} customerUser The new customer - uses req.authUser from the auth
 */
async function getOrCreateCustomerPerEmail(customerUser) {
    let customer = await stripe.customers.list({ email: customerUser.email })
    // if not exists, create it
    if (!customer.data.length) {
        customer = await createCustomer({
            email: customerUser.email,
            name: customerUser.name,
            metadata: {
                userId: customerUser.userId,
                handle: customerUser.handle
            }
        })
    } else {
        customer = customer.data[0]
    }

    return customer
}

/**
 * Create a subscription object in Stripe
 */
async function createSubscription(subscription) {
    return stripe.subscriptions.create(subscription)
}

/**
 * Search prices in Stripe
 */
async function searchPrices(query) {
    return stripe.prices.search(query)
}

/**
 * Search products in Stripe
 */
async function searchProducts(query) {
    return stripe.products.search(query)
}

/**
 * Get price from Stripe by API id
 * @param {string} priceId 
 */
async function getPriceById(priceId) {
    return stripe.prices.retrieve(priceId)
}

/**
 * Create invoice
 * @param {String} customerId The id of the customer paying
 * @param {String[]} price IDs that should be invoice items
 */
async function createInvoice(customerId, priceIDs) {
    // create items for cert invoice
    for (const priceId of priceIDs) {
        await stripe.invoiceItems.create({
            customer: customerId,
            price: priceId,
        });
    }
    // create customer invoice
    const invoice = await stripe.invoices.create({
        auto_advance: false,
        customer: customerId,
        expand: ['payment_intent']
    })
    // finalize the invoice
    const finalInvoice = await stripe.invoices.finalizeInvoice(invoice.id)
    // get the client secret from the payment intent
    const clientSecret = await stripe.paymentIntents.retrieve(finalInvoice.payment_intent)

    return {
        invoiceId: finalInvoice.id,
        clientSecret: clientSecret.client_secret
    }
}

/**
 * Get product from Stripe by API id
 * @param {string} productId 
 */
async function getProductById(productId) {
    const product = await stripe.products.retrieve(productId)

    // expand default price if set
    if (product.default_price) {
        product.default_price = await getPriceById(product.default_price)
    }

    // load product prices
    // default limit is 10, for more update if needed
    product.prices = await stripe.prices.list({
        active: true,
        product: productId
    })

    return product
}

module.exports = {
    createSubscription,
    getOrCreateCustomerPerEmail,
    createCustomer,
    searchPrices,
    searchProducts,
    createInvoice,
    getPriceById,
    getProductById,
}
