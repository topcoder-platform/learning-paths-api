# OIDC deployment migration

This change replaces the Auth0 credential broker and SSM-to-shell deployment path with [tc-deploy-scripts v2.0.14](https://github.com/topcoder-platform/tc-deploy-scripts/releases/tag/v2.0.14), fetched by tag and verified against commit `62b8ac8461c5d3e73e8a6bb6a35b2a9005d37c52`. Build and deployment run in separate jobs. The deployer cannot read Parameter Store, Secrets Manager or decrypt KMS data, including through another assumed role. ECS continues resolving the existing runtime secret references using the execution role.

## Production target

The read-only inventory on 2026-11-03 verified account `409275337247`, cluster `tc-learning-paths-serverless`, service `learning-paths-api`, family `learning-paths-api`, and container `learning-paths-api`. `prod.json` preserves the observed task/execution roles and names the proposed service-specific deployment role. [prod-baseline.json](https://github.com/topcoder-platform/v6-services-iac/blob/main/services/learning-paths-api/deploy/prod-baseline.json) records references only; it contains no parameter values. Do not recreate the service or replace its complete task definition from this baseline.

## Installed infrastructure and production cutover

The dev deployment role/boundary, restricted empty CircleCI context, and immutable ECR tags are installed. Existing enhanced scanning is preserved. The production OIDC provider, deployment role/boundary and restricted context are also installed; production runtime and ECR changes remain gated on dev validation. Installation evidence and remaining service-specific steps are private in [PROVISIONING.txt](https://github.com/topcoder-platform/v6-services-iac/blob/main/services/learning-paths-api/deploy/PROVISIONING.txt). Deploy roles have explicit secret-store and KMS-decryption denies. Runtime values are retrieved only by ECS using the execution role.

At production cutover, stop legacy publishers, enable unconditional tag immutability, adopt missing task health checks with the reviewed image, and use the approval-gated `master` workflow. Preserve capacity, roles, secret references and rollback. Do not run production before dev validation.

## Development acceptance

This PR targets `develop`. Administrator-installed dev prerequisites are recorded in the private IaC repository. The reviewed task health check was submitted only after confirming the existing image serves the identical healthy load-balancer endpoint.

- Dev infrastructure prerequisites are installed; merge to run the application deployment, then validate functionality.

Run the shared offline suite, validate the CircleCI config and IAM policies, and test a dev release plus an unhealthy-image rollback. Verify CloudTrail contains no SSM/Secrets Manager calls from the deployment principal. Remove its old broker grants only after migration. Check the runtime secret references and roles stayed unchanged. Production requires the manual approval job and a passing digest/scan/health verification.

The pinned executor is `cimg/aws@sha256:4cf3768db00ddf9bc439b8c84e8a60c11a14edf81c8baf76f74132144f8340d5`. Python/AWS CLI/Buildx/Git compatibility was tested with the shared offline suite. No package installation or service build runs in the deployment job. The Dockerfile retains the existing in-image quality gates. This PR does not deploy, change IAM, rotate credentials, or claim a successful live rollout.

## MongoDB trigger Lambda is a separate release

The old ECS job also ran Serverless for `src/utils/mongodb-trigger-handler` using decrypted Auth0 build parameters. This ECS migration deliberately removes that coupling and grants no Lambda/CloudFormation permissions to the ECS deployer. Existing Lambda resources are unchanged. Changes to the trigger handler must be reviewed and released separately by its infrastructure owner; do not treat an ECS rollout as a Lambda rollout. A future Lambda CI path must preserve existing runtime environment bindings without fetching/decrypting them into this job. This separation needs acceptance before merging this draft.

## Infrastructure source

IAM templates and detailed AWS baselines are maintained in the private [v6-services-iac service directory](https://github.com/topcoder-platform/v6-services-iac/tree/main/services/learning-paths-api). Provision infrastructure separately with an administrator identity; application CI does not fetch that repository or install IAM. Required application manifests and health-check proposals remain here.

## Dev branch refresh

This PR targets `develop` and preserves its current application/dependency fixes. The shared suite is v2.0.10 (92 offline tests); service-specific adapters and their tests remain part of review. Use the current readiness record above for the remaining merge/deployment gates. Updating these files does not provision AWS or CircleCI resources.

Source checkout uses the public HTTPS repository and verifies the exact CircleCI commit, avoiding dependency on failing SSH checkout keys. No GitHub token is added to build or deployment contexts.

## Reviewed health-check bootstrap

The release wrapper passes the environment-specific health-check JSON to v2.0.10. A missing check is added with the new scanned image; the old image is not restarted with a new probe. An identical existing check is preserved, and a different existing check stops the release. Role, runtime-secret reference, scan, concurrency and healthy-digest checks remain enforced.

## Browser JWT audience (PM-6770)

The shared JWT verifier requires `JWT_AUDIENCE` for Academy's RS256 browser tokens, separately from the machine audience in `AUTH0_AUDIENCE`. On 2026-11-17 the dev service's task revision 303 omitted `JWT_AUDIENCE`, so authenticated certification progress requests returned 401 while public course listings still loaded. The shared dev parameter already exists and the ECS execution role can read it. The recorded production audience repair already includes the same reference in its own account.

`release.py` now adapts the pinned suite's task request to add `JWT_AUDIENCE` from `arn:aws:ssm:<region>:<accountId>:parameter/config/common/global-appvar/JWT_AUDIENCE` to the application container when absent. It preserves an existing matching ARN or parameter path and rejects conflicting, duplicate or plaintext bindings before publishing an image. No parameter values are read by CI. Other secret references, roles, sidecars and task settings are preserved; the suite still controls OIDC authentication, scans, image promotion, registered-task readback, concurrent deployment checks and healthy rollout verification.

Merging to `develop` applies the missing reference with the next normal dev release. The existing shared parameter must contain the browser client audience and remain readable by the execution role. Do not substitute `AUTH0_AUDIENCE`, disable audience verification or deploy an old task baseline over the repaired configuration. The production workflow retains its existing approval gate.

With the pinned suite checked out at `/tmp/tc-deploy-scripts`, run `python3 -m unittest discover -s deploy/tests -v` to exercise task preservation, binding conflicts and a mocked full release including registered-task readback. CircleCI runs these checks before building. `pnpm run test:security` exercises both affected progress routes with signed browser fixtures, reproduces the missing-audience 401, and checks invalid signatures, audiences, issuers, expiry, email verification, roles and machine scopes. These route tests replace database-backed controllers; after deployment, verify both progress requests with a real Academy login and confirm the ECS rollout remains healthy.
