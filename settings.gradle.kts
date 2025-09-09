rootProject.name = "mazee"

// Lightweight Exec-only Gradle projects that just delegate to native tools
include(":web", ":api", ":openapi", ":search", ":otel")

project(":web").projectDir = file("apps/web")
project(":api").projectDir = file("services/api")
project(":openapi").projectDir = file("packages/openapi")
project(":search").projectDir = file("services/search")
project(":otel").projectDir = file("services/otel")

// Bring Android in as a composite build (keeps Android’s own Gradle intact)
// includeBuild("apps/android")
