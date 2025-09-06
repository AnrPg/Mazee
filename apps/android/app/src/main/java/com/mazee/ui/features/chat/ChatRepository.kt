package com.mazee.ui.features.chat

import javax.inject.Inject
import javax.inject.Singleton

interface ChatRepository {
  suspend fun sendMessage(peerId: String, text: String)
}

@Singleton
class ChatRepositoryStub @Inject constructor() : ChatRepository {
  override suspend fun sendMessage(peerId: String, text: String) {
    // TODO: replace with Phoenix Channels or REST call
  }
}
