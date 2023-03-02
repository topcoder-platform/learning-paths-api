const helper = require('../../common/helper');

(async () => {
    const handle = "glenny"
    // const handle = 'chris.mccann@topcoder.com';

    const memberdata = await helper.getMemberDataM2M(handle);
    console.log(memberdata);
})();