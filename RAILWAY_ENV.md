# Railway Environment Variables Configuration

## Required Environment Variables

When deploying to Railway, set these environment variables in your Railway dashboard:

### DASHBOARD_URL

- **Type**: String (URL)
- **Description**: The URL where processed WhatsApp messages will be forwarded
- **Example**: `https://your-dashboard-app.railway.app`
- **Required**: Yes

### PORT

- **Type**: Number
- **Description**: Port for the application (automatically set by Railway)
- **Default**: `3000`
- **Required**: No (Railway sets this automatically)

### NODE_ENV

- **Type**: String
- **Description**: Node.js environment
- **Default**: `production`
- **Required**: No

## Setting Environment Variables in Railway

1. Go to your Railway project dashboard
2. Select your WhatsApp Handler service
3. Go to the "Variables" tab
4. Add the required environment variables listed above

## Scaling Considerations

The current configuration allocates:

- CPU: 0.5 vCPU
- Memory: 512MB

You can adjust these values based on your expected load:

- For higher message volumes: Increase CPU to 1.0 or 2.0
- For memory-intensive processing: Increase memory to 1GB or 2GB
