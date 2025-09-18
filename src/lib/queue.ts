/**
 * @file multiUserMessageQueue.ts
 * @description An improved functional implementation of a multi-user message queueing system with debounce functionality,
 * ensuring separate conversation handling for each user.
 */

interface Message {
	text: string;
	timestamp: number;
}

interface QueueConfig {
	gapMilliseconds: number;
}

interface UserQueue {
	messages: Message[];
	timer: NodeJS.Timeout | null;
	callback: ((body: string, from: string) => Promise<void>) | null;
	isProcessing: boolean;
}

interface QueueState {
	queues: Map<string, UserQueue>;
}

function createInitialState(): QueueState {
	return {
		queues: new Map(),
	};
}

function resetTimer(userQueue: UserQueue): UserQueue {
	if (userQueue.timer) {
		clearTimeout(userQueue.timer);
	}
	return { ...userQueue, timer: null };
}

function processQueue(messages: Message[]): string {
	const result = messages.map((message) => message.text).join(" ");
	console.log("Accumulated messages:", result);
	return result;
}

function createMessageQueue(config: QueueConfig) {
	const state: QueueState = createInitialState();

	return async function enqueueMessage(
		{
			from,
			text,
			abortController,
		}: {
			from: string;
			text: string;
			abortController: AbortController;
		},
		callback: (body: string, from: string) => Promise<void>,
	): Promise<void> {
		const messageBody = text;

		if (!from || !messageBody) {
			console.error("Invalid message context:", from);
			return;
		}

		console.log("Enqueueing:", messageBody, "from:", from);

		// Get or create user queue
		let userQueue = state.queues.get(from);
		if (!userQueue) {
			userQueue = {
				messages: [],
				timer: null,
				callback: null,
				isProcessing: false,
			};
			state.queues.set(from, userQueue);
		}

		// If already processing, just add message to queue
		if (userQueue.isProcessing) {
			userQueue.messages.push({ text: messageBody, timestamp: Date.now() });
			console.log(`Added to processing queue for ${from}:`, userQueue.messages);
			return;
		}

		// Reset timer and add message
		userQueue = resetTimer(userQueue);
		userQueue.messages.push({ text: messageBody, timestamp: Date.now() });
		userQueue.callback = callback;

		console.log(`Messages for ${from}:`, userQueue.messages);

		// Set processing flag and start timer
		userQueue.isProcessing = false; // Will be set to true when timer fires
		userQueue.timer = setTimeout(async () => {
			const currentQueue = state.queues.get(from);
			if (currentQueue?.callback) {
				currentQueue.isProcessing = true;

				try {
					if (abortController.signal.aborted) {
						console.log("Abort signal received, skipping processing");
						return;
					}

					const result = processQueue(currentQueue.messages);

					// Process the callback
					await currentQueue.callback(result, from);

					// Clear the processed messages
					currentQueue.messages = [];
				} catch (error) {
					console.error(`Error processing queue for ${from}: ${error}`);
				} finally {
					// Reset processing state
					currentQueue.isProcessing = false;
					currentQueue.timer = null;

					// If there are new messages that arrived while processing, restart the timer
					if (currentQueue.messages.length > 0) {
						console.log(
							`New messages arrived during processing, restarting timer for ${from}`,
						);
						currentQueue.timer = setTimeout(async () => {
							// Process remaining messages that arrived during processing
							const remainingQueue = state.queues.get(from);
							if (
								remainingQueue?.callback &&
								remainingQueue.messages.length > 0
							) {
								try {
									remainingQueue.isProcessing = true;
									if (abortController.signal.aborted) {
										console.log("Abort signal received, skipping processing");
										return;
									}

									const result = processQueue(remainingQueue.messages);
									console.log(
										`Processing remaining queue for ${from}:`,
										result,
									);
									await remainingQueue.callback(result, from);
									remainingQueue.messages = [];
								} catch (error) {
									console.error(
										`Error processing remaining queue for ${from}:`,
										error,
									);
								} finally {
									remainingQueue.isProcessing = false;
									remainingQueue.timer = null;
								}
							}
						}, config.gapMilliseconds);
					}
				}
			}
		}, config.gapMilliseconds);

		// Update the queue state
		state.queues.set(from, userQueue);
	};
}

export { createMessageQueue, type QueueConfig };
