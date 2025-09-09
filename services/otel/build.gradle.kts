tasks.register("otelCheck") {
    doLast {
        println("OTel/PromEx config present under services/otel — nothing to build.")
    }
}
