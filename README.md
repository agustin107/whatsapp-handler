# WhatsApp Webhook Handler

A scalable WhatsApp webhook handler built with Hono that processes incoming messages with queueing functionality.

## Local Development

To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Railway Deployment

### Automatic Deployment (Recommended)

1. **Connect to Railway**: Connect your GitHub repository to Railway
2. **Railway will automatically detect** the `railway.toml` configuration
3. **Set Environment Variables** in Railway dashboard:
   - `DASHBOARD_URL`: URL where messages will be forwarded
   - `NODE_ENV`: Set to `production`
4. **Deploy**: Railway will build and deploy automatically

### Manual Docker Deployment

If you prefer more control, Railway also supports Docker:

1. **Connect Repository** to Railway
2. **Railway will use** the provided `Dockerfile`
3. **Configure Environment Variables** as above
4. **Deploy**

### Configuration Files

- `railway.toml`: Railway configuration for automatic deployment
- `Dockerfile`: Docker configuration for manual deployment
- `RAILWAY_ENV.md`: Environment variables documentation

### Scaling

The default configuration provides:

- **CPU**: 0.5 vCPU (scalable to 1.0-2.0 for high load)
- **Memory**: 512MB (scalable to 1GB-2GB for high load)
- **Health Checks**: Automatic monitoring via `/` endpoint

### Features

- **Message Queueing**: Groups messages per user with 10-second intervals
- **Webhook Processing**: Handles WhatsApp webhook events
- **Error Handling**: Comprehensive error handling and logging
- **Health Monitoring**: Built-in health check endpoint
- **Scalable Architecture**: Designed for high-throughput message processing
