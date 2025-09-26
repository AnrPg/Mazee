import org.gradle.kotlin.dsl.register
fun bash(cmd: String) = listOf("/bin/bash", "-lc", cmd)


val yarn = "corepack enable && corepack use yarn@4.10.3 && yarn"

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
    commandLine(bash("""
      if node -e "process.exit(require('./package.json').scripts?.test?0:1)"; then
        $yarn run -T test
      else
        echo "No test script; skipping"
      fi
    """.trimIndent()))
    dependsOn("yarnInstall")
}

tasks.register("cleanWeb") {
    doLast { delete(".next", "node_modules", ".turbo", ".cache") }
}
