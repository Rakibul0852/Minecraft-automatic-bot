const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')
const fetch = require('node-fetch')
const http = require('http')

const GEMINI_API_KEY = 'AIzaSyB05lYaarzH8GrGpcnVmGZ7_SNeZIwcZaQ'

const server = {
  host: 'rakibul966222.aternos.me',
  port: 31444,
  username: 'BOT_NAME'
}

let bot

async function askGemini(prompt) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })
    const data = await res.json()
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
  } catch (err) {
    console.error('Gemini API error:', err)
    return 'Error from AI'
  }
}

function createBot() {
  bot = mineflayer.createBot(server)
  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)

    bot.chat('✅ Bot connected and ready!')

    // Random movement loop
    setInterval(() => {
      const pos = bot.entity.position
      const offset = new Vec3(
        (Math.random() - 0.5) * 8,
        0,
        (Math.random() - 0.5) * 8
      )
      const target = pos.plus(offset)
      bot.pathfinder.setGoal(new goals.GoalBlock(
        Math.floor(target.x),
        Math.floor(target.y),
        Math.floor(target.z)
      ))
    }, 3000)

    // Anti-AFK: প্রতি 20 সেকেন্ডে লাফ দিবে
    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
    }, 20000)
  })

  // OP হলে Creative মোডে যাবে
  bot.on('op', () => {
    if (bot.game.gameMode === 'survival') {
      bot.chat('/gamemode creative')
      bot.chat('🎨 Switched to Creative mode!')
    }
  })

  // Chat commands
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return

    if (message.startsWith('/ai ')) {
      const prompt = message.slice(4).trim()
      bot.chat(`Processing: ${prompt}`)
      const aiResponse = await askGemini(prompt)
      bot.chat(`AI says: ${aiResponse}`)
    }

    if (message === '.Rakib966222') {
      const target = bot.players[username]?.entity
      if (!target) {
        bot.chat("I can't see you!")
        return
      }
      bot.chat(`Following ${username}...`)
      bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true)
    }

    if (message === '/inv') {
      const items = bot.inventory.items().map(i => `${i.name} x${i.count}`).join(', ')
      bot.chat(items || 'Inventory is empty')
    }
  })

  // যদি কিক হয় বা কানেকশন শেষ হয় → সাথে সাথে রি-কানেক্ট
  bot.on('end', () => {
    console.log('Bot disconnected. Reconnecting in 3s...')
    setTimeout(createBot, 3000)
  })

  bot.on('kicked', reason => {
    console.log('Kicked:', reason)
  })

  bot.on('error', err => {
    console.error('Bot error:', err)
  })
}

// লোকাল পোর্ট ওপেন করে স্ট্যাটাস দেখানো
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('🤖 Minecraft Bot is running and connected to rakibul966222.aternos.me:31444\n')
}).listen(8080, () => {
  console.log('Status server running at http://localhost:8080')
})

createBot()
