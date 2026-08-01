plugins {
    alias(libs.plugins.kotlin.jvm)
}

kotlin {
    explicitApi()
    jvmToolchain(21)
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
}

tasks.check {
    dependsOn(tasks.test)
}
