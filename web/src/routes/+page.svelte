<script lang="ts">
	import {onMount} from 'svelte';
	import {goto} from '$app/navigation';
	import {ethers} from 'ethers';
	import {
		SelfAppBuilder,
		getUniversalLink,
		countries,
		type SelfApp,
	} from '@selfxyz/sdk-common';
	import Head from '$lib/Head.svelte';
	import SelfQRCode from '$lib/self/SelfQRCode.svelte';

	let linkCopied = $state(false);
	let showToast = $state(false);
	let toastMessage = $state('');
	let selfApp = $state<SelfApp | null>(null);
	let universalLink = $state('');
	let userId = $state(ethers.ZeroAddress);

	// Excluded countries (USA)
	const excludedCountries = [countries.UNITED_STATES];

	function displayToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 3000);
	}

	async function copyToClipboard() {
		if (!universalLink) return;

		try {
			await navigator.clipboard.writeText(universalLink);
			linkCopied = true;
			displayToast('Universal link copied to clipboard!');
			setTimeout(() => {
				linkCopied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy text: ', err);
			displayToast('Failed to copy link');
		}
	}

	function openSelfApp() {
		if (!universalLink) return;
		window.open(universalLink, '_blank');
		displayToast('Opening Self App...');
	}

	function handleSuccessfulVerification() {
		displayToast('Verification successful! Redirecting...');
		setTimeout(() => {
			goto('/verified');
		}, 1500);
	}

	function handleError(error: string) {
		displayToast(`Error: ${error}`);
	}

	onMount(() => {
		try {
			const appName = import.meta.env.PUBLIC_SELF_APP_NAME || 'Self Workshop';
			const scopeSeed =
				import.meta.env.PUBLIC_SELF_SCOPE_SEED || 'self-workshop';
			const endpoint =
				import.meta.env.PUBLIC_SELF_ENDPOINT ||
				'https://applicants-monitors-purposes-everybody.trycloudflare.com/api/verify' ||
				'http://localhost:34005/api/verify';

			const app = new SelfAppBuilder({
				version: 2,
				appName,
				scope: scopeSeed,
				endpoint,
				logoBase64: 'https://i.postimg.cc/mrmVf9hm/self.png',
				userId: userId,
				endpointType: 'staging_https',
				userIdType: 'hex',
				userDefinedData: 'Hello from Svelte!',
				disclosures: {
					minimumAge: 18,
					excludedCountries: excludedCountries,
				},
			}).build();

			selfApp = app;
			universalLink = getUniversalLink(app);
		} catch (error) {
			console.error('Failed to initialize Self app:', error);
			displayToast('Failed to initialize Self app');
		}
	});
</script>

<Head home={true} title={'Self Verification'} />

<div
	class="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 p-4 sm:p-6 md:p-8"
>
	<!-- Header -->
	<div class="mb-6 text-center md:mb-8">
		<h1 class="mb-2 text-2xl font-bold text-gray-800 sm:text-3xl">
			{import.meta.env.PUBLIC_SELF_APP_NAME || 'Self Workshop'}
		</h1>
		<p class="px-2 text-sm text-gray-600 sm:text-base">
			Scan QR code with Self Protocol App to verify your identity
		</p>
	</div>

	<!-- Main content -->
	<div
		class="mx-auto w-full max-w-xs rounded-xl bg-white p-4 shadow-lg sm:max-w-sm sm:p-6 md:max-w-md"
	>
		<div class="mb-4 flex justify-center sm:mb-6">
			{#if selfApp}
				<SelfQRCode
					{selfApp}
					onSuccess={handleSuccessfulVerification}
					onError={handleError}
				/>
			{:else}
				<div
					class="flex h-[256px] w-[256px] animate-pulse items-center justify-center rounded-lg bg-gray-200"
				>
					<p class="text-sm text-gray-500">Loading QR Code...</p>
				</div>
			{/if}
		</div>

		<div class="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:space-x-2">
			<button
				type="button"
				onclick={copyToClipboard}
				disabled={!universalLink}
				class="flex-1 rounded-md bg-gray-800 p-2 text-sm text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:text-base"
			>
				{linkCopied ? 'Copied!' : 'Copy Universal Link'}
			</button>

			<button
				type="button"
				onclick={openSelfApp}
				disabled={!universalLink}
				class="mt-2 flex-1 rounded-md bg-blue-600 p-2 text-sm text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300 sm:mt-0 sm:text-base"
			>
				Open Self App
			</button>
		</div>

		<div class="mt-2 flex flex-col items-center gap-2">
			<span class="text-xs tracking-wide text-gray-500 uppercase"
				>User Address</span
			>
			<div
				class="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-center font-mono text-sm break-all text-gray-800"
			>
				{userId || 'Not connected'}
			</div>
		</div>

		<!-- Toast notification -->
		{#if showToast}
			<div
				class="animate-fade-in fixed right-4 bottom-4 rounded bg-gray-800 px-4 py-2 text-sm text-white shadow-lg"
			>
				{toastMessage}
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	:global(.animate-fade-in) {
		animation: fade-in 0.3s ease-out;
	}
</style>
