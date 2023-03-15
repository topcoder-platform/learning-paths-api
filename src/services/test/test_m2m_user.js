const { EC2MetadataCredentials } = require('aws-sdk');
const helper = require('../../common/helper');

(async () => {
    const emails = [
        'karthik.r96@wipro.com',
        'borra.reddy3@wipro.com',
        'prince.kumar42@wipro.com',
        // 'allan.fernando@wipro.com',
        // 'anubhav.halwai@wipro.com',
        // 'madipalli.prudhvi@wipro.com',
        // 'anupam.sinha6@wipro.com',
        // 'rohit.sharma68@wipro.com',
        // 'abhijat.sarari@wipro.com',
        // 'rohit.benake@wipro.com',
        // 'batareddy.s68@wipro.com',
        // 'sunil.e24@wipro.com',
        // 'kanakandula.rao@wipro.com',
        // 'sudhir.13@wipro.com',
        // 'lokesh.09@wipro.com'
    ]

    const memberData = await helper.getMultiUserDataFromEmails(emails);
    console.log(memberData);
})();