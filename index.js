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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const RADIO_URL = 'https://streaming.radio.funradio.fr/fun-1-44-128.mp3';
const VOICE_CHANNEL_NAME = 'Radio';

const player = createAudioPlayer();
let connection;

async function playRadio() {
  const res = await fetch(RADIO_URL);
  const resource = createAudioResource(res.body, {
    inputType: StreamType.Arbitrary
  });
  player.play(resource);
}

async function connectRadio() {
  const guild = client.guilds.cache.first();
  if (!guild) return;

  const channel = guild.channels.cache.find(
    c => c.name === VOICE_CHANNEL_NAME && c.type === 2
  );
  if (!channel) return;

  connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false
  });

  connection.subscribe(player);

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    playRadio();
  } catch {
    setTimeout(connectRadio, 5000);
  }

  player.on('idle', playRadio);

  connection.on(VoiceConnectionStatus.Disconnected, () => {
    setTimeout(connectRadio, 5000);
  });
}

client.once('ready', () => {
  console.log('Bot connecté');
  connectRadio();
});

client.login(process.env.TOKEN);
