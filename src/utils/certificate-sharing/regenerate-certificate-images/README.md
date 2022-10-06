# Regenerate Certificate Images Utility

This tool allows us to check that all completed certifications have a corresponding image and creates them if they're missing.

The tool was primarily built to backfill certifications in production that were completed
before the cert generator tool was implemented.

The tool can also be used to regenerate images after a system failure of some kind.

## What does the tool do?

1. Gets all the completed progress records from the db
2. Creates images for all records that don't have certificateImageUrl assigned
3. Verifies that all the certificateImageUrls assigned actually exist and creates
   them if they don't

## Configuring Required Env Variables

The following environment variables are required for this tool:

```
# The active token of the user running the utility in the environment in which it's
# being run
CERT_REGENERATOR_TOKEN=$#@%@#$%@#$%#$^$#%^#$^%

# The domain at which the cert images will be hosted.
# WARNING: This variable is shared w/the main API
CERT_IMAGE_DOMAIN=topcoder-dev.com
```

## Install Dependencies

Install packages w/in this directory:

```bash
$ cd src/utils/certificate-sharing/regenerate-certificate-images
$ npm i
```

## Running the tool

> IMPORTANT: The user who runs this utility must have permission in the Support Admin Tool to query a user's handle from the user's userId. 

Why?

The Learning Paths API does not store the user's handle bc it changes and we can't realistically keep them in sync. 

But the handle is used in the URL of the certificate images because the cert is public and the user's ID should not be.

If you're wondering how we can use the handle, which can change, for the cert URL... We save the URL for the image as a property of the CertificationProgress record when the image is created,so
a subsequent handle change won't cause us to lose track of the image as it was saved.

To run the tool:

1. Set the CERT_REGENERATOR_TOKEN in the .env file
2. Open a terminal in the root directory
3. Paste the AWS env vars in the terminal
3. Run the npm command

```zsh
% npm run cert-gen:regenerate
```

> NOTE: Extensive logging should provide status, etc.

> NOTE: The vast majority of the async calls happen in the background and are not awaited.
