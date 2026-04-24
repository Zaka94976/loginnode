const Redis = require("ioredis");
const { config } = require("../config");
const logger = require("../utils/logger");

class RedisService {
  constructor() {
    this.client = null;
    this.useInMemory = false;
    this.inMemoryStore = new Map();
    this.inMemoryTimestamps = new Map();
  }

  async connect() {
    try {
      this.client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn("Redis max retries reached, using in-memory fallback");
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });

      this.client.on("error", (err) => {
        logger.warn("Redis error, using in-memory fallback:", err.message);
        this.useInMemory = true;
      });

      await this.client.ping();
      this.useInMemory = false;
      logger.info("Redis connected successfully");
      return this.client;
    } catch (error) {
      logger.warn("Redis not available, using in-memory fallback");
      this.useInMemory = true;
      return null;
    }
  }

  getClient() {
    return this.client;
  }

  isUsingMemory() {
    return this.useInMemory;
  }

  async storeOTP(identifier, otp, expirySeconds) {
    if (this.useInMemory || !this.client) {
      this.inMemoryStore.set(`otp:${identifier}`, otp);
      this.inMemoryTimestamps.set(`otp:${identifier}`, Date.now() + expirySeconds * 1000);
      return;
    }
    try {
      await this.client.setex(`otp:${identifier}`, expirySeconds, otp);
    } catch (e) {
      this.useInMemory = true;
      this.inMemoryStore.set(`otp:${identifier}`, otp);
      this.inMemoryTimestamps.set(`otp:${identifier}`, Date.now() + expirySeconds * 1000);
    }
  }

  async getOTP(identifier) {
    if (this.useInMemory || !this.client) {
      const otp = this.inMemoryStore.get(`otp:${identifier}`);
      const expiry = this.inMemoryTimestamps.get(`otp:${identifier}`);
      if (expiry && Date.now() > expiry) {
        this.inMemoryStore.delete(`otp:${identifier}`);
        this.inMemoryTimestamps.delete(`otp:${identifier}`);
        return null;
      }
      return otp || null;
    }
    try {
      return await this.client.get(`otp:${identifier}`);
    } catch (e) {
      return this.inMemoryStore.get(`otp:${identifier}`);
    }
  }

  async deleteOTP(identifier) {
    if (this.useInMemory || !this.client) {
      this.inMemoryStore.delete(`otp:${identifier}`);
      this.inMemoryTimestamps.delete(`otp:${identifier}`);
      return;
    }
    try {
      await this.client.del(`otp:${identifier}`);
    } catch (e) {
      this.inMemoryStore.delete(`otp:${identifier}`);
    }
  }

  async incrementAttempts(identifier) {
    if (this.useInMemory || !this.client) {
      const current = this.inMemoryStore.get(`otp_attempts:${identifier}`) || 0;
      const newVal = parseInt(current) + 1;
      this.inMemoryStore.set(`otp_attempts:${identifier}`, newVal.toString());
      return newVal;
    }
    try {
      return await this.client.incr(`otp_attempts:${identifier}`);
    } catch (e) {
      const current = this.inMemoryStore.get(`otp_attempts:${identifier}`) || 0;
      return parseInt(current) + 1;
    }
  }

  async getAttempts(identifier) {
    if (this.useInMemory || !this.client) {
      const attempts = this.inMemoryStore.get(`otp_attempts:${identifier}`);
      return parseInt(attempts || "0", 10);
    }
    try {
      const attempts = await this.client.get(`otp_attempts:${identifier}`);
      return parseInt(attempts || "0", 10);
    } catch (e) {
      return parseInt(this.inMemoryStore.get(`otp_attempts:${identifier}`) || "0", 10);
    }
  }

  async resetAttempts(identifier) {
    if (this.useInMemory || !this.client) {
      this.inMemoryStore.delete(`otp_attempts:${identifier}`);
      return;
    }
    try {
      await this.client.del(`otp_attempts:${identifier}`);
    } catch (e) {
      this.inMemoryStore.delete(`otp_attempts:${identifier}`);
    }
  }

  async setCooldown(identifier, cooldownSeconds) {
    if (this.useInMemory || !this.client) {
      this.inMemoryTimestamps.set(`otp_cooldown:${identifier}`, Date.now() + cooldownSeconds * 1000);
      return;
    }
    try {
      await this.client.setex(`otp_cooldown:${identifier}`, cooldownSeconds, "1");
    } catch (e) {
      this.inMemoryTimestamps.set(`otp_cooldown:${identifier}`, Date.now() + cooldownSeconds * 1000);
    }
  }

  async getCooldown(identifier) {
    if (this.useInMemory || !this.client) {
      const expiry = this.inMemoryTimestamps.get(`otp_cooldown:${identifier}`);
      if (expiry && Date.now() < expiry) {
        return Math.ceil((expiry - Date.now()) / 1000);
      }
      return 0;
    }
    try {
      const ttl = await this.client.ttl(`otp_cooldown:${identifier}`);
      return ttl > 0 ? ttl : 0;
    } catch (e) {
      const expiry = this.inMemoryTimestamps.get(`otp_cooldown:${identifier}`);
      if (expiry && Date.now() < expiry) {
        return Math.ceil((expiry - Date.now()) / 1000);
      }
      return 0;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = new RedisService();
