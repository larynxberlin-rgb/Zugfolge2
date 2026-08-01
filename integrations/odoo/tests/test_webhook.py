from importlib.metadata import version
import sys
import unittest

from zugfolge_odoo_bridge import (
    IdempotencyConflict,
    IdempotencyInbox,
    InvalidWebhook,
    sign_webhook,
    verify_webhook,
)


class WebhookBoundaryTest(unittest.TestCase):
    secret = b"0123456789abcdef0123456789abcdef"
    body = b'{"messageId":"event-1","type":"ENTITLEMENT_CHANGED"}'
    timestamp = 1_785_411_600

    def test_workspace_package_is_installed(self) -> None:
        self.assertEqual(version("zugfolge-odoo-bridge"), "0.1.0")
        self.assertEqual(sys.version_info[:3], (3, 13, 14))

    def test_valid_signature_is_accepted(self) -> None:
        signature = sign_webhook(self.secret, self.timestamp, self.body)
        verify_webhook(
            secret=self.secret,
            timestamp_seconds=self.timestamp,
            body=self.body,
            signature=signature,
            now_seconds=self.timestamp + 30,
        )

    def test_tampering_and_replay_are_rejected(self) -> None:
        signature = sign_webhook(self.secret, self.timestamp, self.body)
        with self.assertRaisesRegex(InvalidWebhook, "signature"):
            verify_webhook(
                secret=self.secret,
                timestamp_seconds=self.timestamp,
                body=self.body + b" ",
                signature=signature,
                now_seconds=self.timestamp,
            )
        with self.assertRaisesRegex(InvalidWebhook, "replay window"):
            verify_webhook(
                secret=self.secret,
                timestamp_seconds=self.timestamp,
                body=self.body,
                signature=signature,
                now_seconds=self.timestamp + 301,
            )

    def test_duplicate_is_idempotent_but_payload_reuse_conflicts(self) -> None:
        inbox = IdempotencyInbox()
        self.assertTrue(inbox.accept("event-1", self.body))
        self.assertFalse(inbox.accept("event-1", self.body))
        with self.assertRaisesRegex(IdempotencyConflict, "different payload"):
            inbox.accept("event-1", b'{"messageId":"event-1","type":"REFUND"}')


if __name__ == "__main__":
    unittest.main()
