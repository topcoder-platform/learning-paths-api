const config = require('config')
const { getMemberDataM2M, postBusEvent } = require('./helper')

/**
 * Send emails via TC-BUS and SendGrid
 * @param {object} payload the email payload to send
 */
async function sendEmail(payload) {
  const defaultPayload = {
    from: {
      email: 'noreply@topcoder.com',
      name: 'Topcoder Academy'
    },
    cc: [],
    version: 'v3'
  }

  return postBusEvent('external.action.email', {
    ...defaultPayload,
    ...payload
  });
}

/**
 * Send email notification when member starts FCC course
 * 
 * @param {string} handle 
 * @param {string} email 
 * @param {object} fccCertification 
 * @param {string} providerName 
 */
async function startFccCourseEmailNotification(handle, email, fccCertification, providerName) {
  try {
    if (!config.SEND_EMAIL_NOTIFICATIONS) {
      return Promise.resolve();
    }

    // try to get user's first via the API using an m2m token.
    // if we can't, just use the user's handle.
    let userFirstName = handle;
    try {
      const memberData = await getMemberDataM2M(handle);
      userFirstName = memberData.firstName;
    } catch (error) {
      console.error('Error getting user name via m2m token, using handle', error);
    }

    console.log(`Sending TCA course welcome email to ${email}...`);

    // send the email
    await sendEmail({
      recipients: [email],
      data: {
        first_name: userFirstName,
        URL_to_tca_course: `${config.TCA_WEBSITE_URL}/learn/${providerName}/${fccCertification.certification}`
      },
      sendgrid_template_id: config.EMAIL_TEMPLATES.TCA_COURSE_START
    });

    console.log(`Sending TCA course welcome email to ${email} success.`);
  } catch (e) {
    console.error(`Sending TCA course welcome email for "${fccCertification.title}" to ${email}<${handle}> failed.`, e);
  }
}

/**
 * Send email notification when member completes FCC course
 * 
 * @param {string} handle 
 * @param {string} email 
 * @param {object} fccCertification 
 * @param {string} providerName 
 */
async function completeFccCourseEmailNotification(handle, email, fccCertification, providerName) {
  try {
    if (!config.SEND_EMAIL_NOTIFICATIONS) {
      return Promise.resolve();
    }

    // try to get user's first via the API using an m2m token.
    // if we can't, just use the user's handle.
    let userFirstName = handle;
    try {
      const memberData = await getMemberDataM2M(handle);
      userFirstName = memberData.firstName;
    } catch (error) {
      console.error('Error getting user name via m2m token, using handle', error);
    }

    console.log(`Sending TCA course completed email to ${email}...`);

    // send the email
    await sendEmail({
      recipients: [email],
      data: {
        first_name: userFirstName,
        URL_to_tca_cert_view: `${config.TCA_WEBSITE_URL}/learn/${providerName}/${fccCertification.certification}/${handle}/certificate`,
        URL_to_browse: `${config.TCA_WEBSITE_URL}/learn`
      },
      sendgrid_template_id: config.EMAIL_TEMPLATES.TCA_COURSE_COMPLETE
    });

    console.log(`Sending TCA course complete email to ${email} success.`);
  } catch (e) {
    console.error(`Sending TCA course complete email for "${fccCertification.title}" to ${email}<${handle}> failed.`, e);
  }
}

/**
 * Send email notification when member enroll into TCA cert
 * 
 * @param {string} email 
 * @param {string} userFullName 
 * @param {object} certification 
 */
async function enrollCertificationEmailNotification(email, userFullName, certification) {
  try {
    if (!config.SEND_EMAIL_NOTIFICATIONS) {
      return Promise.resolve();
    }

    console.log(`Sending TCA cert enrollment congrats email for TCA cert "${certification.title}" to ${email}...`);

    // send the email
    await sendEmail({
      recipients: [email],
      data: {
        first_name: userFullName,
        URL_to_tca_cert: `${config.TCA_WEBSITE_URL}/learn/tca-certifications/${certification.dashedName}`
      },
      sendgrid_template_id: config.EMAIL_TEMPLATES.TCA_CERT_ENROLLMENT
    });

    console.log(`TCA cert enrollment congrats email for TCA cert "${certification.title}" to ${email} sent.`);
  } catch (e) {
    console.error(`Sending enrollment congrats email for TCA cert "${certification.title}" to ${email}<${userFullName}> failed.`, e);
  }
}

/**
 * Send email notification when member completes TCA cert
 * 
 * @param {string} handle 
 * @param {object} certification 
 */
async function completeCertificationEmailNotification(handle, certification) {
  try {
    if (!config.SEND_EMAIL_NOTIFICATIONS) {
      return Promise.resolve();
    }

    // we need member's email and first name
    const memberData = await getMemberDataM2M(handle);

    console.log(`Sending TCA cert completion email to ${memberData.email}...`);

    // send the email
    await sendEmail({
      recipients: [memberData.email],
      data: {
        first_name: memberData.firstName,
        URL_to_browse: `${config.TCA_WEBSITE_URL}/learn`,
        URL_to_tca_cert_view: `${config.TCA_WEBSITE_URL}/learn/tca-certifications/${certification.dashedName}/${handle}/certification`,
      },
      sendgrid_template_id: config.EMAIL_TEMPLATES.TCA_CERT_COMPLETE
    });

    console.log(`TCA cert completion email sent to ${memberData.email}.`);
  } catch (e) {
    console.error(`Sending congrats email for TCA cert completion of "${certification.title}" to ${memberData.email}<${handle}> failed.`, e);
  }
}

/**
 * Send email notification when member interacts
 * with TCA course or certification for the first time
 * 
 * @param {string} email 
 * @param {string} userFullName 
 * @param {object} certification 
 */
async function firstTimerEmailNotification(email, handle) {
  try {
    if (!config.SEND_EMAIL_NOTIFICATIONS) {
      return Promise.resolve();
    }

    // we need member's email and first name
    const memberData = await getMemberDataM2M(handle);

    console.log(`Sending TCA welcome email to ${email}...`);

    // send the email
    await sendEmail({
      recipients: [email],
      data: {
        first_name: memberData.firstName,
        URL_to_tca_courses: `${config.TCA_WEBSITE_URL}/learn`,
      },
      sendgrid_template_id: config.EMAIL_TEMPLATES.TCA_FIRST_COURSE_OR_CERT
    });

    console.log(`TCA welcome email sent to ${email}.`);
  } catch (e) {
    console.error(`Sending welcome email to ${email} <${handle}> failed.`, e);
  }
}

module.exports = {
  completeCertificationEmailNotification,
  completeFccCourseEmailNotification,
  sendEmail,
  startFccCourseEmailNotification,
  enrollCertificationEmailNotification,
  firstTimerEmailNotification,
}
