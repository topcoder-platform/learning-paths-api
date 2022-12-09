const stripeService = require('../services/StripePaymentService')

/**
 * Creates subsription in Stripe to prepare for payment
 */
async function createSubscriptionHandler(req, res) {
    // get the customer per email from stripe
    let customer = await stripeService.getCustomerPerEmail(req.authUser.email)
    // if not exists create it
    if (!customer.data.length) {
        customer = await stripeService.createCustomer({
            email: req.authUser.email,
            name: req.authUser.name,
            metadata: {
                userId: req.authUser.userId,
                handle: req.authUser.handle
            }
        })
    } else {
        customer = customer.data[0]
    }
    // create the user's subscription
    const subscription = await stripeService.createSubscription({
        customer: customer.id,
        items: req.body.items,
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
    })

    res.json({
        customer,
        subscription
    })
}

module.exports = {
    createSubscriptionHandler
}
