import { Hono } from "hono";
import { type QueueConfig, createMessageQueue } from "./lib/queue";
import "dotenv/config";

const app = new Hono();

const queueConfig: QueueConfig = { gapMilliseconds: 10_000 };
const enqueueMessage = createMessageQueue(queueConfig);

console.log("DASHBOARD_URL", process.env.DASHBOARD_URL);

// Health check endpoint
app.get("/", (c) => {
	return c.json({
		status: "OK",
		message: "Webhook Handler is running",
		timestamp: new Date().toISOString(),
	});
});

// WhatsApp webhook endpoint
app.post("/api/webhooks/whatsapp", async (c) => {
	const body = await c.req.json();
	const { event, payload } = body;
	const abortController = new AbortController();
	const companyId = c.req.header("X-Company-Id") ?? "";

	console.info("WhatsApp webhook received", companyId);

	if (event !== "message") {
		console.error("❌ Unsupported event: ", event);
		return c.json(
			{ status: "error", message: `Unsupported event: ${event}` },
			400,
		);
	}

	const { body: text, from, id: messageId } = payload;

	if (from === "status@broadcast" || !text || !companyId) {
		console.info("❌ Unsupported from or text: ", from, text);

		return c.json({ status: "OK" }, 200);
	}

	try {
		enqueueMessage(
			{
				from: `${from}-${companyId}`,
				text,
				abortController,
			},
			async (body) => {
				console.log("Processing queue for", from, ":", body);

				await fetch(`${process.env.DASHBOARD_URL}/api/webhooks/whatsapp`, {
					method: "POST",
					signal: abortController.signal,
					body: JSON.stringify({
						message: body,
						from,
						id: messageId,
						companyId,
					}),
				});
			},
		);

		return c.json({ status: "OK" }, 200);
	} catch (error) {
		console.error("Error processing queue for", from, ":", error);
		return c.json({ status: "error", message: "Internal server error" }, 500);
	}
});

// Error handling middleware
app.onError((err, c) => {
	console.error("Unhandled error:", err);
	return c.json(
		{
			status: "error",
			message: "Internal server error",
		},
		500,
	);
});

// 404 handler
app.notFound((c) => {
	return c.json(
		{
			status: "error",
			message: "Route not found",
		},
		404,
	);
});

const port = process.env.PORT || 3000;

console.log(`🚀 Webhook Handler server starting on port ${port}`);
console.log(
	`📱 WhatsApp webhook endpoint: http://localhost:${port}/api/webhooks/whatsapp`,
);

// Export for testing or other usage
export default {
	port,
	fetch: app.fetch,
};
