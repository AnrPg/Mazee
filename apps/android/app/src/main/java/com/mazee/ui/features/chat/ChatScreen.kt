package com.mazee.ui.features.chat

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items

@Composable
fun ChatScreen(peerId: String, vm: ChatViewModel = hiltViewModel()) {
  LaunchedEffect(peerId) { vm.load(peerId) }
  val s by vm.state.collectAsState()

  Scaffold(
    topBar = {
      TopAppBar(title = { Text("Chat with $peerId") },
        actions = {
          val status = if (s.isConnected) "Online" else "Offline"
          Text(status, style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(end = 16.dp))
        })
    }
  ) { inner ->
    Column(Modifier.fillMaxSize().padding(inner)) {
      LazyColumn(
        modifier = Modifier.weight(1f).padding(8.dp),
        reverseLayout = true
      ) {
        items(s.messages.reversed(), key = { it.id }) { msg ->
          ChatBubble(msg)
        }
      }
      MessageBar(
        value = s.input,
        onChange = { vm.onEvent(ChatEvent.InputChanged(it)) },
        onSend = { vm.onEvent(ChatEvent.SendClicked) }
      )
    }
  }
}

@Composable
private fun ChatBubble(m: ChatMessage) {
  Row(
    Modifier.fillMaxWidth().padding(vertical = 4.dp),
    horizontalArrangement = if (m.fromMe) Arrangement.End else Arrangement.Start
  ) {
    Surface(shape = RoundedCornerShape(16.dp), tonalElevation = 2.dp) {
      Text(m.text, modifier = Modifier.padding(12.dp))
    }
  }
}

@Composable
private fun MessageBar(value: String, onChange: (String) -> Unit, onSend: () -> Unit) {
  Row(
    Modifier.fillMaxWidth().padding(8.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    OutlinedTextField(
      value = value,
      onValueChange = onChange,
      modifier = Modifier.weight(1f),
      placeholder = { Text("Type a message…") },
      singleLine = true,
      keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
      keyboardActions = KeyboardActions(onSend = { onSend() })
    )
    Spacer(Modifier.width(8.dp))
    Button(onClick = onSend) { Text("Send") }
  }
}
