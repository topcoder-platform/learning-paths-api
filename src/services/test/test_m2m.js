const helper = require('../../common/helper');

(async () => {
    const handle = 'testflyjets';
    const userId = '88778750'
    const userIds = ['88778750', '40158994', '40152855'];

    // const memberdata = await helper.getMemberDataFromIdM2M(userId);
    const memberData = await helper.getMultiMemberDataFromIdM2M(userIds);
    console.log(memberData);
})();