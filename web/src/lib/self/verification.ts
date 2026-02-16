import { io, type Socket } from 'socket.io-client';
import type { SelfApp } from '@selfxyz/sdk-common';

// QR Code verification steps
export const QRcodeSteps = {
  DISCONNECTED: 0,
  WAITING_FOR_MOBILE: 1,
  MOBILE_CONNECTED: 2,
  PROOF_GENERATION_STARTED: 3,
  PROOF_GENERATION_FAILED: 4,
  PROOF_GENERATED: 5,
  PROOF_VERIFIED: 6,
};

export type QRCodeStep = (typeof QRcodeSteps)[keyof typeof QRcodeSteps];

export const getStatusText = (proofStep: number): string => {
  switch (proofStep) {
    case QRcodeSteps.DISCONNECTED:
    case QRcodeSteps.WAITING_FOR_MOBILE:
      return 'Prove your Self';
    case QRcodeSteps.MOBILE_CONNECTED:
    case QRcodeSteps.PROOF_GENERATION_STARTED:
      return 'Connected to Self';
    case QRcodeSteps.PROOF_GENERATED:
      return 'Proof Generated';
    case QRcodeSteps.PROOF_VERIFIED:
      return 'Proof Successful';
    case QRcodeSteps.PROOF_GENERATION_FAILED:
      return 'Proof Failed';
    default:
      return 'An error occurred';
  }
};

// WebSocket relayer URL
const WS_DB_RELAYER = 'wss://websocket.self.xyz';

export type VerificationCallbacks = {
  onSuccess: () => void;
  onError: (data: { error_code?: string; reason?: string }) => void;
};

export function initWebSocket(
  selfApp: SelfApp,
  setProofStep: (step: QRCodeStep) => void,
  callbacks: VerificationCallbacks
): () => void {
  const sessionId = selfApp.sessionId;
  const fullUrl = `${WS_DB_RELAYER}/websocket`;

  console.log(`[WebSocket] Initializing WebSocket connection for sessionId: ${sessionId}`);

  const socket: Socket = io(fullUrl, {
    path: '/',
    query: { sessionId, clientType: 'web' },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log(
      `[WebSocket] Connected with id: ${socket.id}, transport: ${socket.io.engine.transport.name}`
    );
  });

  socket.on('connect_error', (error) => {
    console.error('[WebSocket] Connection error:', error);
  });

  socket.on('mobile_status', (data: { status: string; error_code?: string; reason?: string }) => {
    console.log('[WebSocket] Received mobile status:', data.status, 'for session:', sessionId);
    
    switch (data.status) {
      case 'mobile_connected':
        console.log('[WebSocket] Mobile device connected.');
        setProofStep(QRcodeSteps.MOBILE_CONNECTED);
        socket.emit('self_app', { ...selfApp, sessionId });
        break;
      case 'mobile_disconnected':
        console.log('[WebSocket] Mobile device disconnected.');
        setProofStep(QRcodeSteps.WAITING_FOR_MOBILE);
        break;
      case 'proof_generation_started':
        console.log('[WebSocket] Proof generation started.');
        setProofStep(QRcodeSteps.PROOF_GENERATION_STARTED);
        break;
      case 'proof_generated':
        console.log('[WebSocket] Proof generated.');
        setProofStep(QRcodeSteps.PROOF_GENERATED);
        break;
      case 'proof_generation_failed':
        console.log('[WebSocket] Proof generation failed.');
        setProofStep(QRcodeSteps.PROOF_GENERATION_FAILED);
        callbacks.onError(data);
        break;
      case 'proof_verified':
        console.log('[WebSocket] Proof verified.');
        setProofStep(QRcodeSteps.PROOF_VERIFIED);
        callbacks.onSuccess();
        break;
      default:
        console.log('[WebSocket] Unhandled mobile status:', data.status);
        break;
    }
  });

  socket.on('disconnect', (reason: string) => {
    console.log(`[WebSocket] Disconnected. Reason: ${reason}`);
  });

  // Return cleanup function
  return () => {
    console.log(`[WebSocket] Cleaning up connection for sessionId: ${sessionId}`);
    if (socket) {
      socket.disconnect();
    }
  };
}
