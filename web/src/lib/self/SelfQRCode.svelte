<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import QRCode from 'qrcode';
  import type { SelfApp } from '@selfxyz/sdk-common';
  import { initWebSocket, getStatusText, QRcodeSteps, type QRCodeStep } from './verification';

  export let selfApp: SelfApp;
  export let onSuccess: () => void;
  export let onError: (error: string) => void = () => {};

  let qrCodeDataUrl = '';
  let proofStep: QRCodeStep = QRcodeSteps.WAITING_FOR_MOBILE;
  let cleanupWebSocket: (() => void) | null = null;

  // Generate QR code on mount
  onMount(async () => {
    try {
      const universalLink = `${selfApp.endpoint.replace(/^https?:\/\//, '')}?selfApp=${encodeURIComponent(JSON.stringify(selfApp))}`;
      qrCodeDataUrl = await QRCode.toDataURL(universalLink, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Initialize WebSocket for real-time updates
      cleanupWebSocket = initWebSocket(
        selfApp,
        (step) => {
          proofStep = step;
          if (step === QRcodeSteps.PROOF_VERIFIED) {
            onSuccess();
          } else if (step === QRcodeSteps.PROOF_GENERATION_FAILED) {
            onError('Proof generation failed');
          }
        },
        {
          onSuccess,
          onError: (data) => {
            onError(data.reason || 'Verification failed');
          },
        }
      );
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      onError('Failed to generate QR code');
    }
  });

  onDestroy(() => {
    if (cleanupWebSocket) {
      cleanupWebSocket();
    }
  });

  $: statusText = getStatusText(proofStep);
  $: isLoading = proofStep === QRcodeSteps.MOBILE_CONNECTED || 
                 proofStep === QRcodeSteps.PROOF_GENERATION_STARTED || 
                 proofStep === QRcodeSteps.PROOF_GENERATED;
  $: isVerified = proofStep === QRcodeSteps.PROOF_VERIFIED;
  $: isFailed = proofStep === QRcodeSteps.PROOF_GENERATION_FAILED;
</script>

<div class="self-qrcode-container">
  {#if qrCodeDataUrl}
    <div class="qr-code-wrapper">
      <img src={qrCodeDataUrl} alt="Self QR Code" class="qr-code" />
      
      {#if isLoading}
        <div class="overlay loading">
          <div class="spinner"></div>
          <span>{statusText}</span>
        </div>
      {:else if isVerified}
        <div class="overlay success">
          <span>✓</span>
          <span>{statusText}</span>
        </div>
      {:else if isFailed}
        <div class="overlay error">
          <span>✗</span>
          <span>{statusText}</span>
        </div>
      {/if}
    </div>
  {:else}
    <div class="qr-code-placeholder">
      <div class="pulse"></div>
      <span>Loading QR Code...</span>
    </div>
  {/if}
  
  <p class="status-text">{statusText}</p>
</div>

<style>
  .self-qrcode-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .qr-code-wrapper {
    position: relative;
    width: 256px;
    height: 256px;
  }

  .qr-code {
    width: 100%;
    height: 100%;
    border-radius: 8px;
  }

  .qr-code-placeholder {
    width: 256px;
    height: 256px;
    background: #f3f4f6;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: #6b7280;
  }

  .pulse {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #e5e7eb;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.95); }
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: 8px;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.9);
  }

  .overlay.loading {
    color: #3b82f6;
  }

  .overlay.success {
    color: #10b981;
    font-size: 2rem;
  }

  .overlay.error {
    color: #ef4444;
    font-size: 2rem;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .status-text {
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
  }
</style>
