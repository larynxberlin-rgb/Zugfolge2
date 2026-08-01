plugins {
    base
    alias(libs.plugins.kotlin.jvm) apply false
}

group = "de.zugfolge"
version = "0.1.0-SNAPSHOT"

layout.buildDirectory = layout.projectDirectory.dir(".gradle-build/root")

subprojects {
    group = rootProject.group
    version = rootProject.version

    val generatedProjectPath = project.path
        .removePrefix(":")
        .replace(':', '/')
    layout.buildDirectory = rootProject.layout.projectDirectory
        .dir(".gradle-build/$generatedProjectPath")

    dependencyLocking {
        lockAllConfigurations()
    }

}
