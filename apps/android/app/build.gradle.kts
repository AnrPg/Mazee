plugins {
  id("com.android.application")
  kotlin("android")
  id("org.jlleitschuh.gradle.ktlint")
}

ktlint {
  verbose.set(true)
  android.set(true)
  outputToConsole.set(true)
  ignoreFailures.set(false)
  disabledRules.add("experimental:annotation")
}
