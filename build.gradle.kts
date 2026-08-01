plugins {
    base
    alias(libs.plugins.kotlin.jvm) apply false
}

val approvedJavaVendor = "Eclipse Adoptium"
val approvedJavaRuntime = "21.0.12+8-LTS"

check(System.getProperty("java.vendor") == approvedJavaVendor) {
    "Unsupported Gradle JVM vendor '${System.getProperty("java.vendor")}'. " +
        "Expected $approvedJavaVendor from Eclipse Temurin 21.0.12+8."
}
check(System.getProperty("java.runtime.version") == approvedJavaRuntime) {
    "Unsupported Gradle JVM runtime '${System.getProperty("java.runtime.version")}'. " +
        "Expected $approvedJavaRuntime."
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
