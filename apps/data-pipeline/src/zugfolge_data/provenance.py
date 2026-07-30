from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import StrEnum
from hashlib import sha256
import json
from types import MappingProxyType
from typing import Any, Mapping


class QualityClass(StrEnum):
    A_VALIDATED = "A"
    B_CONSERVATIVE = "B"
    C_INSUFFICIENT = "C"


def _require_utc(value: datetime, field: str) -> datetime:
    if value.tzinfo is None or value.utcoffset() is None:
        raise ValueError(f"{field} must be timezone-aware")
    if value.utcoffset() != timezone.utc.utcoffset(value):
        raise ValueError(f"{field} must be UTC")
    return value


@dataclass(frozen=True, slots=True)
class DataProvenance:
    source_id: str
    license_or_permission: str
    retrieved_at: datetime
    schema_version: str
    checksum_sha256: str
    confidence: float
    valid_from: datetime | None = None
    valid_until: datetime | None = None
    transformation_ids: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.source_id.strip():
            raise ValueError("source_id is required")
        if not self.license_or_permission.strip():
            raise ValueError("license_or_permission is required")
        if not self.schema_version.strip():
            raise ValueError("schema_version is required")
        _require_utc(self.retrieved_at, "retrieved_at")
        if self.valid_from is not None:
            _require_utc(self.valid_from, "valid_from")
        if self.valid_until is not None:
            _require_utc(self.valid_until, "valid_until")
        if (
            self.valid_from is not None
            and self.valid_until is not None
            and self.valid_until <= self.valid_from
        ):
            raise ValueError("valid_until must be later than valid_from")
        if len(self.checksum_sha256) != 64:
            raise ValueError("checksum_sha256 must contain 64 hexadecimal characters")
        try:
            bytes.fromhex(self.checksum_sha256)
        except ValueError as error:
            raise ValueError("checksum_sha256 is not hexadecimal") from error
        if not 0 <= self.confidence <= 1:
            raise ValueError("confidence must be between 0 and 1")

    @classmethod
    def from_payload(
        cls,
        *,
        source_id: str,
        license_or_permission: str,
        retrieved_at: datetime,
        schema_version: str,
        payload: bytes,
        confidence: float,
        valid_from: datetime | None = None,
        valid_until: datetime | None = None,
        transformation_ids: tuple[str, ...] = (),
    ) -> DataProvenance:
        return cls(
            source_id=source_id,
            license_or_permission=license_or_permission,
            retrieved_at=retrieved_at,
            schema_version=schema_version,
            checksum_sha256=sha256(payload).hexdigest(),
            confidence=confidence,
            valid_from=valid_from,
            valid_until=valid_until,
            transformation_ids=transformation_ids,
        )

    def canonical_dict(self) -> dict[str, Any]:
        return {
            "sourceId": self.source_id,
            "licenseOrPermission": self.license_or_permission,
            "retrievedAt": self.retrieved_at.isoformat().replace("+00:00", "Z"),
            "schemaVersion": self.schema_version,
            "checksumSha256": self.checksum_sha256,
            "confidence": self.confidence,
            "validFrom": (
                self.valid_from.isoformat().replace("+00:00", "Z")
                if self.valid_from
                else None
            ),
            "validUntil": (
                self.valid_until.isoformat().replace("+00:00", "Z")
                if self.valid_until
                else None
            ),
            "transformationIds": list(self.transformation_ids),
        }


@dataclass(frozen=True, slots=True)
class AttributeValue:
    value: Any
    quality_class: QualityClass
    provenance: DataProvenance

    def canonical_dict(self) -> dict[str, Any]:
        return {
            "value": self.value,
            "qualityClass": self.quality_class.value,
            "provenance": self.provenance.canonical_dict(),
        }


@dataclass(frozen=True, slots=True)
class InfrastructureRelease:
    release_id: str
    ruleset_version: str
    attributes: Mapping[str, Mapping[str, AttributeValue]]
    manifest_sha256: str


class InfrastructureReleaseBuilder:
    def __init__(self, *, release_id: str, ruleset_version: str) -> None:
        if not release_id.strip() or not ruleset_version.strip():
            raise ValueError("release_id and ruleset_version are required")
        self._release_id = release_id
        self._ruleset_version = ruleset_version
        self._attributes: dict[str, dict[str, AttributeValue]] = {}
        self._built = False

    def add_attribute(
        self,
        *,
        entity_id: str,
        attribute_name: str,
        attribute: AttributeValue,
    ) -> None:
        if self._built:
            raise RuntimeError("release builder is already sealed")
        if not entity_id.strip() or not attribute_name.strip():
            raise ValueError("entity_id and attribute_name are required")
        entity = self._attributes.setdefault(entity_id, {})
        if attribute_name in entity:
            raise ValueError(
                f"attribute {entity_id}.{attribute_name} already has provenance"
            )
        entity[attribute_name] = attribute

    def build(self) -> InfrastructureRelease:
        if self._built:
            raise RuntimeError("release builder is already sealed")
        if not self._attributes:
            raise ValueError("an infrastructure release cannot be empty")
        self._built = True

        canonical_attributes = {
            entity_id: {
                name: value.canonical_dict()
                for name, value in sorted(attributes.items())
            }
            for entity_id, attributes in sorted(self._attributes.items())
        }
        canonical_manifest = {
            "releaseId": self._release_id,
            "rulesetVersion": self._ruleset_version,
            "attributes": canonical_attributes,
        }
        encoded = json.dumps(
            canonical_manifest,
            ensure_ascii=False,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")

        frozen_attributes = MappingProxyType(
            {
                entity_id: MappingProxyType(dict(attributes))
                for entity_id, attributes in self._attributes.items()
            }
        )
        return InfrastructureRelease(
            release_id=self._release_id,
            ruleset_version=self._ruleset_version,
            attributes=frozen_attributes,
            manifest_sha256=sha256(encoded).hexdigest(),
        )
