# Zugfolge data pipeline

This module is the executable foundation for immutable, traceable infrastructure
releases. It currently provides the dependency-free provenance and release
manifest kernel. OSM/GDAL/osmium/Polars import adapters are deliberately not
added until their concrete source registry entries and license treatment are
approved under `ADR-0003`.

Run its tests from the repository root:

```bash
python -m unittest discover -s apps/data-pipeline/tests -v
```

The package enforces:

- SHA-256 checksums over original input bytes;
- timezone-aware UTC retrieval and validity timestamps;
- explicit source, license/permission and schema version;
- confidence in the closed range `0..1`;
- immutable attribute provenance;
- deterministic release manifest hashes independent of insertion order.
