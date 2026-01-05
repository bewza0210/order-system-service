import * as amqplib from "amqplib";
// import { AppDataSource } from "../plugins/database";
import { DeepPartial } from "typeorm";

let connection: any = null;
let channel: amqplib.Channel | null = null;
let connecting = false;

const prefetch = 1;
const url: string = process.env.RABBITMQ_URL || "";

export async function initRabbitMQ() {
  if (channel && connection) return { connection, channel };
  if (connecting) {
    await new Promise((r) => setTimeout(r, 250));
    if (channel && connection) return { connection, channel };
  }

  if (!url) {
    throw new Error("RABBITMQ_URL is not set");
  }

  connecting = true;
  try {
    // connect
    const conn = await amqplib.connect(url);
    const ch = await conn.createChannel();
    connection = conn;
    channel = ch;

    await ch.prefetch(prefetch);

    // register handlers safely
    conn.on("close", async () => {
      console.error("[RabbitMQ] Connection closed. Reconnecting...");
      await reconnect(url, prefetch);
    });
    conn.on("error", (err: Error) => {
      console.error("[RabbitMQ] Connection error:", err?.message ?? err);
    });

    console.log(`[RabbitMQ] Connected. Prefetch=${prefetch}`);
    return { connection: conn, channel: ch };
  } catch (err: any) {
    console.log("[RabbitMQ] connect error:", err?.message ?? err);
    throw err;
  } finally {
    connecting = false;
  }
}

async function reconnect(url: string, prefetch: number) {
  connection = null;
  channel = null;

  // backoff: 1s, 2s, 4s, max 10s
  let delay = 1000;
  const maxDelay = 10000;

  while (!connection || !channel) {
    try {
      await initRabbitMQ();
      console.log("[RabbitMQ] Reconnected.");
      return;
    } catch (err) {
      console.error("[RabbitMQ] Reconnect failed:", err);
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 2, maxDelay);
    }
  }
}

export function getChannel(): amqplib.Channel {
  if (!channel) throw new Error("RabbitMQ channel is not initialized. Call initRabbitMQ() first.");
  return channel;
}

export async function assertQueue(queue: string, options?: amqplib.Options.AssertQueue) {
  const ch = getChannel();
  return ch.assertQueue(queue, { durable: true, ...(options || {}) });
}

export async function assertExchange(
  name: string,
  type: "direct" | "topic" | "fanout" | "headers" = "direct",
  options?: amqplib.Options.AssertExchange
) {
  const ch = getChannel();
  return ch.assertExchange(name, type, { durable: true, ...(options || {}) });
}

export async function publishToQueue(queue: string, payload: any, options?: amqplib.Options.Publish) {
  const ch = getChannel();
  await assertQueue(queue);
  const ok = ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json",
    ...(options || {}),
  });
  if (!ok) {
    await new Promise((r) => ch.once("drain", r));
  }
}

export async function publishToExchange(
  exchange: string,
  routingKey: string,
  payload: any,
  options?: amqplib.Options.Publish,
  type: "direct" | "topic" | "fanout" | "headers" = "direct"
) {
  const ch = getChannel();
  await assertExchange(exchange, type);
  const ok = ch.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: "application/json",
    ...(options || {}),
  });
  if (!ok) {
    await new Promise((r) => ch.once("drain", r));
  }
}

// export async function consume(queue: string, onMessage: OnMessage, options?: amqplib.Options.Consume) {
//   const ch = getChannel();
//   await assertQueue(queue);

//   const repoMqTracking = AppDataSource.getRepository(MqTracking);

//   return ch.consume(
//     queue,
//     async (msg: amqplib.ConsumeMessage | null) => {
//       if (!msg) return;
//       try {
//         const result = await onMessage(msg, ch);
//         if (result && (result as any).status === "error") {
//           await repoMqTracking.save(result);
//         }
//         ch.ack(msg);
//       } catch (err: any) {
//         const s = String(err?.message || err);
//         const isParseError = err instanceof SyntaxError || s.includes("JSON");
//         if (isParseError) {
//           console.error(`[RabbitMQ] Drop bad message on "${queue}":`, s);
//           ch.nack(msg, false, false);
//         } else {
//           console.error(`[RabbitMQ] Retry message on "${queue}":`, s);
//           ch.nack(msg, false, true);
//         }
//       }
//     },
//     { noAck: false, ...(options || {}) }
//   );
// }

export async function bindQueue(queue: string, exchange: string, routingKey = "") {
  const ch = getChannel();
  await assertQueue(queue);
  await assertExchange(exchange, "direct");
  await ch.bindQueue(queue, exchange, routingKey);
}

export async function shutdownRabbitMQ() {
  try {
    if (channel) {
      await channel.close();
      channel = null;
    }
    if (connection) {
      await connection.close();
      connection = null;
    }
    console.log("[RabbitMQ] Closed.");
  } catch (e) {
    console.error("[RabbitMQ] Close error:", e);
  }
}
