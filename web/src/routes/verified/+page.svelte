<script lang="ts">
  import Head from '$lib/Head.svelte';
</script>

<Head title={'Verified'} />

<div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 overflow-hidden">
  <div class="text-center mb-10">
    <h1 class="rotating-title">Identity Verified!</h1>
  </div>

  <div class="text-center">
    <!-- Using a simple animated SVG as skeleton replacement -->
    <svg width="300" height="300" viewBox="0 0 100 100" class="verification-animation">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" stroke-width="3">
        <animate attributeName="stroke-dasharray" from="0 251" to="251 0" dur="1.5s" fill="freeze" />
      </circle>
      <path d="M35 50 L45 60 L65 40" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <animate attributeName="stroke-dasharray" from="0 100" to="100 0" dur="0.5s" begin="1.5s" fill="freeze" />
      </path>
    </svg>
  </div>
</div>

<style>
  .rotating-title {
    font-size: 4rem;
    font-weight: bold;
    background: linear-gradient(45deg, #1e40af, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: rotate3D 3s infinite linear;
    transform-style: preserve-3d;
    perspective: 800px;
    padding: 1.5rem;
    position: relative;
    display: inline-block;
  }

  @keyframes rotate3D {
    0% {
      transform: rotateY(0deg) rotateX(0deg);
    }

    25% {
      transform: rotateY(30deg) rotateX(15deg);
    }

    50% {
      transform: rotateY(0deg) rotateX(0deg);
    }

    75% {
      transform: rotateY(-30deg) rotateX(-15deg);
    }

    100% {
      transform: rotateY(0deg) rotateX(0deg);
    }
  }

  .verification-animation {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
