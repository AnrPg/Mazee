package com.mazee.ui.features.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
  private val repo: ChatRepository
) : ViewModel() {

  private val _state = MutableStateFlow(ChatState())
  val state = _state.asStateFlow()

  fun load(peerId: String) {
    // Demo: preload a couple of messages
    _state.update {
      it.copy(messages = listOf(
        ChatMessage("1", fromMe = false, text = "Χαίρετε! 👋", ts = System.currentTimeMillis()-60000),
        ChatMessage("2", fromMe = true, text = "Γεια σου!", ts = System.currentTimeMillis()-30000)
      ))
    }
  }

  fun onEvent(e: ChatEvent) {
    when (e) {
      is ChatEvent.InputChanged -> _state.update { it.copy(input = e.value) }
      ChatEvent.SendClicked -> {
        val text = state.value.input.trim()
        if (text.isEmpty()) return
        viewModelScope.launch {
          repo.sendMessage("peer", text) // stub
          _state.update {
            it.copy(
              input = "",
              messages = it.messages + ChatMessage(
                id = System.nanoTime().toString(),
                fromMe = true,
                text = text,
                ts = System.currentTimeMillis()
              )
            )
          }
        }
      }
    }
  }
}
