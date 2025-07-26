const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionFlagsBits, ChannelType, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const Canvas = require('canvas');
const moment = require('moment');
const schedule = require('node-schedule');
const { createCanvas, loadImage } = require('canvas');

// ===== VORTEX BOT CONFIGURATION =====
const config = {
    token: 'MTM5ODQ4MTAxNjI4NDUxNjQ4Nw.G7PeRM._ENR1dbldH21w5-o1bXceq4jN5SrDI7XYjDHL0', // Replace with your bot token
    prefix: '!',
    owners: ['1257726366724657296'], // Replace with your Discord user ID
    mongoUrl: 'mongodb://localhost:27017/vortexbot', // MongoDB connection
    groqApiKey: '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',
    version: '2.1.0',
    author: 'Coen-yin',
    createdAt: '2025-07-26 01:38:31'
};

// ===== VORTEX BOT CLASS =====
class VortexBot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.GuildEmojisAndStickers,
                GatewayIntentBits.GuildScheduledEvents,
                GatewayIntentBits.GuildInvites
            ]
        });
        
        this.commands = new Collection();
        this.slashCommands = new Collection();
        this.events = new Collection();
        this.cooldowns = new Collection();
        this.config = config;
        
        // Bot statistics
        this.stats = {
            commandsExecuted: 0,
            messagesProcessed: 0,
            usersServed: new Set(),
            guildsJoined: 0,
            uptime: Date.now(),
            errors: 0
        };
        
        // Features data
        this.economy = new Map(); // User economy data
        this.levels = new Map(); // User level data  
        this.giveaways = new Map(); // Active giveaways
        this.polls = new Map(); // Active polls
        this.reminders = new Map(); // User reminders
        this.warnings = new Map(); // User warnings
        this.musicQueue = new Map(); // Music queues per guild
        this.automod = new Map(); // Auto-moderation settings
        this.welcomeSettings = new Map(); // Welcome/goodbye settings
        this.reactionRoles = new Map(); // Reaction role configs
        this.customCommands = new Map(); // Custom commands per guild
        
        this.init();
    }
    
    async init() {
        console.log('🚀 VortexBot v' + this.config.version + ' starting up...');
        console.log('👤 Created by: ' + this.config.author);
        console.log('📅 Created: ' + this.config.createdAt);
        
        // Load all components
        await this.loadCommands();
        await this.loadSlashCommands();
        await this.loadEvents();
        await this.setupDatabase();
        
        // Login to Discord
        await this.login(this.config.token);
    }
    
    async loadCommands() {
        console.log('📁 Loading prefix commands...');
        
        // Create commands directory structure
        const commandDirs = [
            'commands/general',
            'commands/moderation', 
            'commands/fun',
            'commands/economy',
            'commands/music',
            'commands/utility',
            'commands/admin',
            'commands/games',
            'commands/ai'
        ];
        
        for (const dir of commandDirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
        
        // Define all commands inline for this demo
        this.defineCommands();
        console.log(`✅ Loaded ${this.commands.size} prefix commands`);
    }
    
    async loadSlashCommands() {
        console.log('🔧 Loading slash commands...');
        this.defineSlashCommands();
        console.log(`✅ Loaded ${this.slashCommands.size} slash commands`);
    }
    
    async loadEvents() {
        console.log('📡 Loading events...');
        this.setupEvents();
        console.log('✅ Events loaded successfully');
    }
    
    async setupDatabase() {
        console.log('🗃️ Setting up database...');
        // In a real bot, you'd connect to MongoDB here
        // For this demo, we'll use Maps for data storage
        console.log('✅ Database setup complete (using in-memory storage)');
    }
    
    // ===== COMMAND DEFINITIONS =====
    defineCommands() {
        // GENERAL COMMANDS
        this.commands.set('help', {
            name: 'help',
            category: 'general',
            description: 'Show help information',
            usage: '!help [command]',
            execute: async (message, args) => {
                if (args[0]) {
                    return this.showCommandHelp(message, args[0]);
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('🌪️ VortexBot Help Center')
                    .setDescription('**The Ultimate Discord Bot Experience**')
                    .setColor('#7C3AED')
                    .setThumbnail(this.user.displayAvatarURL())
                    .addFields(
                        { name: '🎯 General', value: '`help`, `info`, `stats`, `ping`, `uptime`', inline: true },
                        { name: '🛡️ Moderation', value: '`ban`, `kick`, `mute`, `warn`, `clear`, `lock`', inline: true },
                        { name: '🎉 Fun', value: '`meme`, `joke`, `8ball`, `roll`, `flip`, `roast`', inline: true },
                        { name: '💰 Economy', value: '`balance`, `daily`, `work`, `shop`, `buy`, `gamble`', inline: true },
                        { name: '🎵 Music', value: '`play`, `skip`, `queue`, `volume`, `lyrics`', inline: true },
                        { name: '🔧 Utility', value: '`weather`, `translate`, `qr`, `shorten`, `avatar`', inline: true },
                        { name: '🎮 Games', value: '`trivia`, `hangman`, `tictactoe`, `rps`, `guessnum`', inline: true },
                        { name: '🤖 AI', value: '`ai`, `image`, `code`, `analyze`, `chat`', inline: true },
                        { name: '⚙️ Admin', value: '`automod`, `welcome`, `reactionrole`, `giveaway`', inline: true }
                    )
                    .setFooter({ 
                        text: `VortexBot v${this.config.version} | Created by ${this.config.author}`,
                        iconURL: this.user.displayAvatarURL()
                    })
                    .setTimestamp();
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Invite Bot')
                            .setStyle(ButtonStyle.Link)
                            .setURL(`https://discord.com/api/oauth2/authorize?client_id=${this.user.id}&permissions=8&scope=bot%20applications.commands`),
                        new ButtonBuilder()
                            .setLabel('Support Server')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://discord.gg/vortexbot'),
                        new ButtonBuilder()
                            .setLabel('Documentation')
                            .setStyle(ButtonStyle.Link)
                            .setURL('https://vortexbot.dev/docs')
                    );
                
                message.reply({ embeds: [embed], components: [row] });
            }
        });
        
        this.commands.set('info', {
            name: 'info',
            category: 'general',
            description: 'Show bot information',
            execute: async (message) => {
                const embed = new EmbedBuilder()
                    .setTitle('🌪️ VortexBot Information')
                    .setColor('#7C3AED')
                    .setThumbnail(this.user.displayAvatarURL())
                    .addFields(
                        { name: '📊 Statistics', value: `**Servers:** ${this.guilds.cache.size}\n**Users:** ${this.users.cache.size}\n**Commands:** ${this.stats.commandsExecuted}`, inline: true },
                        { name: '⚡ Performance', value: `**Uptime:** ${this.formatUptime()}\n**Ping:** ${this.ws.ping}ms\n**Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`, inline: true },
                        { name: '🛠️ Technical', value: `**Version:** ${this.config.version}\n**Node.js:** ${process.version}\n**Discord.js:** v14`, inline: true }
                    )
                    .setFooter({ text: `Created by ${this.config.author} on ${this.config.createdAt}` })
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            }
        });
        
        this.commands.set('ping', {
            name: 'ping',
            category: 'general',
            description: 'Check bot latency',
            execute: async (message) => {
                const sent = await message.reply('🏓 Pinging...');
                const embed = new EmbedBuilder()
                    .setTitle('🏓 Pong!')
                    .setColor('#00FF00')
                    .addFields(
                        { name: '📡 API Latency', value: `${this.ws.ping}ms`, inline: true },
                        { name: '🔄 Bot Latency', value: `${sent.createdTimestamp - message.createdTimestamp}ms`, inline: true },
                        { name: '⚡ Status', value: this.ws.ping < 100 ? 'Excellent' : this.ws.ping < 200 ? 'Good' : 'Poor', inline: true }
                    )
                    .setTimestamp();
                
                sent.edit({ content: null, embeds: [embed] });
            }
        });
        
        // MODERATION COMMANDS
        this.commands.set('ban', {
            name: 'ban',
            category: 'moderation',
            description: 'Ban a user from the server',
            usage: '!ban @user [reason]',
            permissions: [PermissionFlagsBits.BanMembers],
            execute: async (message, args) => {
                if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                    return message.reply('❌ You need the `Ban Members` permission to use this command.');
                }
                
                const user = message.mentions.users.first();
                if (!user) {
                    return message.reply('❌ Please mention a user to ban.');
                }
                
                const member = message.guild.members.cache.get(user.id);
                if (!member) {
                    return message.reply('❌ User not found in this server.');
                }
                
                if (!member.bannable) {
                    return message.reply('❌ I cannot ban this user.');
                }
                
                const reason = args.slice(1).join(' ') || 'No reason provided';
                
                try {
                    await member.ban({ reason: reason });
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🔨 User Banned')
                        .setColor('#FF0000')
                        .addFields(
                            { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                            { name: '👮 Moderator', value: message.author.tag, inline: true },
                            { name: '📝 Reason', value: reason, inline: false }
                        )
                        .setTimestamp();
                    
                    message.reply({ embeds: [embed] });
                    
                    // Log to moderation channel if exists
                    this.logModeration(message.guild, 'ban', user, message.author, reason);
                    
                } catch (error) {
                    message.reply('❌ Failed to ban user: ' + error.message);
                }
            }
        });
        
        this.commands.set('kick', {
            name: 'kick',
            category: 'moderation',
            description: 'Kick a user from the server',
            usage: '!kick @user [reason]',
            permissions: [PermissionFlagsBits.KickMembers],
            execute: async (message, args) => {
                if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                    return message.reply('❌ You need the `Kick Members` permission to use this command.');
                }
                
                const user = message.mentions.users.first();
                if (!user) {
                    return message.reply('❌ Please mention a user to kick.');
                }
                
                const member = message.guild.members.cache.get(user.id);
                if (!member) {
                    return message.reply('❌ User not found in this server.');
                }
                
                if (!member.kickable) {
                    return message.reply('❌ I cannot kick this user.');
                }
                
                const reason = args.slice(1).join(' ') || 'No reason provided';
                
                try {
                    await member.kick(reason);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('👢 User Kicked')
                        .setColor('#FFA500')
                        .addFields(
                            { name: '👤 User', value: `${user.tag} (${user.id})`, inline: true },
                            { name: '👮 Moderator', value: message.author.tag, inline: true },
                            { name: '📝 Reason', value: reason, inline: false }
                        )
                        .setTimestamp();
                    
                    message.reply({ embeds: [embed] });
                    this.logModeration(message.guild, 'kick', user, message.author, reason);
                    
                } catch (error) {
                    message.reply('❌ Failed to kick user: ' + error.message);
                }
            }
        });
        
        this.commands.set('clear', {
            name: 'clear',
            category: 'moderation',
            description: 'Clear messages from channel',
            usage: '!clear <amount>',
            permissions: [PermissionFlagsBits.ManageMessages],
            execute: async (message, args) => {
                if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                    return message.reply('❌ You need the `Manage Messages` permission to use this command.');
                }
                
                const amount = parseInt(args[0]);
                if (!amount || amount < 1 || amount > 100) {
                    return message.reply('❌ Please provide a number between 1 and 100.');
                }
                
                try {
                    const deleted = await message.channel.bulkDelete(amount + 1, true);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🧹 Messages Cleared')
                        .setColor('#00FF00')
                        .setDescription(`Successfully deleted ${deleted.size - 1} messages.`)
                        .setFooter({ text: `Cleared by ${message.author.tag}` })
                        .setTimestamp();
                    
                    const reply = await message.channel.send({ embeds: [embed] });
                    setTimeout(() => reply.delete().catch(() => {}), 5000);
                    
                } catch (error) {
                    message.reply('❌ Failed to clear messages: ' + error.message);
                }
            }
        });
        
        // FUN COMMANDS
        this.commands.set('meme', {
            name: 'meme',
            category: 'fun',
            description: 'Get a random meme',
            execute: async (message) => {
                try {
                    const response = await axios.get('https://meme-api.com/gimme');
                    const meme = response.data;
                    
                    const embed = new EmbedBuilder()
                        .setTitle(meme.title)
                        .setImage(meme.url)
                        .setColor('#FF69B4')
                        .setFooter({ text: `From r/${meme.subreddit} | 👍 ${meme.ups}` })
                        .setTimestamp();
                    
                    message.reply({ embeds: [embed] });
                    
                } catch (error) {
                    message.reply('❌ Could not fetch a meme right now. Try again later!');
                }
            }
        });
        
        this.commands.set('joke', {
            name: 'joke',
            category: 'fun',
            description: 'Get a random joke',
            execute: async (message) => {
                const jokes = [
                    "Why don't scientists trust atoms? Because they make up everything!",
                    "Why did the scarecrow win an award? He was outstanding in his field!",
                    "Why don't eggs tell jokes? They'd crack each other up!",
                    "What do you call a fake noodle? An impasta!",
                    "Why did the math book look so sad? Because it had too many problems!",
                    "What do you call a bear with no teeth? A gummy bear!",
                    "Why don't programmers like nature? It has too many bugs!",
                    "What's the best thing about Switzerland? I don't know, but the flag is a big plus!",
                    "Why do Java developers wear glasses? Because they can't C#!",
                    "How do you organize a space party? You planet!"
                ];
                
                const joke = jokes[Math.floor(Math.random() * jokes.length)];
                
                const embed = new EmbedBuilder()
                    .setTitle('😂 Random Joke')
                    .setDescription(joke)
                    .setColor('#FFD700')
                    .setFooter({ text: 'Hope that made you laugh!' })
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            }
        });
        
        this.commands.set('8ball', {
            name: '8ball',
            category: 'fun',
            description: 'Ask the magic 8-ball a question',
            usage: '!8ball <question>',
            execute: async (message, args) => {
                if (!args.length) {
                    return message.reply('❌ Please ask a question!');
                }
                
                const responses = [
                    'It is certain', 'It is decidedly so', 'Without a doubt', 'Yes definitely',
                    'You may rely on it', 'As I see it, yes', 'Most likely', 'Outlook good',
                    'Yes', 'Signs point to yes', 'Reply hazy, try again', 'Ask again later',
                    'Better not tell you now', 'Cannot predict now', 'Concentrate and ask again',
                    "Don't count on it", 'My reply is no', 'My sources say no',
                    'Outlook not so good', 'Very doubtful'
                ];
                
                const response = responses[Math.floor(Math.random() * responses.length)];
                
                const embed = new EmbedBuilder()
                    .setTitle('🎱 Magic 8-Ball')
                    .addFields(
                        { name: '❓ Question', value: args.join(' ') },
                        { name: '🔮 Answer', value: response }
                    )
                    .setColor('#000000')
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            }
        });
        
        // ECONOMY COMMANDS
        this.commands.set('balance', {
            name: 'balance',
            aliases: ['bal', 'money'],
            category: 'economy',
            description: 'Check your balance',
            usage: '!balance [@user]',
            execute: async (message, args) => {
                const user = message.mentions.users.first() || message.author;
                const userId = user.id;
                
                if (!this.economy.has(userId)) {
                    this.economy.set(userId, { coins: 100, bank: 0, lastDaily: null, lastWork: null });
                }
                
                const userData = this.economy.get(userId);
                const total = userData.coins + userData.bank;
                
                const embed = new EmbedBuilder()
                    .setTitle(`💰 ${user.username}'s Balance`)
                    .setColor('#FFD700')
                    .setThumbnail(user.displayAvatarURL())
                    .addFields(
                        { name: '💵 Wallet', value: `${userData.coins} coins`, inline: true },
                        { name: '🏦 Bank', value: `${userData.bank} coins`, inline: true },
                        { name: '💎 Total', value: `${total} coins`, inline: true }
                    )
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            }
        });
        
        this.commands.set('daily', {
            name: 'daily',
            category: 'economy',
            description: 'Collect your daily coins',
            execute: async (message) => {
                const userId = message.author.id;
                
                if (!this.economy.has(userId)) {
                    this.economy.set(userId, { coins: 100, bank: 0, lastDaily: null, lastWork: null });
                }
                
                const userData = this.economy.get(userId);
                const now = Date.now();
                const dayMs = 24 * 60 * 60 * 1000;
                
                if (userData.lastDaily && (now - userData.lastDaily) < dayMs) {
                    const timeLeft = dayMs - (now - userData.lastDaily);
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    
                    return message.reply(`❌ You already claimed your daily reward! Come back in ${hours}h ${minutes}m.`);
                }
                
                const reward = Math.floor(Math.random() * 500) + 100; // 100-600 coins
                userData.coins += reward;
                userData.lastDaily = now;
                this.economy.set(userId, userData);
                
                const embed = new EmbedBuilder()
                    .setTitle('🎁 Daily Reward')
                    .setDescription(`You received **${reward} coins**!`)
                    .setColor('#00FF00')
                    .setFooter({ text: 'Come back tomorrow for another reward!' })
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            }
        });
        
        this.commands.set('work', {
            name: 'work',
            category: 'economy',
            description: 'Work to earn coins',
            execute: async (message) => {
                const userId = message.author.id;
                
                if (!this.economy.has(userId)) {
                    this.economy.set(userId, { coins: 100, bank: 0, lastDaily: null, lastWork: null });
                }
                
                const userData = this.economy.get(userId);
                const now = Date.now();
                const cooldown = 60 * 60 * 1000; // 1 hour
                
                if (userData.lastWork && (now - userData.lastWork) < cooldown) {
                    const timeLeft = cooldown - (now - userData.lastWork);
                    const minutes = Math.floor(timeLeft / (60 * 1000));
                    
                    return message.reply(`❌ You're tired! Rest for ${minutes} more minutes.`);
                }
                
                const jobs = [
                    { name: 'Programmer', min: 200, max: 500 },
                    { name: 'Pizza Delivery', min: 50, max: 150 },
                    { name: 'Uber Driver', min: 75, max: 200 },
                    { name: 'Freelancer', min: 100, max: 300 },
                    { name: 'YouTuber', min: 25, max: 1000 },
                    { name: 'Streamer', min: 50, max: 800 }
                ];
                
                const job = jobs[Math.floor(Math.random() * jobs.length)];
                const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
                
                userData.coins += earned;
                userData.lastWork = now;
                this.economy.set(userId, userData);
                
                const embed = new EmbedBuilder()
                    .setTitle('💼 Work Complete')
                    .setDescription(`You worked as a **${job.name}** and earned **${earned} coins**!`)
                    .setColor('#00FF00')
                    .setTimestamp();
                
                message.reply({ embeds: [embed] });
            }
        });
        
        // AI COMMANDS
        this.commands.set('ai', {
            name: 'ai',
            category: 'ai',
            description: 'Chat with AI',
            usage: '!ai <message>',
            execute: async (message, args) => {
                if (!args.length) {
                    return message.reply('❌ Please provide a message for the AI!');
                }
                
                const prompt = args.join(' ');
                await message.channel.sendTyping();
                
                try {
                    const response = await this.callGroqAPI(prompt);
                    
                    const embed = new EmbedBuilder()
                        .setTitle('🤖 VortexBot AI')
                        .addFields(
                            { name: '💭 Your Message', value: prompt.slice(0, 1024) },
                            { name: '🧠 AI Response', value: response.slice(0, 1024) }
                        )
                        .setColor('#7C3AED')
                        .setFooter({ text: 'Powered by Llama 3.3 70B' })
                        .setTimestamp();
                    
                    message.reply({ embeds: [embed] });
                    
                } catch (error) {
                    message.reply('❌ Sorry, AI is currently unavailable. Please try again later.');
                }
            }
        });
        
        // UTILITY COMMANDS
        this.commands.set('weather', {
            name: 'weather',
            category: 'utility',
            description: 'Get weather information',
            usage: '!weather <city>',
            execute: async (message, args) => {
                if (!args.length) {
                    return message.reply('❌ Please provide a city name!');
                }
                
                const city = args.join(' ');
                
                try {
                    // Mock weather data (replace with real API)
                    const weather = {
                        city: city,
                        temperature: Math.floor(Math.random() * 40) - 10,
                        condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
                        humidity: Math.floor(Math.random() * 100),
                        windSpeed: Math.floor(Math.random() * 30)
                    };
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`🌤️ Weather in ${weather.city}`)
                        .setColor('#87CEEB')
                        .addFields(
                            { name: '🌡️ Temperature', value: `${weather.temperature}°C`, inline: true },
                            { name: '☁️ Condition', value: weather.condition, inline: true },
                            { name: '💧 Humidity', value: `${weather.humidity}%`, inline: true },
                            { name: '💨 Wind Speed', value: `${weather.windSpeed} km/h`, inline: true }
                        )
                        .setTimestamp();
                    
                    message.reply({ embeds: [embed] });
                    
                } catch (error) {
                    message.reply('❌ Could not fetch weather data for that location.');
                }
            }
        });
        
        this.commands.set('avatar', {
            name: 'avatar',
            aliases: ['av'],
            category: 'utility',
            description: 'Get user avatar',
            usage: '!avatar [@user]',
            execute: async (message, args) => {
                const user = message.mentions.users.first() || message.author;
                
                const embed = new EmbedBuilder()
                    .setTitle(`${user.username}'s Avatar`)
                    .setImage(user.displayAvatarURL({ dynamic: true, size: 512 }))
                    .setColor('#7C3AED')
                    .setTimestamp();
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('Download')
                            .setStyle(ButtonStyle.Link)
                            .setURL(user.displayAvatarURL({ dynamic: true, size: 1024 }))
                    );
                
                message.reply({ embeds: [embed], components: [row] });
            }
        });
        
        // Add more commands...
        console.log('✅ Commands defined successfully');
    }
    
    // ===== SLASH COMMANDS =====
    defineSlashCommands() {
        const commands = [
            new SlashCommandBuilder()
                .setName('vortex')
                .setDescription('Main VortexBot command')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('info')
                        .setDescription('Get bot information')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('help')
                        .setDescription('Get help information')
                ),
                
            new SlashCommandBuilder()
                .setName('ai')
                .setDescription('Chat with VortexBot AI')
                .addStringOption(option =>
                    option
                        .setName('message')
                        .setDescription('Your message to the AI')
                        .setRequired(true)
                ),
                
            new SlashCommandBuilder()
                .setName('economy')
                .setDescription('Economy commands')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('balance')
                        .setDescription('Check your balance')
                        .addUserOption(option =>
                            option
                                .setName('user')
                                .setDescription('User to check balance for')
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('daily')
                        .setDescription('Claim daily reward')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('work')
                        .setDescription('Work to earn coins')
                ),
                
            new SlashCommandBuilder()
                .setName('moderation')
                .setDescription('Moderation commands')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('ban')
                        .setDescription('Ban a user')
                        .addUserOption(option =>
                            option
                                .setName('user')
                                .setDescription('User to ban')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option
                                .setName('reason')
                                .setDescription('Reason for ban')
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('kick')
                        .setDescription('Kick a user')
                        .addUserOption(option =>
                            option
                                .setName('user')
                                .setDescription('User to kick')
                                .setRequired(true)
                        )
                        .addStringOption(option =>
                            option
                                .setName('reason')
                                .setDescription('Reason for kick')
                        )
                )
        ];
        
        commands.forEach(command => {
            this.slashCommands.set(command.name, command);
        });
    }
    
    // ===== EVENT HANDLERS =====
    setupEvents() {
        this.once('ready', () => {
            console.log(`🚀 ${this.user.tag} is online!`);
            console.log(`📊 Serving ${this.guilds.cache.size} servers and ${this.users.cache.size} users`);
            
            // Set bot activity
            this.user.setActivity({
                name: `🌪️ VortexBot v${this.config.version} | !help`,
                type: 'PLAYING'
            });
            
            // Register slash commands
            this.registerSlashCommands();
            
            // Start scheduled tasks
            this.startScheduledTasks();
        });
        
        this.on('messageCreate', async (message) => {
            if (message.author.bot) return;
            
            this.stats.messagesProcessed++;
            this.stats.usersServed.add(message.author.id);
            
            // Handle prefix commands
            if (message.content.startsWith(this.config.prefix)) {
                await this.handlePrefixCommand(message);
            }
            
            // Level system
            await this.handleLevelSystem(message);
            
            // Auto-moderation
            await this.handleAutoModeration(message);
        });
        
        this.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButtonInteraction(interaction);
            } else if (interaction.isSelectMenu()) {
                await this.handleSelectMenuInteraction(interaction);
            }
        });
        
        this.on('guildMemberAdd', async (member) => {
            await this.handleMemberJoin(member);
        });
        
        this.on('guildMemberRemove', async (member) => {
            await this.handleMemberLeave(member);
        });
        
        this.on('guildCreate', (guild) => {
            this.stats.guildsJoined++;
            console.log(`📈 Joined new guild: ${guild.name} (${guild.memberCount} members)`);
        });
        
        this.on('error', (error) => {
            console.error('❌ Discord client error:', error);
            this.stats.errors++;
        });
    }
    
    // ===== COMMAND HANDLERS =====
    async handlePrefixCommand(message) {
        const args = message.content.slice(this.config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = this.commands.get(commandName) || 
                      this.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) return;
        
        // Cooldown check
        if (!this.cooldowns.has(command.name)) {
            this.cooldowns.set(command.name, new Collection());
        }
        
        const now = Date.now();
        const timestamps = this.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply(`⏱️ Please wait ${timeLeft.toFixed(1)} more seconds before using \`${command.name}\` again.`);
            }
        }
        
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        try {
            await command.execute(message, args);
            this.stats.commandsExecuted++;
        } catch (error) {
            console.error('Command execution error:', error);
            message.reply('❌ An error occurred while executing this command.');
            this.stats.errors++;
        }
    }
    
    async handleSlashCommand(interaction) {
        const command = this.slashCommands.get(interaction.commandName);
        if (!command) return;
        
        try {
            // Handle subcommands
            if (interaction.options.getSubcommand(false)) {
                const subcommand = interaction.options.getSubcommand();
                await this.executeSlashSubcommand(interaction, interaction.commandName, subcommand);
            } else {
                await this.executeSlashCommand(interaction, interaction.commandName);
            }
            
            this.stats.commandsExecuted++;
            
        } catch (error) {
            console.error('Slash command error:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Command Error')
                .setDescription('An error occurred while executing this command.')
                .setColor('#FF0000')
                .setTimestamp();
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            this.stats.errors++;
        }
    }
    
    async executeSlashSubcommand(interaction, commandName, subcommand) {
        switch (commandName) {
            case 'vortex':
                if (subcommand === 'info') {
                    await this.slashInfo(interaction);
                } else if (subcommand === 'help') {
                    await this.slashHelp(interaction);
                }
                break;
                
            case 'economy':
                if (subcommand === 'balance') {
                    await this.slashBalance(interaction);
                } else if (subcommand === 'daily') {
                    await this.slashDaily(interaction);
                } else if (subcommand === 'work') {
                    await this.slashWork(interaction);
                }
                break;
                
            case 'moderation':
                if (subcommand === 'ban') {
                    await this.slashBan(interaction);
                } else if (subcommand === 'kick') {
                    await this.slashKick(interaction);
                }
                break;
        }
    }
    
    async executeSlashCommand(interaction, commandName) {
        switch (commandName) {
            case 'ai':
                await this.slashAI(interaction);
                break;
        }
    }
    
    // ===== SLASH COMMAND IMPLEMENTATIONS =====
    async slashInfo(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🌪️ VortexBot Information')
            .setColor('#7C3AED')
            .setThumbnail(this.user.displayAvatarURL())
            .addFields(
                { name: '📊 Statistics', value: `**Servers:** ${this.guilds.cache.size}\n**Users:** ${this.users.cache.size}\n**Commands:** ${this.stats.commandsExecuted}`, inline: true },
                { name: '⚡ Performance', value: `**Uptime:** ${this.formatUptime()}\n**Ping:** ${this.ws.ping}ms\n**Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`, inline: true },
                { name: '🛠️ Technical', value: `**Version:** ${this.config.version}\n**Node.js:** ${process.version}\n**Discord.js:** v14`, inline: true }
            )
            .setFooter({ text: `Created by ${this.config.author} on ${this.config.createdAt}` })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
    
    async slashHelp(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🌪️ VortexBot Help Center')
            .setDescription('**The Ultimate Discord Bot Experience**')
            .setColor('#7C3AED')
            .setThumbnail(this.user.displayAvatarURL())
            .addFields(
                { name: '🎯 General', value: '`/vortex info`, `/vortex help`', inline: true },
                { name: '💰 Economy', value: '`/economy balance`, `/economy daily`, `/economy work`', inline: true },
                { name: '🛡️ Moderation', value: '`/moderation ban`, `/moderation kick`', inline: true },
                { name: '🤖 AI', value: '`/ai <message>`', inline: true },
                { name: '🎵 Music', value: 'Coming Soon!', inline: true },
                { name: '🎮 Games', value: 'Coming Soon!', inline: true }
            )
            .setFooter({ 
                text: `VortexBot v${this.config.version} | Created by ${this.config.author}`,
                iconURL: this.user.displayAvatarURL()
            })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
    
    async slashAI(interaction) {
        const message = interaction.options.getString('message');
        
        await interaction.deferReply();
        
        try {
            const response = await this.callGroqAPI(message);
            
            const embed = new EmbedBuilder()
                .setTitle('🤖 VortexBot AI')
                .addFields(
                    { name: '💭 Your Message', value: message.slice(0, 1024) },
                    { name: '🧠 AI Response', value: response.slice(0, 1024) }
                )
                .setColor('#7C3AED')
                .setFooter({ text: 'Powered by Llama 3.3 70B' })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            await interaction.editReply('❌ Sorry, AI is currently unavailable. Please try again later.');
        }
    }
    
    async slashBalance(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userId = targetUser.id;
        
        if (!this.economy.has(userId)) {
            this.economy.set(userId, { coins: 100, bank: 0, lastDaily: null, lastWork: null });
        }
        
        const userData = this.economy.get(userId);
        const total = userData.coins + userData.bank;
        
        const embed = new EmbedBuilder()
            .setTitle(`💰 ${targetUser.username}'s Balance`)
            .setColor('#FFD700')
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '💵 Wallet', value: `${userData.coins} coins`, inline: true },
                { name: '🏦 Bank', value: `${userData.bank} coins`, inline: true },
                { name: '💎 Total', value: `${total} coins`, inline: true }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
    
    async slashDaily(interaction) {
        const userId = interaction.user.id;
        
        if (!this.economy.has(userId)) {
            this.economy.set(userId, { coins: 100, bank: 0, lastDaily: null, lastWork: null });
        }
        
        const userData = this.economy.get(userId);
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        
        if (userData.lastDaily && (now - userData.lastDaily) < dayMs) {
            const timeLeft = dayMs - (now - userData.lastDaily);
            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            
            return await interaction.reply({
                content: `❌ You already claimed your daily reward! Come back in ${hours}h ${minutes}m.`,
                ephemeral: true
            });
        }
        
        const reward = Math.floor(Math.random() * 500) + 100;
        userData.coins += reward;
        userData.lastDaily = now;
        this.economy.set(userId, userData);
        
        const embed = new EmbedBuilder()
            .setTitle('🎁 Daily Reward')
            .setDescription(`You received **${reward} coins**!`)
            .setColor('#00FF00')
            .setFooter({ text: 'Come back tomorrow for another reward!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
    
    async slashWork(interaction) {
        const userId = interaction.user.id;
        
        if (!this.economy.has(userId)) {
            this.economy.set(userId, { coins: 100, bank: 0, lastDaily: null, lastWork: null });
        }
        
        const userData = this.economy.get(userId);
        const now = Date.now();
        const cooldown = 60 * 60 * 1000; // 1 hour
        
        if (userData.lastWork && (now - userData.lastWork) < cooldown) {
            const timeLeft = cooldown - (now - userData.lastWork);
            const minutes = Math.floor(timeLeft / (60 * 1000));
            
            return await interaction.reply({
                content: `❌ You're tired! Rest for ${minutes} more minutes.`,
                ephemeral: true
            });
        }
        
        const jobs = [
            { name: 'Discord Bot Developer', min: 300, max: 800 },
            { name: 'Twitch Streamer', min: 100, max: 500 },
            { name: 'YouTube Creator', min: 150, max: 600 },
            { name: 'Game Developer', min: 200, max: 700 },
            { name: 'Web Designer', min: 250, max: 550 },
            { name: 'Digital Artist', min: 180, max: 450 }
        ];
        
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const earned = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min;
        
        userData.coins += earned;
        userData.lastWork = now;
        this.economy.set(userId, userData);
        
        const embed = new EmbedBuilder()
            .setTitle('💼 Work Complete')
            .setDescription(`You worked as a **${job.name}** and earned **${earned} coins**!`)
            .setColor('#00FF00')
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
    
    // ===== UTILITY FUNCTIONS =====
    async callGroqAPI(prompt) {
        try {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are VortexBot AI, a helpful and friendly Discord bot assistant created by ${this.config.author}. You are knowledgeable, witty, and always ready to help users with their questions. Keep responses concise but informative. Current time: ${this.config.createdAt} UTC.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.groqApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data.choices[0].message.content;
            
        } catch (error) {
            console.error('Groq API Error:', error.response?.data || error.message);
            throw new Error('AI service unavailable');
        }
    }
    
    formatUptime() {
        const uptime = Date.now() - this.stats.uptime;
        const days = Math.floor(uptime / (24 * 60 * 60 * 1000));
        const hours = Math.floor((uptime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((uptime % (60 * 60 * 1000)) / (60 * 1000));
        
        return `${days}d ${hours}h ${minutes}m`;
    }
    
    async registerSlashCommands() {
        try {
            console.log('🔄 Registering slash commands...');
            
            const commands = Array.from(this.slashCommands.values()).map(command => command.toJSON());
            
            await this.application.commands.set(commands);
            console.log(`✅ Successfully registered ${commands.length} slash commands`);
            
        } catch (error) {
            console.error('❌ Failed to register slash commands:', error);
        }
    }
    
    startScheduledTasks() {
        console.log('⏰ Starting scheduled tasks...');
        
        // Daily statistics reset
        schedule.scheduleJob('0 0 * * *', () => {
            console.log('📊 Daily statistics reset');
            // Reset daily stats here
        });
        
        // Weekly backup
        schedule.scheduleJob('0 0 * * 0', () => {
            console.log('💾 Weekly data backup');
            // Backup data here
        });
        
        console.log('✅ Scheduled tasks started');
    }
    
    async handleLevelSystem(message) {
        const userId = message.author.id;
        
        if (!this.levels.has(userId)) {
            this.levels.set(userId, { xp: 0, level: 1, messages: 0 });
        }
        
        const userData = this.levels.get(userId);
        userData.messages++;
        userData.xp += Math.floor(Math.random() * 25) + 10; // 10-35 XP per message
        
        const requiredXP = userData.level * 100;
        
        if (userData.xp >= requiredXP) {
            userData.level++;
            userData.xp = 0;
            
            const embed = new EmbedBuilder()
                .setTitle('🎉 Level Up!')
                .setDescription(`${message.author} reached **Level ${userData.level}**!`)
                .setColor('#FFD700')
                .setThumbnail(message.author.displayAvatarURL())
                .setTimestamp();
            
            message.channel.send({ embeds: [embed] });
        }
        
        this.levels.set(userId, userData);
    }
    
    async handleAutoModeration(message) {
        const guildId = message.guild.id;
        
        if (!this.automod.has(guildId)) {
            this.automod.set(guildId, {
                enabled: false,
                antiSpam: true,
                antiLink: false,
                badWords: [],
                maxMentions: 5
            });
        }
        
        const settings = this.automod.get(guildId);
        if (!settings.enabled) return;
        
        const content = message.content.toLowerCase();
        
        // Anti-spam check
        if (settings.antiSpam) {
            // Implement spam detection logic
        }
        
        // Bad words filter
        if (settings.badWords.some(word => content.includes(word))) {
            await message.delete();
            const warning = await message.channel.send(`${message.author}, please watch your language!`);
            setTimeout(() => warning.delete().catch(() => {}), 5000);
        }
        
        // Too many mentions
        if (message.mentions.users.size > settings.maxMentions) {
            await message.delete();
            const warning = await message.channel.send(`${message.author}, please don't mention too many users at once!`);
            setTimeout(() => warning.delete().catch(() => {}), 5000);
        }
    }
    
    async handleMemberJoin(member) {
        const guildId = member.guild.id;
        
        if (!this.welcomeSettings.has(guildId)) return;
        
        const settings = this.welcomeSettings.get(guildId);
        if (!settings.enabled || !settings.channel) return;
        
        const channel = member.guild.channels.cache.get(settings.channel);
        if (!channel) return;
        
        const embed = new EmbedBuilder()
            .setTitle('👋 Welcome!')
            .setDescription(`Welcome to **${member.guild.name}**, ${member}!`)
            .setColor('#00FF00')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '👤 Member Count', value: `${member.guild.memberCount}`, inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp();
        
        channel.send({ embeds: [embed] });
    }
    
    async handleMemberLeave(member) {
        const guildId = member.guild.id;
        
        if (!this.welcomeSettings.has(guildId)) return;
        
        const settings = this.welcomeSettings.get(guildId);
        if (!settings.enabled || !settings.channel || !settings.goodbye) return;
        
        const channel = member.guild.channels.cache.get(settings.channel);
        if (!channel) return;
        
        const embed = new EmbedBuilder()
            .setTitle('👋 Goodbye!')
            .setDescription(`**${member.user.tag}** has left the server.`)
            .setColor('#FF0000')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '👤 Member Count', value: `${member.guild.memberCount}`, inline: true }
            )
            .setTimestamp();
        
        channel.send({ embeds: [embed] });
    }
    
    async logModeration(guild, action, target, moderator, reason) {
        // Find moderation log channel
        const logChannel = guild.channels.cache.find(channel => 
            channel.name.includes('mod-log') || 
            channel.name.includes('audit-log') ||
            channel.name.includes('moderation')
        );
        
        if (!logChannel) return;
        
        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Moderation Action: ${action.toUpperCase()}`)
            .setColor(action === 'ban' ? '#FF0000' : '#FFA500')
            .addFields(
                { name: '👤 Target', value: `${target.tag} (${target.id})`, inline: true },
                { name: '👮 Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                { name: '📝 Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        logChannel.send({ embeds: [embed] }).catch(() => {});
    }
    
    async handleButtonInteraction(interaction) {
        // Handle button clicks
        if (interaction.customId.startsWith('giveaway_')) {
            await this.handleGiveawayEntry(interaction);
        } else if (interaction.customId.startsWith('poll_')) {
            await this.handlePollVote(interaction);
        }
    }
    
    async handleSelectMenuInteraction(interaction) {
        // Handle select menu interactions
        if (interaction.customId === 'help_category') {
            await this.handleHelpCategorySelect(interaction);
        }
    }
    
    showCommandHelp(message, commandName) {
        const command = this.commands.get(commandName);
        if (!command) {
            return message.reply('❌ Command not found!');
        }
        
        const embed = new EmbedBuilder()
            .setTitle(`📖 Command: ${command.name}`)
            .setColor('#7C3AED')
            .addFields(
                { name: '📝 Description', value: command.description || 'No description available' },
                { name: '📋 Usage', value: command.usage || `!${command.name}` },
                { name: '📂 Category', value: command.category || 'General' }
            );
        
        if (command.aliases) {
            embed.addFields({ name: '🔗 Aliases', value: command.aliases.join(', ') });
        }
        
        if (command.permissions) {
            embed.addFields({ name: '🔒 Required Permissions', value: command.permissions.join(', ') });
        }
        
        embed.setTimestamp();
        
        message.reply({ embeds: [embed] });
    }
}

// ===== PACKAGE.JSON CONTENT =====
const packageJson = {
    "name": "vortexbot",
    "version": "2.1.0",
    "description": "The Ultimate Discord Bot - VortexBot with tons of amazing features!",
    "main": "index.js",
    "scripts": {
        "start": "node index.js",
        "dev": "nodemon index.js",
        "test": "echo \"Error: no test specified\" && exit 1"
    },
    "keywords": ["discord", "bot", "vortex", "ai", "economy", "moderation", "music", "games"],
    "author": "Coen-yin",
    "license": "MIT",
    "dependencies": {
        "discord.js": "^14.14.1",
        "axios": "^1.6.2",
        "canvas": "^2.11.2",
        "cheerio": "^1.0.0-rc.12",
        "moment": "^2.29.4",
        "node-schedule": "^2.1.1",
        "mongoose": "^8.0.3",
        "ytdl-core": "^4.11.5",
        "@discordjs/voice": "^0.16.1",
        "ffmpeg-static": "^5.2.0",
        "genius-lyrics": "^4.4.7"
    },
    "devDependencies": {
        "nodemon": "^3.0.2"
    },
    "engines": {
        "node": ">=16.0.0"
    },
    "repository": {
        "type": "git",
        "url": "https://github.com/Coen-yin/VortexBot.git"
    },
    "bugs": {
        "url": "https://github.com/Coen-yin/VortexBot/issues"
    },
    "homepage": "https://github.com/Coen-yin/VortexBot#readme"
};

// ===== README.MD CONTENT =====
const readmeContent = `# 🌪️ VortexBot - The Ultimate Discord Bot

<div align="center">
  <img src="https://via.placeholder.com/400x200/7C3AED/FFFFFF?text=VortexBot" alt="VortexBot Logo">
  
  [![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)](https://discord.js.org/)
  [![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg)](https://nodejs.org/)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Version](https://img.shields.io/badge/version-2.1.0-purple.svg)](package.json)
</div>

## ✨ Features

### 🎯 **General Commands**
- \`!help\` - Comprehensive help system
- \`!info\` - Bot statistics and information
- \`!ping\` - Check bot latency
- \`!uptime\` - Bot uptime information

###
