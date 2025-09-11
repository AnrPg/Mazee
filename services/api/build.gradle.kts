import org.gradle.kotlin.dsl.register

// Always use absolute bash so PATH quirks don't matter
fun bash(cmd: String) = listOf("/bin/bash", "-lc", cmd)

val home = System.getenv("HOME") ?: System.getProperty("user.home")

// Make asdf visible to this shell; shims may or may not exist yet
val asdfEnv  = """export PATH="$home/.asdf/bin:$home/.asdf/shims:${'$'}PATH";"""
// Load asdf functions if available (harmless if not)
val asdfInit = """. "$home/.asdf/asdf.sh" >/dev/null 2>&1 || true;"""

tasks.register<Exec>("assertMix") {
    workingDir = file(".")
    commandLine(bash("""
        set -e
        $asdfEnv
        $asdfInit
        # Use asdf exec (works even if shims missing) OR plain mix if on PATH
        if asdf exec mix --version >/dev/null 2>&1; then exit 0; fi
        if command -v mix >/dev/null 2>&1; then exit 0; fi
        echo "mix/asdf not found or no Elixir version selected."
        echo "Fix with one of:"
        echo "  1) cd services/api && asdf local erlang <ver> && asdf local elixir <ver>"
        echo "  2) Create services/api/.tool-versions with pinned versions, then 'asdf install'"
        echo "  3) asdf global erlang <ver> && asdf global elixir <ver>"
        exit 127
    """.trimIndent()))
}

tasks.register<Exec>("depsGet") {
    workingDir = file(".")
    commandLine(bash("""
        $asdfEnv
        $asdfInit
        asdf exec mix deps.get
    """.trimIndent()))
    dependsOn("assertMix")
}

tasks.register<Exec>("ectoSetup") {
    workingDir = file(".")
    commandLine(bash("""
        $asdfEnv
        $asdfInit
        asdf exec mix ecto.setup
    """.trimIndent()))
    dependsOn("depsGet")
}

tasks.register<Exec>("compileApi") {
    workingDir = file(".")
    commandLine(bash("""
        $asdfEnv
        $asdfInit
        asdf exec mix compile
    """.trimIndent()))
    dependsOn("depsGet")
}

tasks.register<Exec>("testApi") {
    workingDir = file(".")
    commandLine(bash("""
        $asdfEnv
        $asdfInit
        export MIX_ENV=test
        asdf exec mix test
    """.trimIndent()))
    dependsOn("depsGet")
}

tasks.register("cleanApi") {
    doLast { delete("_build", "deps") }
}
