// ========================
// FUN RADIO BOT H24 RENDER
// ========================

const { Client, GatewayIntentBits } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  StreamType, 
  VoiceConnectionStatus, 
  entersState 
} = require('@discordjs/voice');
const fetch = require('node-fetch');
const ffmpeg = require('ffmpeg-static'); // FFmpeg pour prism-media
const express = require('express'); // Serveur HTTP pour Render

// ------------------------
// Mini serveur HTTP
// ------------------------
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Fun Radio Bot H24 ✅');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ------------------------
// Discord Bot
// ------------------------
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

const RADIO_URL = 'https://streaming.radio.funradio.fr/fun-1-44-128.mp3';
const VOICE_CHANNEL_NAME = 'Radio';

const player = createAudioPlayer();
let connection;

async function playRadio() {
  try {
    console.log('🔊 Tentative de lecture du flux...');
    const res = await fetch(RADIO_URL);
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const resource = createAudioResource(res.body, { inputType: StreamType.Arbitrary });
    player.play(resource);
    console.log('✅ Lecture du flux lancée !');
  } catch (err) {
    console.error('❌ Erreur flux, retry dans 5s:', err.message);
    setTimeout(playRadio, 5000);
  }
}

async function connectRadio() {
  const guild = client.guilds.cache.first();
  if (!guild) return console.log('⚠️ Pas de guild disponible');

  const channel = guild.channels.cache.find(c => c.name === VOICE_CHANNEL_NAME && c.type === 2);
  if (!channel) return console.log(`⚠️ Salon vocal "${VOICE_CHANNEL_NAME}" introuvable`);

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false
  });

  connection.subscribe(player);

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    console.log(`🎉 Connecté au salon "${VOICE_CHANNEL_NAME}"`);
    playRadio();
  } catch {
    console.log('⚠️ Erreur connexion vocale, retry dans 5s');
    setTimeout(connectRadio, 5000);
  }

  player.on('idle', () => {
    console.log('⏹ Flux terminé, relance...');
    playRadio();
  });

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    console.log('🔄 Déconnecté, tentative de reconnexion...');
    setTimeout(connectRadio, 5000);
  });
}

client.once('ready', () => {
  console.log('🤖 Bot connecté à Discord !');
  connectRadio();
});

// ------------------------
// Login
// ------------------------
client.login(process.env.TOKEN);
