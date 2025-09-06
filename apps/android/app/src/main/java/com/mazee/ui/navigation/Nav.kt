package com.mazee.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mazee.ui.features.chat.ChatScreen

@Composable
fun mazeeNav() {
  val nav = rememberNavController()
  NavHost(navController = nav, startDestination = "chat/demo") {
    composable("chat/{peerId}") { backStack ->
      val peerId = backStack.arguments?.getString("peerId") ?: "demo"
      ChatScreen(peerId = peerId)
    }
  }
}
