const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');
const maps = require('./maps.json');
const Gamedig = require('gamedig');

// Helper function to get map details
function getMapDetails(map) {
    const mapData = maps[map];
    if (mapData) {
        return {
            image: mapData.image,
            name: mapData.name,
        };
    } else {
        return {
            image: 'default_map_image_url',
            name: 'Unknown Map',
        };
    }
}

// Bot Status Section
bot.on('ready', () => {
    console.log('Bot ile Bağlantı Sağlandı');
    setInterval(() => {
        Gamedig.query({
            type: 'csgo',
            host: config.IP,
            port: config.PORT,
        }).then((state) => {
            const { image: mapImage, name: mapName } = getMapDetails(state.map);
            bot.user.setActivity(
                `${state.players.length} / ${state.maxplayers} 👤 Kişi ${mapName} 🗺️ Haritasında Oynuyor`
            );
            const statusChannel = bot.channels.cache.get(config.STATUS_CHANNEL_ID);
            statusChannel.setName(`Connected: ${state.players.length}`);
        }).catch((error) => {
            console.error(error);
        });
    }, 1000);
});

// Message Section
bot.on('message', (message) => {
    if (message.author.bot || !message.content.startsWith(config.PREFIX)) return;

    const args = message.content.slice(config.PREFIX.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'durum') {
        message.delete();
        Gamedig.query({
            type: 'csgo',
            host: config.IP,
            port: config.PORT,
        }).then((state) => {
            if (state.players && state.players.length > 0) {
                const playerDetails = state.players.map((player) => {
                    const playerTime = new Date(player.time * 1000).toISOString().slice(11, 19);
                    return {
                        name: player.name,
                        score: player.score,
                        time: playerTime,
                    };
                });

                const { image: mapImage, name: mapName } = getMapDetails(state.map);

                const durumEmbed = new Discord.MessageEmbed()
                    .setTitle('***CSFREQ Sunucu Durumu***')
                    .setURL('https://csfreq.com/sunucu-durumu')
                    .setAuthor('CSFREQ Sistem', 'https://i.ibb.co/gvPP5Nk/256x256.png', 'https://csfreq.com')
                    .addFields(
                        {
                            name: '📱 *** Sosyal Medya Hesaplarımız***',
                            value: '[Hesapları Gör](https://csfreq.com/hesaplar)',
                        },
                        {
                            name: '🌐 *** Websitemiz***',
                            value: '[Websitesine Git](https://csfreq.com)',
                        },
                        {
                            name: '🎯 ***Oyuncu Sayısı***',
                            value: `\`\`\`\nToplam ${state.players.length} / ${state.maxplayers} kişi Sunucuda Oynuyor!\n\`\`\``,
                        },
                        {
                            name: '🗺️  ***Harita***',
                            value: `\`\`\`\n${mapName}\n\`\`\``,
                        }
                    )
                    .setImage(mapImage)
                    .setColor('RANDOM')
                    .setFooter('CSFREQ Oyuncu Topluluğu', 'https://i.ibb.co/gvPP5Nk/256x256.png')
                    .setTimestamp();

                playerDetails.forEach((player) => {
                    durumEmbed.addFields(
                        {
                            name: '🎮  ***Oyuncular***',
                            value: `\`\`\`\n${player.name}\n\`\`\``,
                            inline: true,
                        },
                        {
                            name: '🎯 ***Skorlar***',
                            value: `\`\`\`\n${player.score}\n\`\`\``,
                            inline: true,
                        },
                        {
                            name: '🕰️ ***Süreler***',
                            value: `\`\`\`\n${player.time}\n\`\`\``,
                            inline: true,
                        }
                    );
                });

                durumEmbed.addField('Sunucuya Hızlı Bağlantı', '[Sunucuya Bağlan](https://baglan.csfreq.com/)', true);

                message.channel.send(durumEmbed);
                console.log('Kanala Sunucu Durumu Gönderildi');
            } else {
                message.channel.send('Sunucuda şuanda Oyuncu Bulunmuyor!');
            }
        }).catch((error) => {
            message.channel.send('Sunucu şu anda Kapalı veya Bağlanılamıyor.');
            console.error(error);
        }, 2000);
    }
});

bot.login(config.BOT_TOKEN);
