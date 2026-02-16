# Self Protocol Boilerplate Example

Learn to build privacy-preserving identity verification with [Self Protocol](https://self.xyz/) - from frontend QR codes to backend API verification.

> 📺 **New to Self?** Watch the [ETHGlobal Workshop](https://www.loom.com/share/8a6d116a5f66415998a496f06fefdc23) first.

## Architecture

This project uses a split architecture:
- **`web/`** - Svelte frontend for QR code generation and user interface
- **`backend/`** - Hono (Cloudflare Workers) backend for verification API
- **`app/`** - Legacy Next.js implementation (for reference)

## Prerequisites

- Node.js 20+
- [Self Mobile App](https://self.xyz)
- [ngrok](https://ngrok.com/) or [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/do-more-with-tunnels/remote-tunnel/) (for local development)

---

## Integration Steps

### Step 1: Repository Setup

```bash
# Clone the workshop repository
git clone <repository-url>
cd workshop

# Install dependencies
pnpm install
```

### Step 2: Setup Tunnel

For local development, you need a publicly accessible endpoint. Start a tunnel in a separate terminal:

```bash
# Option 1: ngrok
ngrok http 34005

# Option 2: cloudflared
cloudflared tunnel --url http://localhost:34005
```

Keep the tunnel running and note the URL (e.g., `https://abc123.ngrok-free.app`).

> **💡 Tip**: The tunnel creates a public URL so the Self app can reach your local backend API.

### Step 3: Frontend Configuration

The frontend uses Svelte and requires environment variables:

```bash
# Edit web/.env with your tunnel URL
PUBLIC_SELF_ENDPOINT=https://your-tunnel-url.ngrok-free.app/api/verify
PUBLIC_SELF_APP_NAME=Self Workshop
PUBLIC_SELF_SCOPE_SEED=self-workshop
```

> **⚠️ Important**: The endpoint must be publicly accessible. Update it each time you restart the tunnel.

### Step 4: Start Development

```bash
# Run both backend and frontend
pnpm dev

# Or run separately:
pnpm backend:dev  # Start Hono backend (port 34005)
pnpm web:dev     # Start Svelte frontend (port 5173)
```

Visit `http://localhost:5173` to see your verification application!

**Test the flow:**
1. Open the app at `http://localhost:5173`
2. Scan the QR code with the Self mobile app
3. Complete verification on your phone
4. The backend API will verify the proof and return results
5. You'll be redirected to the success page

---

## 🛠️ Detailed Configuration

### Frontend SDK Configuration

The Self SDK is configured in Svelte components (`web/src/routes/+page.svelte`):

```typescript
import { SelfAppBuilder, getUniversalLink, countries } from '@selfxyz/sdk-common';

const app = new SelfAppBuilder({
    version: 2,                    // Always use V2
    appName: import.meta.env.PUBLIC_SELF_APP_NAME,
    scope: import.meta.env.PUBLIC_SELF_SCOPE_SEED,
    endpoint: import.meta.env.PUBLIC_SELF_ENDPOINT,  // Your public URL + /api/verify
    logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
    userId: userId,                // User's identifier (Ethereum address)
    endpointType: "staging_https", // "staging_https" for testnet, "https" for mainnet
    userIdType: "hex",             // "hex" for Ethereum addresses
    userDefinedData: "Hello from Svelte!",
    
    disclosures: {
        // Verification requirements (must match your backend config)
        minimumAge: 18,
        excludedCountries: [countries.UNITED_STATES],
        // ofac: true,              // Optional: OFAC compliance checking
        
        // Optional disclosures (uncomment to request):
        // name: true,
        // issuing_state: true,
        // nationality: true,
        // date_of_birth: true,
        // passport_number: true,
        // gender: true,
        // expiry_date: true,
    }
}).build();
```

### Backend API Configuration

Your backend verification endpoint is at `backend/src/index.ts`:

```typescript
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

// Get environment variables
const scopeSeed = c.env.SELF_SCOPE_SEED || "self-workshop";
const endpoint = c.env.SELF_ENDPOINT;

// Create verifier instance
const selfBackendVerifier = new SelfBackendVerifier(
  scopeSeed,
  endpoint,
  true, // mockPassport: true = staging/testnet, false = mainnet
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: ["USA"],
    ofac: false,
  }),
  "hex" // userIdentifierType must match frontend userIdType
);

// Verify the proof
const result = await selfBackendVerifier.verify(
  attestationId,
  proof,
  publicSignals,
  userContextData
);
```

**Important**: Frontend `disclosures` must match backend `DefaultConfigStore` configuration.

### Environment Variables

#### Backend (`backend/.dev.vars` for local, `backend/wrangler.toml` for production)
```
SELF_SCOPE_SEED=self-workshop
SELF_ENDPOINT=https://your-domain.com/api/verify
```

#### Frontend (`web/.env`)
```
PUBLIC_SELF_APP_NAME=Self Workshop
PUBLIC_SELF_SCOPE_SEED=self-workshop
PUBLIC_SELF_ENDPOINT=https://your-tunnel-url.ngrok.io/api/verify
```

### Verification Modes

#### Staging/Testnet (`mockPassport: true`)
- **Use for**: Development and testing
- **Supports**: Mock passports from Self app
- **Hub Address**: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
- **Network**: Celo Sepolia testnet
- **RPC**: `https://forno.celo-sepolia.celo-testnet.org`

#### Production/Mainnet (`mockPassport: false`)
- **Use for**: Production deployments
- **Supports**: Real passport verification only
- **Hub Address**: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`
- **Network**: Celo Mainnet
- **RPC**: `https://forno.celo.org`

> **Note**: The backend verifier connects to Celo blockchain to verify merkle roots and registry contracts, but verification logic runs on your server.

---

### Getting Help

- 📱 **Telegram Community**: [Self Protocol Builders Group](https://t.me/selfprotocolbuilder)
- 📖 **Documentation**: [docs.self.xyz](https://docs.self.xyz)
- 🎥 **Workshop Video**: [ETHGlobal Cannes](https://www.loom.com/share/8a6d116a5f66415998a496f06fefdc23)

---

## 📁 Project Structure

```
self-integration-boilerplate/
├── web/                                 # Svelte frontend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte            # Main verification page
│   │   │   └── verified/
│   │   │       └── +page.svelte        # Success page
│   │   └── lib/
│   │       └── self/                   # Self SDK integration
│   │           ├── SelfQRCode.svelte    # QR code component
│   │           └── verification.ts      # WebSocket utilities
│   ├── .env                            # Environment variables
│   └── package.json
│
├── backend/                             # Hono backend (Cloudflare Workers)
│   ├── src/
│   │   ├── index.ts                    # API routes including /api/verify
│   │   ├── worker.ts                   # Worker entry point
│   │   └── env.ts                      # Environment types
│   ├── .dev.vars                       # Local development variables
│   ├── wrangler.toml                   # Cloudflare config
│   └── package.json
│
└── app/                                # Legacy Next.js (reference only)
    └── ...
```

---

## 🔗 Additional Resources

### Documentation
- [Self Protocol Docs](https://docs.self.xyz/) - Complete protocol documentation
- [Backend Integration Guide](https://docs.self.xyz/backend-integration/basic-integration) - Backend verification specifics
- [SelfBackendVerifier API](https://docs.self.xyz/backend-integration/selfbackendverifier-api-reference) - Backend API reference
- [Frontend SDK Reference](https://docs.self.xyz/use-self/quickstart) - Frontend integration details
- [Disclosure Proofs](https://docs.self.xyz/use-self/disclosures) - Available verification options

### Self App
- [Self on iOS](https://apps.apple.com/us/app/self-zk-passport-identity/id6478563710) - iOS App
- [Self on Android](https://play.google.com/store/apps/details?id=com.proofofpassportapp) - Android App
