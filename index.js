const mineflayer = require('mineflayer')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')
const http = require('http')

const server = {
  host: 'rakibul966222.aternos.me',
  port: 31444,
  username: 'SmartBot'
}

let bot

function createBot() {
  bot = mineflayer.createBot(server)

  bot.loadPlugin(pathfinder)

  bot.once('spawn', () => {
    const mcData = require('minecraft-data')(bot.version)
    const defaultMove = new Movements(bot, mcData)
    bot.pathfinder.setMovements(defaultMove)

    // ✅ Random movement
    setInterval(() => {
      const pos = bot.entity.position
      const offset = new Vec3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10)
      const target = pos.plus(offset)
      bot.pathfinder.setGoal(new goals.GoalBlock(
        Math.floor(target.x),
        Math.floor(target.y),
        Math.floor(target.z)
      ))
    }, 5000)

    // ✅ Dig nearby block
    setInterval(() => {
      const directions = [
        new Vec3(0, -1, 0),
        new Vec3(1, -1, 0),
        new Vec3(-1, -1, 0),
        new Vec3(0, -1, 1),
        new Vec3(0, -1, -1)
      ]
      for (const dir of directions) {
        const block = bot.blockAt(bot.entity.position.plus(dir))
        if (block && bot.canDigBlock(block)) {
          bot.dig(block).catch(() => {})
          break
        }
      }
    }, 10000)

    // ✅ Jump
    setInterval(() => {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
    }, 15000)

    // ✅ Pick up nearby items
    setInterval(() => {
      const items = Object.values(bot.entities).filter(e => e.name === 'item')
      if (items.length > 0) {
        const item = items[0]
        bot.pathfinder.setGoal(new goals.GoalBlock(
          Math.floor(item.position.x),
          Math.floor(item.position.y),
          Math.floor(item.position.z)
        ))
      }
    }, 12000)

    // ✅ Health warning
    setInterval(() => {
      if (bot.health < 10) {
        bot.chat('⚠️ আমার health কমে গেছে! একটু সাবধান হও!')
      }
    }, 7000)

    // ✅ Start HTTP server with bot info
    const httpServer = http.createServer((req, res) => {
      bot.chat('🌐 কেউ HTTP সার্ভারে কানেক্ট করেছে!')
      console.log('📩 HTTP request received:', req.url)

      const botInfo = `
🤖 SmartBot is alive and running inside Minecraft!
🔧 Features:
  - Random movement every 5 seconds
  - Auto block digging
  - Item pickup
  - Health alert in Bengali
  - Chat commands: hello, come, stop
🌍 Server: ${server.host}:${server.port}
📅 Uptime: ${new Date().toLocaleString()}
      `
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end(botInfo)
    })

    httpServer.listen(8080, () => {
      console.log('🚀 HTTP server running on port 8080')
    })
  })

  // ✅ Chat response
  bot.on('chat', (username, message) => {
    if (username === bot.username) return

    const msg = message.toLowerCase()
    if (msg.includes('hello')) {
      bot.chat(`হ্যালো ${username}! আমি এখানে আছি তোমার সাহায্যের জন্য!`)
    }
    if (msg.includes('come')) {
      const player = bot.players[username]?.entity
      if (player) {
        bot.chat('আমি তোমার দিকে আসছি!')
        bot.pathfinder.setGoal(new goals.GoalFollow(player, 1), true)
      }
    }
    if (msg.includes('stop')) {
      bot.chat('ঠিক আছে, আমি থেমে যাচ্ছি।')
      bot.pathfinder.setGoal(null)
    }
  })

  // ✅ Reconnect if disconnected
  bot.on('end', () => {
    console.log('🔌 Bot disconnected. Reconnecting...')
    setTimeout(createBot, 5000)
  })

  // ✅ Error logging
  bot.on('error', (err) => {
    console.log('❌ Bot error:', err)
  })
}

createBot()
