import org.gradle.kotlin.dsl.register
fun bash(cmd: String) = listOf("bash", "-lc", cmd)

val compose = "docker compose -f infra/docker/docker-compose.yml"

tasks.register<Exec>("meiliUp") {
    commandLine(bash("$compose up -d meilisearch"))
}

tasks.register<Exec>("meiliSeed") {
    workingDir = file(".")
    commandLine(bash("chmod +x ./seed.sh && ./seed.sh"))
    // If your seed script needs API running, ensure it (or rely on CI order)
}

tasks.register<Exec>("meiliDown") {
    commandLine(bash("$compose stop meilisearch"))
}
