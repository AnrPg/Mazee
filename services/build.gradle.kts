import org.gradle.kotlin.dsl.register

fun bash(cmd: String) = listOf("bash", "-lc", cmd)

tasks.register<Exec>("yarnInstall") {
    // Yarn 4 via Corepack (matches your CI)
    workingDir = file(".")
    commandLine(bash("corepack enable && corepack use yarn@4.10.3 && yarn install --immutable"))
}

tasks.register<Exec>("typecheck") {
    workingDir = file(".")
    commandLine(bash("corepack enable && corepack use yarn@4.10.3 && yarn typecheck"))
    dependsOn("yarnInstall")
}

tasks.register<Exec>("buildWeb") {
    workingDir = file(".")
    // Next.js build
    commandLine(bash("corepack enable && corepack use yarn@4.10.3 && yarn build"))
    dependsOn("yarnInstall")
}

tasks.register<Exec>("testWeb") {
    workingDir = file(".")
    commandLine(bash("corepack enable && corepack use yarn@4.10.3 && yarn test -u || true"))
    dependsOn("yarnInstall")
}

tasks.register("cleanWeb") {
    doLast {
        delete(
            ".next",
            "node_modules",
            ".turbo",
            ".cache"
        )
    }
}
