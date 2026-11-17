#!/usr/bin/env python3
"""Release through the pinned suite with the shared browser JWT audience binding."""
from pathlib import Path
import sys

sys.path.insert(0, '/tmp/tc-deploy-scripts')
import tcdeploy as d

APP = 'learning-paths-api'
AUDIENCE_PARAMETER = '/config/common/global-appvar/JWT_AUDIENCE'
SUITE_TASK_REQUEST = d.task_request


def task_request(manifest, task, tags, images, health_checks=None):
    """Add only the missing audience reference after the suite validates the task."""
    d.require(manifest['service'] == APP and manifest['taskFamily'] == APP and
              manifest['repository'] == 'github.com/topcoder-platform/' + APP and
              manifest['images'] == {APP: APP}, 'Unexpected Learning Paths manifest')
    request = SUITE_TASK_REQUEST(manifest, task, tags, images, health_checks)
    container = next(c for c in request['containerDefinitions'] if c['name'] == APP)
    reference = f"arn:aws:ssm:{manifest['region']}:{manifest['accountId']}:parameter{AUDIENCE_PARAMETER}"
    d.require(not any(e['name'] == 'JWT_AUDIENCE' for e in container.get('environment', [])),
              'JWT_AUDIENCE must use the shared runtime parameter')
    bindings = [s for s in container.get('secrets', []) if s['name'] == 'JWT_AUDIENCE']
    d.require(len(bindings) <= 1 and all(s['valueFrom'] in (reference, AUDIENCE_PARAMETER) for s in bindings),
              'JWT_AUDIENCE conflicts with the shared browser audience parameter')
    if not bindings:
        container.setdefault('secrets', []).append({'name': 'JWT_AUDIENCE', 'valueFrom': reference})
    return request


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    d.require(len(args) == 1, 'Expected one deployment manifest')
    manifest = Path(args[0])
    data = d.read_manifest(manifest)
    command = ['deploy', '--manifest', str(manifest), '--bootstrap-health-checks',
               str(manifest.with_name(data['environment'] + '-healthcheck.json'))]
    for container in data['images']:
        command.extend(['--image', container + '=learning-paths-api:candidate'])
    # Adapt request construction only. The suite still verifies the registered
    # task against this request and retains its OIDC, scan, concurrency and
    # healthy rollout checks. Only ECS resolves the parameter value.
    original = d.task_request
    d.task_request = task_request
    try:
        d.main(command)
    finally:
        d.task_request = original


if __name__ == '__main__':
    try:
        main()
    except (d.DeployError, ValueError, KeyError, TypeError, OSError):
        error = sys.exc_info()[1]
        print('Deployment stopped: ' + (str(error) if isinstance(error, d.DeployError)
                                      else 'invalid input or response'), file=sys.stderr)
        sys.exit(1)
