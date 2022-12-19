
const db = require('../models');

(async () => {
    const providers = await db.ResourceProvider.findAll();
    console.log("All providers:", JSON.stringify(providers, null, 2));
})();