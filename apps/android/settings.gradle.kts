pluginManagement {
  repositories {
    google()
    mavenCentral()
    gradlePluginPortal()
  }
  plugins {
    id("com.android.application") version "8.7.2"
    kotlin("android") version "2.0.21"
    id("com.google.dagger.hilt.android") version "2.52"
    kotlin("kapt") version "2.0.21"
  }
}

dependencyResolutionManagement {
  repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
  repositories {
    google()
    mavenCentral()
  }
}

rootProject.name = "mazee-android"
