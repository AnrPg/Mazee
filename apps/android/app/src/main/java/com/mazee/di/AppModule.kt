package com.mazee.di

import com.mazee.ui.features.chat.ChatRepository
import com.mazee.ui.features.chat.ChatRepositoryStub
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {
  @Binds
  @Singleton
  abstract fun bindChatRepository(impl: ChatRepositoryStub): ChatRepository
}
