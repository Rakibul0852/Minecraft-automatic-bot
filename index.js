const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const { Vec3 } = require("vec3");
const http = require("http");

const server = {
  host: "rakibul966222.aternos.me", // Change to your server IP
  port: 31444, // Change to your server port if different
  username: "BOT2", // Bot username
};

let bot;

function createBot() {
  bot = mineflayer.createBot(server);

  bot.loadPlugin(pathfinder);

  bot.once("spawn", () => {
    const mcData = require("minecraft-data")(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);

    // Random movement every 5 seconds
    setInterval(() => {
      const pos = bot.entity.position;
      const offset = new Vec3(
        (Math.random() - 1.5) * 8,
        0,
        (Math.random() - 2.5) * 8
      );
      const target = pos.plus(offset);
      bot.pathfinder.setGoal(
        new goals.GoalBlock(Math.floor(target.x), Math.floor(target.y), Math.floor(target.z))
      );
    }, 1000);

    // Dig nearby or below block every 5 seconds
    setInterval(() => {
      const block =
        bot.blockAt(bot.entity.position.offset(0, -1, 0)) ||
        bot.blockAt(bot.entity.position.offset(1, -1, 0)) ||
        bot.blockAt(bot.entity.position.offset(-1, -1, 0));

      if (block && bot.canDigBlock(block)) {
        bot.dig(block).catch(() => {});
      }
    }, 3000);

    // Jump every 10 seconds
    setInterval(() => {
      bot.setControlState("jump", true);
      setTimeout(() => {
        bot.setControlState("jump", false);
      }, 500);
    }, 5000);

    // Quit after 1 minute
    setTimeout(() => {
      bot.quit();
    }, 40000);
  });

  bot.on("end", () => {
    setTimeout(createBot, 1000);
  });

  bot.on("error", () => {});
}

createBot();

// Simple HTTP server for Render deployment
const PORT = process.env.PORT || 3000;

const webServer = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("AFKBOT is running!\n");
});

webServer.listen(PORT, () => {
  console.log(`Web server listening on port ${PORT}`);
});


