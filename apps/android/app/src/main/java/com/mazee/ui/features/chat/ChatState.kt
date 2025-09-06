package com.mazee.ui.features.chat

data class ChatMessage(
  val id: String,
  val fromMe: Boolean,
  val text: String,
  val ts: Long
)

data class ChatState(
  val messages: List<ChatMessage> = emptyList(),
  val input: String = "",
  val isConnected: Boolean = true
)
