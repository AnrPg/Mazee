import org.gradle.kotlin.dsl.register

fun bash(cmd: String) = listOf("bash", "-lc", cmd)

val SPEC = "openapi.yaml"      // path is now relative to packages/openapi
val TS_OUT = "../ts-sdk"       // write to sibling packages/ts-sdk
val KT_OUT = "../kotlin-sdk"   // write to sibling packages/kotlin-sdk

tasks.register<Exec>("genTsClient") {
    // Typescript: typescript-fetch as agreed
    commandLine(
        bash("""
        docker run --rm -v "${'$'}PWD:/local" openapitools/openapi-generator-cli:v7.8.0 generate \
          -i /local/$SPEC \
          -g typescript-fetch \
          -o /local/$TS_OUT \
          --additional-properties=supportsES6=true,typescriptThreePlus=true,withInterfaces=true
        """.trimIndent())
    )
}

tasks.register<Exec>("genKotlinClient") {
    // Kotlin client for Android
    commandLine(
        bash("""
        docker run --rm -v "${'$'}PWD:/local" openapitools/openapi-generator-cli:v7.8.0 generate \
          -i /local/$SPEC \
          -g kotlin \
          -o /local/$KT_OUT \
          --additional-properties=library=jvm-retrofit2,dateLibrary=java8,useCoroutines=true
        """.trimIndent())
    )
}

tasks.register("cleanOpenApi") {
    doLast {
        delete(TS_OUT, KT_OUT)
    }
}
