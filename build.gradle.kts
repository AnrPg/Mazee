plugins { /* none needed */ }

// ---------- Aggregate tasks ----------
tasks.register("buildAll") {
    dependsOn(":openapi:genTsClient", ":openapi:genKotlinClient")
    dependsOn(":api:compileApi")
    dependsOn(":web:buildWeb")
    dependsOn("composeMeiliUp")
    // dependsOn(gradle.includedBuild("apps/android").task(":app:assembleDebug"))
}

tasks.register("testAll") {
    dependsOn(":api:testApi")
    dependsOn(":web:testWeb")
    // dependsOn(gradle.includedBuild("apps/android").task(":app:testDebugUnitTest"))
}

tasks.register("cleanAll") {
    dependsOn(":openapi:cleanOpenApi", ":api:cleanApi", ":web:cleanWeb")
    // dependsOn(gradle.includedBuild("apps/android").task(":clean"))
}

// Optional: convenience tasks for search infra

// Bring up only Meilisearch (no need to start everything)
tasks.register<Exec>("composeMeiliUp") {
    group = "compose"
    description = "docker compose up -d meilisearch"
    commandLine(listOf("/bin/bash","-lc", "$composeCmd up -d meilisearch"))
}

// Poll Meilisearch until /health says available (with timeout)
tasks.register<Exec>("meiliWaitHealthy") {
    group = "compose"
    description = "Wait for Meilisearch to report healthy"
    val script = """
        set -euo pipefail
        # Try for up to ~60s
        for i in {1..30}; do
          if curl -fsS "${'$'}{MEILI_HOST:-http://localhost:7700}/health" | grep -q '"status":"available"'; then
            echo "Meilisearch healthy ✔"
            exit 0
          fi
          echo "Waiting for Meilisearch... (${ '$' }i/30)"
          sleep 2
        done
        echo "::error::Meilisearch did not become healthy in time"
        exit 1
    """.trimIndent()
    commandLine(listOf("/bin/bash","-lc", script))
}

// Ensure your existing seed task ONLY runs after Meilisearch is up & healthy
tasks.register("searchSeed") {
    dependsOn("composeMeiliUp")
    dependsOn("meiliWaitHealthy")
    dependsOn(":search:meiliSeed")
}
tasks.register("searchUp") { dependsOn(":search:meiliUp") }
tasks.register("searchDown") { dependsOn(":search:meiliDown") }

// ---------- Docker Compose helpers ----------
fun bash(cmd: String) = listOf("/bin/bash", "-lc", cmd) // define ONCE

val composeFile = "infra/docker/docker-compose.yml"
val composeEnv  = "infra/docker/.env"
val composeCmd  = "docker compose -f $composeFile --env-file $composeEnv"

// Grouped names so they show nicely under `./gradlew tasks`
val composeGroup = "compose"

tasks.register<Exec>("composeUp") {
    group = composeGroup
    description = "docker compose up -d (all services)"
    commandLine(bash("$composeCmd up -d"))
}

tasks.register<Exec>("composeDown") {
    group = composeGroup
    description = "docker compose down -v (remove volumes!)"
    commandLine(bash("$composeCmd down -v"))
}

tasks.register<Exec>("composePs") {
    group = composeGroup
    description = "docker compose ps"
    commandLine(bash("$composeCmd ps"))
}

/** Optional: bring stack up, then seed Meili */
tasks.register("stackUpAndSeed") {
    group = composeGroup
    description = "composeUp + seed Meilisearch"
    dependsOn("composeUp")
    dependsOn(":search:meiliSeed")
}

/** Optional: db reset helpers (Postgres only; destructive!) */
tasks.register<Exec>("dbDrop") {
    group = composeGroup
    description = "Drop Postgres volumes and start only postgres"
    commandLine(bash("$composeCmd down -v && $composeCmd up -d postgres"))
}

// -------- Optional service-scoped helpers (parameterized) --------
// Service-scoped helpers (parameterized at execution time)
// Usage: ./gradlew composeServiceUp -Psvc=meilisearch
tasks.register<Exec>("composeServiceUp") {
    group = composeGroup
    description = "docker compose up -d for a single service (-Psvc=name)"
    // Hide task unless -Psvc is present; avoids IDE/config-time failure
    onlyIf { providers.gradleProperty("svc").isPresent }
    doFirst {
        val svc = providers.gradleProperty("svc").orNull
            ?: throw org.gradle.api.GradleException("Pass -Psvc=<service>")
        commandLine(bash("$composeCmd up -d $svc"))
    }
}

tasks.register<Exec>("composeServiceStop") {
    group = composeGroup
    description = "docker compose stop for a single service (-Psvc=name)"
    onlyIf { providers.gradleProperty("svc").isPresent }
    doFirst {
        val svc = providers.gradleProperty("svc").orNull
            ?: throw org.gradle.api.GradleException("Pass -Psvc=<service>")
        commandLine(bash("$composeCmd stop $svc"))
    }
}

// ---------- Sanity: Docker services ----------
tasks.register<Exec>("sanityDocker") {
    group = composeGroup
    description = "Verify docker, compose file, containers, and core services health"

    val script = """
        set -euo pipefail

        cat <<'BASH' >/tmp/_sanity_docker.sh
        #!/usr/bin/env bash
        set -euo pipefail

        command -v docker >/dev/null || { echo "docker not found"; exit 1; }
        docker compose version >/dev/null || { echo "docker compose not available"; exit 1; }

        test -f "$composeFile" || { echo "Missing $composeFile"; exit 1; }
        test -f "$composeEnv"  || { echo "Missing $composeEnv";  exit 1; }

        $composeCmd ps

        # Remove obsolete 'version:' key noise (compose warns but continues anyway).
        # Consider deleting 'version:' from your compose file later.

        # services declared
        srv_list=${'$'}($composeCmd config --services)

        # check each service shows Up/healthy in human output
        for s in ${'$'}srv_list; do
          line=${'$'}($composeCmd ps "${'$'}s" | tail -n +2 | head -n 1 || true)
          echo "Service ${'$'}s -> ${'$'}line"
          echo "${'$'}line" | grep -Eq 'Up|healthy' || { echo "::error::Service ${'$'}s not Up/healthy"; exit 1; }
        done

        # Postgres health
        if $composeCmd ps postgres >/dev/null 2>&1; then
          echo "Checking Postgres..."
          $composeCmd exec -T postgres pg_isready -U "${'$'}{POSTGRES_USER:-postgres}" || { echo "::error::pg_isready failed"; exit 1; }
        fi

        # Meilisearch health (host probing)
        if $composeCmd ps meilisearch >/dev/null 2>&1; then
          echo "Checking Meilisearch..."
          curl -fsS "${'$'}{MEILI_HOST:-http://localhost:7700}/health" | grep -q '"status":"available"' \
            || { echo "::error::Meili /health not OK"; exit 1; }
        fi

        # MongoDB ping
        if $composeCmd ps mongo >/dev/null 2>&1; then
          echo "Checking Mongo..."
          $composeCmd exec -T mongo sh -lc 'command -v mongosh >/dev/null 2>&1 && mongosh --quiet --eval "db.adminCommand({ ping: 1 }).ok" || mongo --quiet --eval "db.adminCommand({ ping: 1 }).ok"' \
            | grep -q '^1${'$'}' || { echo "::error::Mongo ping failed"; exit 1; }
        fi

        echo "Docker sanity: OK"
        BASH

        chmod +x /tmp/_sanity_docker.sh
        /tmp/_sanity_docker.sh
    """.trimIndent()

    commandLine(listOf("/bin/bash", "-lc", script))
}


// ---------- Sanity: Project compiles/tests ----------

// Run test DB migrations (kept as-is)
tasks.register<Exec>("dbMigrateTest") {
    group = "verification"
    description = "Create & migrate test database"

    val script = """
        set -euo pipefail

        cat <<'BASH' >/tmp/_db_migrate_test.sh
        #!/usr/bin/env bash
        set -euo pipefail
        cd services/api
        MIX_ENV=test mix ecto.migrations
        MIX_ENV=test mix ecto.create
        MIX_ENV=test mix ecto.migrate
        echo "DB migrations (test): OK"
        BASH

        chmod +x /tmp/_db_migrate_test.sh
        /tmp/_db_migrate_test.sh
    """.trimIndent()

    commandLine(listOf("/bin/bash", "-lc", script))
}

// Register the API compile probe as its own task (configuration avoidance friendly)
val apiCompileProbe = tasks.register<Exec>("apiCompileProbe") {
    group = "verification"
    description = "Direct Elixir compile probe (MIX_ENV=test)"
    commandLine(bash("cd services/api && MIX_ENV=test mix compile --warnings-as-errors"))
}

// Now wire sanityProject to depend on your aggregates and finalize with the probe
tasks.register("sanityProject") {
    group = "verification"
    description = "Verify API+Web compile & tests via Gradle, plus a direct API compile probe"
    dependsOn("buildAll")
    dependsOn("testAll")
    finalizedBy(apiCompileProbe) // <- reference the provider, not tasks.create(...)
}

// All-in-one
tasks.register("sanityAll") {
    group = "verification"
    description = "Run both docker and project sanity checks"
    dependsOn("sanityDocker")
    // dependsOn("dbMigrateTest") // enable if your test DB is configured
    dependsOn("sanityProject")
}
