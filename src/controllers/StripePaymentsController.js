const stripeService = require('../services/StripePaymentService')

/**
 * Creates subsription in Stripe
 */
async function createSubscriptionHandler(req, res) {
    // get or create the customer per email from stripe
    const customer = await stripeService.getOrCreateCustomerPerEmail(req.authUser)
    // create the user's subscription
    const subscription = await stripeService.createSubscription({
        customer: customer.id,
        items: req.body.items,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
    })

    res.json({
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        subscriptionId: subscription.id
    })
}

/**
 * Search prices in Stripe
 */
async function searchPricesHandler(req, res) {
    const search = await stripeService.searchPrices({
        ...req.query,
        expand: ['data.product']
    })

    res.json(search)
}

/**
 * Search products in Stripe
 */
async function searchProductsHandler(req, res) {
    const search = await stripeService.searchProducts({
        ...req.query,
        expand: ['data.default_price']
    })

    res.json(search)
}

/**
 * Get price from Stripe by id
 */
async function getPriceHandler(req, res) {
    const price = await stripeService.getPriceById(req.params.id)

    res.json(price)
}

/**
 * Create payment with invoince in Stripe
 * 
 * Payment is prepared for confirmation on the front-end and client secret is returned.
 * Invoice is created from array of price IDs from the body payload.
 * 
 * used for:
 * - member purchase TCA certification, aka Enroll Payment
 */
async function cretatePaymentHandler(req, res) {
    // get or create the customer per email from stripe
    const customer = await stripeService.getOrCreateCustomerPerEmail(req.authUser)
    // prepare invoice from price IDs
    const paymentSheet = await stripeService.createInvoice(customer.id, req.body.priceIDs)

    res.json(paymentSheet)
}

/**
 * Get product from Stripe
 */
async function getProductHandler(req, res) {
    const product = await stripeService.getProductById(req.params.id)

    res.json(product)
}

module.exports = {
    searchPricesHandler,
    searchProductsHandler,
    createSubscriptionHandler,
    cretatePaymentHandler,
    getPriceHandler,
    getProductHandler,
}
