# Game server engineering baseline

`game-server` is the framework-free Kotlin/JVM 21 module introduced by
`MS-002-S04`. It contains only a module identity and an architecture boundary
test. HTTP, persistence, messaging, identity, simulation, economy, and provider
behavior are intentionally absent.

Build from the repository root after verifying the wrapper:

```text
node tools/verify-gradle-wrapper.mjs
.\gradlew.bat --no-daemon --console=plain check
```

On Linux, use `./gradlew`. Generated state is written below
`/.gradle-build` and `/.gradle`; neither location is tracked.
