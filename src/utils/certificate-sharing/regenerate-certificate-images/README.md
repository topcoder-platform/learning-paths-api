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

To run the tool:

1. Open a terminal in the root directory
2. Paste the AWS env vars in the terminal
3. Run the npm command

```zsh
% npm run cert-gen:regenerate
```

> NOTE: Extensive logging should provide status, etc.

> NOTE: The vast majority of the async calls happen in the background and are not awaited.
