package de.zugfolge.architecture

import de.zugfolge.game.GameServerModule
import java.nio.file.Files
import java.nio.file.Path
import kotlin.io.path.extension
import kotlin.io.path.readText
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

public class EngineeringBaselineTest {
    @Test
    public fun `module exposes only its framework-free identity`(): Unit {
        assertEquals("game-server", GameServerModule.ID)
        assertTrue(GameServerModule.declaredProjectDependencies.isEmpty())
    }

    @Test
    public fun `production sources do not cross a private module boundary`(): Unit {
        val repositoryRoot = Path.of(System.getProperty("zugfolge.repository.root"))
        val sourceRoot = repositoryRoot.resolve("apps/game-server/src/main/kotlin")
        val forbiddenImports = listOf(
            "apps.",
            "integrations.",
            "src.main.",
            "org.springframework.",
            "io.ktor.",
        )

        Files.walk(sourceRoot).use { paths ->
            val sources = paths
                .filter { Files.isRegularFile(it) && it.extension == "kt" }
                .toList()
            assertFalse(sources.isEmpty(), "the module needs at least one production source")
            for (source in sources) {
                val imports = source.readText()
                    .lineSequence()
                    .map(String::trim)
                    .filter { it.startsWith("import ") }
                    .map { it.removePrefix("import ") }
                    .toList()
                for (forbidden in forbiddenImports) {
                    assertTrue(
                        imports.none { it.startsWith(forbidden) },
                        "$source imports forbidden boundary $forbidden",
                    )
                }
            }
        }
    }
}
