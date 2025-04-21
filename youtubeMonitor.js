const { Client } = require('discord.js');
const { YOUTUBE_API_KEY } = process.env;
const axios = require('axios');
const fs = require('fs/promises');

class YouTubeMonitor {
  constructor(client) {
    if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY manquant');
    if (!process.env.CHANNEL_LIVESTREAM_ID) throw new Error('CHANNEL_LIVESTREAM_ID manquant');
    this.client = client;
    this.channelsFile = './youtubeChannels.json';
    this.notifiedFile = './notifiedVideos.json';
    this.interval = process.env.YOUTUBE_CHECK_INTERVAL || 10000;
    this.channelIdCache = new Map();
    this.notifiedVideos = {};
  }

  async initialize() {
    await this.loadChannels();
    this.startMonitoring();
  }

  async loadChannels() {
    try {
      const [channelsData, notifiedData] = await Promise.all([
        fs.readFile(this.channelsFile),
        fs.readFile(this.notifiedFile).catch(() => '{}')
      ]);
      
      this.channels = JSON.parse(channelsData);
      this.notifiedVideos = JSON.parse(notifiedData);
      
      if (!Array.isArray(this.channels)) this.channels = [];
      if (typeof this.notifiedVideos !== 'object') this.notifiedVideos = {};
    } catch (error) {
      this.channels = [];
      this.notifiedVideos = {};
    }
  }

  // Gestion des erreurs dans checkNewVideos
  async checkNewVideos() {
    try {
      for (const channel of this.channels) {
        const response = await axios.get(
          'https://www.googleapis.com/youtube/v3/search',
          {
            params: {
              part: 'snippet',
              channelId: channel.id,
              order: 'date',
              type: 'video',
              maxResults: 1,
              key: YOUTUBE_API_KEY
            }
          }
        );
  
        const latestVideo = response.data.items[0];
        if (latestVideo && !this.notifiedVideos[latestVideo.id.videoId]) {
          this.notifyChannel(latestVideo, channel.username);
          this.notifiedVideos[latestVideo.id.videoId] = Date.now();
          await fs.writeFile(this.notifiedFile, JSON.stringify(this.notifiedVideos));
        }
      }
    } catch (error) {
      console.error('Erreur vérification vidéos:', error);
    }
  }

  static async getChannelId(input) {
    if(!input || input.startsWith('<@')) {
      throw new Error('Veuillez fournir un nom de chaîne YouTube valide');
    }
    
    const cleanedInput = input
      .replace(/^<@!?\d+>\s*/, '') // Supprime les mentions Discord
      .trim();

    try {
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            part: 'snippet',
            type: 'channel',
            q: encodeURIComponent(cleanedInput),
            maxResults: 1,
            key: process.env.YOUTUBE_API_KEY
          }
        }
      );

      if (!response.data?.items?.length) {
        throw new Error(`Chaîne "${cleanedInput}" introuvable`);
      }

      return response.data.items[0].snippet.channelId;
    } catch (error) {
      throw new Error(`Erreur recherche YouTube: ${error.message}`);
    }
  }

  notifyChannel(video, username) {
    this.client.emit('newVideo', {
      video,
      username,
      channelId: process.env.CHANNEL_LIVESTREAM_ID
    });
  }

  startMonitoring() {
    setInterval(() => this.checkNewVideos(), this.interval);
  }

  async reloadChannels() {
    await this.loadChannels();
    console.log('[YOUTUBE] Liste des chaînes rechargée dynamiquement');
  }
}

module.exports = YouTubeMonitor;
