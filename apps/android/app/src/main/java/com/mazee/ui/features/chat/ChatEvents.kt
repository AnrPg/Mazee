package com.mazee.ui.features.chat

sealed interface ChatEvent {
  data class InputChanged(val value: String) : ChatEvent
  data object SendClicked : ChatEvent
}
