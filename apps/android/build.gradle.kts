plugins {
  id("com.android.application")
  kotlin("android")
  id("com.google.dagger.hilt.android")
  kotlin("kapt")
  id("org.jlleitschuh.gradle.ktlint") version "12.1.1" apply false
}

android {
  namespace = "com.mazee"
  compileSdk = 35

  defaultConfig {
    applicationId = "com.mazee"
    minSdk = 24
    targetSdk = 35
    versionCode = 1
    versionName = "0.1.0"

    vectorDrawables.useSupportLibrary = true
  }

  buildTypes {
    release {
      isMinifyEnabled = true
      proguardFiles(
        getDefaultProguardFile("proguard-android-optimize.txt"),
        "proguard-rules.pro"
      )
    }
    debug {
      isMinifyEnabled = false
    }
  }

  buildFeatures { compose = true }

  composeOptions {
    kotlinCompilerExtensionVersion = "1.5.15"
  }

  packaging {
    resources.excludes += setOf(
      "/META-INF/{AL2.0,LGPL2.1}",
      "META-INF/DEPENDENCIES"
    )
  }

  kotlinOptions { jvmTarget = "17" }
}

dependencies {
  // Compose BOM keeps versions in sync
  implementation(platform("androidx.compose:compose-bom:2025.01.00"))
  implementation("androidx.compose.ui:ui")
  implementation("androidx.compose.ui:ui-tooling-preview")
  debugImplementation("androidx.compose.ui:ui-tooling")
  implementation("androidx.compose.material3:material3")
  implementation("androidx.activity:activity-compose:1.9.3")
  implementation("androidx.navigation:navigation-compose:2.8.3")

  // Lifecycle / ViewModel
  implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
  implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")

  // Hilt
  implementation("com.google.dagger:hilt-android:2.52")
  kapt("com.google.dagger:hilt-android-compiler:2.52")
  implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

  // Coroutines
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")

  // Networking / Images (stub now; you can add Retrofit/Ktor later)
  implementation("io.coil-kt:coil-compose:2.7.0")
}
