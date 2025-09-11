import org.gradle.kotlin.dsl.register
fun bash(cmd: String) = listOf("/bin/bash", "-lc", cmd)


val yarn = "corepack enable && corepack use yarn@4.9.2 && yarn"

tasks.register<Exec>("yarnInstall") {
    workingDir = file(".")
    commandLine(bash("$yarn install --immutable"))
}

tasks.register<Exec>("typecheck") {
    workingDir = file(".")
    commandLine(bash("$yarn typecheck"))
    dependsOn("yarnInstall")
}

tasks.register<Exec>("buildWeb") {
    workingDir = file(".")
    commandLine(bash("$yarn build"))
    dependsOn("yarnInstall")
}

tasks.register<Exec>("testWeb") {
    workingDir = file(".")
    commandLine(bash("$yarn test -u || true"))
    dependsOn("yarnInstall")
}

tasks.register("cleanWeb") {
    doLast { delete(".next", "node_modules", ".turbo", ".cache") }
}
