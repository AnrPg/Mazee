plugins { /* none needed */ }

// val androidAssembleDebug = gradle.includedBuild("apps/android").task(":app:assembleDebug")
// val androidTest = gradle.includedBuild("apps/android").task(":app:testDebugUnitTest")
// val androidClean = gradle.includedBuild("apps/android").task(":clean")

tasks.register("buildAll") {
    dependsOn(":openapi:genTsClient", ":openapi:genKotlinClient")
    dependsOn(":api:compileApi")
    dependsOn(":web:buildWeb")
    // dependsOn(androidAssembleDebug)
}

tasks.register("testAll") {
    dependsOn(":api:testApi")
    dependsOn(":web:testWeb")
    // dependsOn(androidTest)
}

tasks.register("cleanAll") {
    dependsOn(":openapi:cleanOpenApi", ":api:cleanApi", ":web:cleanWeb")
    // dependsOn(androidClean)
}

// Optional: convenience tasks for search infra
tasks.register("searchUp") { dependsOn(":search:meiliUp") }
tasks.register("searchSeed") { dependsOn(":search:meiliSeed") }
tasks.register("searchDown") { dependsOn(":search:meiliDown") }
