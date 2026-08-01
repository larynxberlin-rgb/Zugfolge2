import org.gradle.jvm.toolchain.JavaLanguageVersion
import org.gradle.jvm.toolchain.JvmVendorSpec

plugins {
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    explicitApi()
    jvmToolchain {
        languageVersion.set(JavaLanguageVersion.of(21))
        vendor.set(JvmVendorSpec.ADOPTIUM)
    }
}

dependencies {
    testImplementation(platform(libs.junit.bom))
    testImplementation(libs.junit.jupiter)
    testRuntimeOnly(libs.junit.platform.launcher)
}

tasks.test {
    useJUnitPlatform()
    systemProperty("zugfolge.repository.root", rootProject.layout.projectDirectory.asFile.absolutePath)
    reports {
        junitXml.required = true
        html.required = true
    }
    doFirst {
        val runtimeVersion = javaLauncher.get().metadata.javaRuntimeVersion.toString()
        check(runtimeVersion == "21.0.12+8-LTS") {
            "Unsupported test JVM runtime '$runtimeVersion'. Expected 21.0.12+8-LTS."
        }
    }
}

tasks.check {
    dependsOn(tasks.test)
}
