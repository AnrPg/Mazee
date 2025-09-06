package com.mazee

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import dagger.hilt.android.AndroidEntryPoint
import com.mazee.ui.theme.mazeeTheme
import com.mazee.ui.navigation.mazeeNav

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent { mazeeTheme { mazeeNav() } }
  }
}
