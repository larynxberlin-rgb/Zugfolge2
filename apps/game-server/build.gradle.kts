import org.gradle.jvm.toolchain.JavaLanguageVersion
import org.gradle.jvm.toolchain.JvmVendorSpec

plugins {
    jacoco
    alias(libs.plugins.kotlin.jvm)
}

jacoco {
    toolVersion = "0.8.15"
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
        val runtimeVersion = javaLauncher.get().metadata.javaRuntimeVersion
        check(runtimeVersion == "21.0.12+8-LTS") {
            "Unsupported test JVM runtime '$runtimeVersion'. Expected 21.0.12+8-LTS."
        }
    }
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        csv.required = false
        html.required = true
    }
}

tasks.check {
    dependsOn(tasks.jacocoTestReport)
}
