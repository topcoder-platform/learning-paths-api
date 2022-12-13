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
 * Member purchase ertification
 */
async function purchaseCertificationsHandler(req, res) {
    // get or create the customer per email from stripe
    const customer = await stripeService.getOrCreateCustomerPerEmail(req.authUser)
    // prepare invoice for this purchase
    const invoice = await stripeService.createCertificationInvoice(customer.id, req.body.priceIDs)

    res.json({
        invoice: invoice.id,
        paymentIntent: invoice.payment_intent
    })
}

module.exports = {
    searchPricesHandler,
    searchProductsHandler,
    createSubscriptionHandler,
    purchaseCertificationsHandler,
    getPriceHandler,
}
