from datetime import datetime, timezone
from importlib.metadata import version
import sys
import unittest

from zugfolge_data import (
    AttributeValue,
    DataProvenance,
    InfrastructureRelease,
    InfrastructureReleaseBuilder,
    QualityClass,
)


def provenance(payload: bytes = b"osm-fixture") -> DataProvenance:
    return DataProvenance.from_payload(
        source_id="osm-pilot-extract",
        license_or_permission="ODbL-1.0",
        retrieved_at=datetime(2026, 7, 30, 10, 0, tzinfo=timezone.utc),
        schema_version="osm-pbf-2026.07",
        payload=payload,
        confidence=0.85,
        transformation_ids=("normalize-rail-tags-v1",),
    )


class ProvenanceTest(unittest.TestCase):
    def test_workspace_package_is_installed(self) -> None:
        self.assertEqual(version("zugfolge-data-pipeline"), "0.1.0")
        self.assertEqual(sys.version_info[:3], (3, 13, 14))

    def test_checksum_is_derived_from_original_bytes(self) -> None:
        self.assertEqual(provenance().checksum_sha256, provenance().checksum_sha256)
        self.assertNotEqual(
            provenance(b"osm-fixture").checksum_sha256,
            provenance(b"changed").checksum_sha256,
        )

    def test_naive_or_non_utc_retrieval_time_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValueError, "timezone-aware"):
            DataProvenance.from_payload(
                source_id="source",
                license_or_permission="permission",
                retrieved_at=datetime(2026, 7, 30, 10, 0),
                schema_version="1",
                payload=b"value",
                confidence=1,
            )

    def test_release_hash_is_independent_of_insertion_order(self) -> None:
        first = InfrastructureReleaseBuilder(
            release_id="pilot-2026.1", ruleset_version="1"
        )
        second = InfrastructureReleaseBuilder(
            release_id="pilot-2026.1", ruleset_version="1"
        )
        speed = AttributeValue(160, QualityClass.A_VALIDATED, provenance(b"speed"))
        signal = AttributeValue(
            "Ks", QualityClass.B_CONSERVATIVE, provenance(b"signal")
        )

        first.add_attribute(
            entity_id="edge-2", attribute_name="signalling", attribute=signal
        )
        first.add_attribute(
            entity_id="edge-1", attribute_name="maxSpeedKph", attribute=speed
        )
        second.add_attribute(
            entity_id="edge-1", attribute_name="maxSpeedKph", attribute=speed
        )
        second.add_attribute(
            entity_id="edge-2", attribute_name="signalling", attribute=signal
        )

        self.assertEqual(
            first.build().manifest_sha256,
            second.build().manifest_sha256,
        )

    def test_duplicate_attribute_cannot_replace_provenance(self) -> None:
        builder = InfrastructureReleaseBuilder(
            release_id="pilot-2026.1", ruleset_version="1"
        )
        value = AttributeValue(160, QualityClass.A_VALIDATED, provenance())
        builder.add_attribute(
            entity_id="edge-1", attribute_name="maxSpeedKph", attribute=value
        )
        with self.assertRaisesRegex(ValueError, "already has provenance"):
            builder.add_attribute(
                entity_id="edge-1", attribute_name="maxSpeedKph", attribute=value
            )

    def test_nested_attribute_values_are_deeply_immutable(self) -> None:
        raw_value = {"signals": [{"system": "Ks"}]}
        attribute = AttributeValue(
            raw_value,
            QualityClass.B_CONSERVATIVE,
            provenance(b"nested"),
        )
        raw_value["signals"][0]["system"] = "Hp"

        builder = InfrastructureReleaseBuilder(
            release_id="pilot-2026.1", ruleset_version="1"
        )
        builder.add_attribute(
            entity_id="edge-1",
            attribute_name="signalling",
            attribute=attribute,
        )
        release = builder.build()
        frozen_signals = release.attributes["edge-1"]["signalling"].value["signals"]

        self.assertEqual(frozen_signals[0]["system"], "Ks")
        with self.assertRaises(TypeError):
            frozen_signals[0]["system"] = "Hp"

    def test_direct_release_construction_cannot_bypass_immutability(self) -> None:
        attribute = AttributeValue(
            {"systems": ["ETCS", "PZB"]},
            QualityClass.A_VALIDATED,
            provenance(b"systems"),
        )
        builder = InfrastructureReleaseBuilder(
            release_id="pilot-2026.1", ruleset_version="1"
        )
        builder.add_attribute(
            entity_id="edge-1",
            attribute_name="trainProtection",
            attribute=attribute,
        )
        canonical_release = builder.build()

        mutable_attributes = {
            "edge-1": {"trainProtection": attribute},
        }
        direct_release = InfrastructureRelease(
            release_id="pilot-2026.1",
            ruleset_version="1",
            attributes=mutable_attributes,
            manifest_sha256=canonical_release.manifest_sha256,
        )
        mutable_attributes["edge-1"].clear()

        self.assertIn("trainProtection", direct_release.attributes["edge-1"])
        with self.assertRaises(TypeError):
            direct_release.attributes["edge-1"]["new"] = attribute
        with self.assertRaisesRegex(ValueError, "does not match"):
            InfrastructureRelease(
                release_id="pilot-2026.1",
                ruleset_version="1",
                attributes={"edge-1": {"trainProtection": attribute}},
                manifest_sha256="0" * 64,
            )


if __name__ == "__main__":
    unittest.main()
