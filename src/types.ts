export interface BotInfo {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  guilds: DiscordGuild[];
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  permissions?: string;
  memberCount?: number;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number; // 0 = GuildText, 2 = GuildVoice, 4 = GuildCategory etc.
  position: number;
  parentId: string | null;
}

export interface UserConfigState {
  userId: string;
  encryptedToken: string;
  salt?: string;
  guildId: string;
  botName: string;
  avatarUrl: string;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id?: string;
  userId: string;
  guildId: string;
  guildName: string;
  actionType: string;
  details: string;
  status: 'SUCCESS' | 'FAILED';
  timestamp: string;
}

export interface BotActionPlan {
  explanation: string;
  actions: {
    type: 'CREATE_CHANNEL' | 'CREATE_CATEGORY' | 'DELETE_CHANNEL' | 'CREATE_ROLE' | 'DELETE_ROLE' | 'MODIFY_SERVER_NAME' | 'MUTE_MEMBER' | 'ADD_BOT';
    params: {
      name?: string;
      channelType?: 'text' | 'voice' | 'category';
      parentId?: string;
      color?: string; // hex string like #ff0000
      roleId?: string;
      channelId?: string;
      memberId?: string;
      serverName?: string;
      reason?: string;
    };
  }[];
}
