"""Offline checks against the exact deployment suite checked out by CircleCI."""
from contextlib import redirect_stdout
from copy import deepcopy
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


r = load('learning_paths_release', ROOT / 'deploy/release.py')
# Reuse the pinned suite's offline ECS/publisher fixtures. No AWS calls occur.
fixtures = load('suite_fixtures', Path('/tmp/tc-deploy-scripts/tests/test_security.py'))


class FakeAWS(fixtures.FakeAWS):
    def call(self, api, operation, **params):
        result = super().call(api, operation, **params)
        if (api, operation) == ('ecs', 'describe-tasks'):
            result['tasks'][0]['containers'][0]['name'] = r.APP
        return result


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.manifest = r.d.read_manifest(ROOT / 'deploy/dev.json')
        self.aws = FakeAWS(self.manifest)
        self.aws.task['containerDefinitions'][0]['name'] = r.APP
        self.aws.task['containerDefinitions'][0]['healthCheck'] = r.d.validate_health_checks(
            self.manifest, json.loads((ROOT / 'deploy/dev-healthcheck.json').read_text()))[r.APP]
        self.aws.task['containerDefinitions'][0]['secrets'] = [
            {'name': 'AUTH0_AUDIENCE', 'valueFrom': '/config/common/global-appvar/AUTH0_AUDIENCE'}]
        self.publisher = fixtures.FakePublisher(self.manifest)
        self.images = {r.APP: self.publisher.publish(r.APP, '', '')}
        self.publisher.calls.clear()

    def request(self):
        return r.task_request(self.manifest, self.aws.task, self.aws.tags, self.images)

    def release(self):
        env = {'CIRCLE_BRANCH': 'develop', 'CIRCLE_PROJECT_USERNAME': 'topcoder-platform',
               'CIRCLE_PROJECT_REPONAME': r.APP, 'CIRCLE_SHA1': fixtures.SHA, 'CIRCLE_BUILD_NUM': '123'}
        with patch.dict('os.environ', env, clear=True), \
                patch.object(r.d, 'authenticate', return_value=self.aws), \
                patch.object(r.d, 'Publisher', return_value=self.publisher), redirect_stdout(io.StringIO()):
            r.main([str(ROOT / 'deploy/dev.json')])

    def test_adds_only_browser_reference_and_preserves_input(self):
        self.aws.task['containerDefinitions'].append({'name': 'metrics', 'image': 'metrics:stable'})
        original = deepcopy(self.aws.task)
        expected = r.SUITE_TASK_REQUEST(self.manifest, original, self.aws.tags, self.images)
        expected['containerDefinitions'][0]['secrets'].append({
            'name': 'JWT_AUDIENCE',
            'valueFrom': 'arn:aws:ssm:us-east-1:811668436784:parameter' + r.AUDIENCE_PARAMETER})
        self.assertEqual(self.request(), expected)
        self.assertEqual(self.aws.task, original)

    def test_dev_and_prod_existing_shared_bindings_are_preserved(self):
        for environment in ('dev', 'prod'):
            self.manifest = r.d.read_manifest(ROOT / f'deploy/{environment}.json')
            self.aws.task = fixtures.task(self.manifest)
            self.aws.task['containerDefinitions'][0]['name'] = r.APP
            reference = f"arn:aws:ssm:us-east-1:{self.manifest['accountId']}:parameter{r.AUDIENCE_PARAMETER}"
            for value in (r.AUDIENCE_PARAMETER, reference):
                with self.subTest(environment=environment, reference=value):
                    self.aws.task['containerDefinitions'][0]['secrets'] = [{'name': 'JWT_AUDIENCE', 'valueFrom': value}]
                    expected = r.SUITE_TASK_REQUEST(self.manifest, self.aws.task, self.aws.tags, self.images)
                    self.assertEqual(self.request(), expected)
            self.aws.task['containerDefinitions'][0]['secrets'] = []
            self.assertEqual(self.request()['containerDefinitions'][0]['secrets'],
                             [{'name': 'JWT_AUDIENCE', 'valueFrom': reference}])

    def test_conflicting_duplicate_and_plaintext_audiences_stop_release(self):
        reference = {'name': 'JWT_AUDIENCE', 'valueFrom': r.AUDIENCE_PARAMETER}
        cases = [
            {'secrets': [{'name': 'JWT_AUDIENCE', 'valueFrom': '/config/common/global-appvar/AUTH0_AUDIENCE'}]},
            {'secrets': [{'name': 'JWT_AUDIENCE', 'valueFrom': 'arn:aws:ssm:us-east-1:409275337247:parameter' + r.AUDIENCE_PARAMETER}]},
            {'secrets': [reference, reference]},
            {'environment': [{'name': 'JWT_AUDIENCE', 'value': 'browser-client'}]},
        ]
        original = deepcopy(self.aws.task)
        for fields in cases:
            with self.subTest(fields=fields):
                self.aws.task = deepcopy(original)
                self.aws.task['containerDefinitions'][0].update(fields)
                with self.assertRaises(r.d.DeployError):
                    self.release()
                self.assertEqual(self.publisher.calls, [])
                self.assertIsNone(self.aws.registered)

    def test_suite_still_rejects_role_changes(self):
        self.aws.task['taskRoleArn'] = 'arn:aws:iam::811668436784:role/unreviewed'
        with self.assertRaises(r.d.DeployError):
            self.release()
        self.assertEqual(self.publisher.calls, [])

    def test_full_release_registers_and_verifies_binding_without_secret_reads(self):
        self.release()
        bindings = self.aws.registered['containerDefinitions'][0]['secrets']
        self.assertEqual([s['name'] for s in bindings], ['AUTH0_AUDIENCE', 'JWT_AUDIENCE'])
        self.assertEqual(self.aws.service['taskDefinition'], self.aws.registered['taskDefinitionArn'])
        self.assertTrue(any(op == 'describe-tasks' for _, op, _ in self.aws.calls))
        self.assertFalse(any(api in ('ssm', 'secretsmanager', 'kms') for api, _, _ in self.aws.calls))
        self.assertIs(r.d.task_request, r.SUITE_TASK_REQUEST)

    def test_registration_readback_cannot_drop_the_audience(self):
        def tamper(api, operation, params):
            if operation == 'describe-task-definition' and self.aws.registered:
                self.aws.registered['containerDefinitions'][0]['secrets'] = []
        self.aws.before = tamper
        with self.assertRaisesRegex(r.d.DeployError, 'Registered task configuration differs'):
            self.release()
        self.assertFalse(any(op == 'update-service' for _, op, _ in self.aws.calls))
        self.assertIs(r.d.task_request, r.SUITE_TASK_REQUEST)


if __name__ == '__main__':
    unittest.main()
