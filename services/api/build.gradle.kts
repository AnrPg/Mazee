import org.gradle.kotlin.dsl.register
fun bash(cmd: String) = listOf("bash", "-lc", cmd)

val env = mutableMapOf<String, String>() // add DB vars if needed

tasks.register<Exec>("depsGet") {
    workingDir = file(".")
    environment(env)
    commandLine(bash("mix deps.get"))
}

tasks.register<Exec>("ectoSetup") {
    workingDir = file(".")
    environment(env)
    commandLine(bash("mix ecto.setup"))
    dependsOn("depsGet")
}

tasks.register<Exec>("compileApi") {
    workingDir = file(".")
    environment(env)
    commandLine(bash("mix compile"))
    dependsOn("depsGet")
}

tasks.register<Exec>("testApi") {
    workingDir = file(".")
    environment(env + mapOf("MIX_ENV" to "test"))
    commandLine(bash("mix test"))
    dependsOn("depsGet")
}

tasks.register("cleanApi") {
    doLast { delete("_build", "deps") }
}
