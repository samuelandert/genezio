<script lang="ts">
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import { AuthService } from '@genezio/auth';
	import { BackendService } from '@genezio-sdk/genezio-login-metamask';
	import { ethers } from 'ethers';

	AuthService.getInstance().setTokenAndRegion('0-xqr4pc3avfpzqjkmesysoegaea0jzwhz', 'eu-central-1');

	let data = writable({ address: null, balance: null });
	let securedInfo = writable('');

	onMount(async () => {
		if (browser) {
			const user = await AuthService.getInstance().userInfo();
			if (user.address) {
				getBalance(user.address);
			} else {
				console.error('Not authenticated. Redirecting to login screen...');
				data.set({ address: null, balance: null });
			}
		}
	});

	async function getBalance(address: string) {
		const balance = await window.ethereum.request({
			method: 'eth_getBalance',
			params: [address, 'latest']
		});
		const formattedBalance = ethers.formatEther(balance);
		data.set({ address, balance: formattedBalance });
	}

	async function loginWithMetamask() {
		if (window.ethereum) {
			const addresses = await window.ethereum.request({ method: 'eth_requestAccounts' });
			const address = addresses[0];
			const nonce = await AuthService.getInstance().web3GetNonce(address);
			const signature = await window.ethereum.request({
				method: 'personal_sign',
				params: [nonce, address]
			});
			await AuthService.getInstance().web3Login(address, signature);
			await getBalance(address);
			await getSecuredInfo();
		} else {
			alert('Please install MetaMask to use this feature.');
		}
	}

	function logout() {
		AuthService.getInstance().logout();
		data.set({ address: null, balance: null });
	}

	async function getSecuredInfo() {
		try {
			const greetingMessage = await BackendService.hello('Friend');
			securedInfo.set(greetingMessage);
		} catch {
			logout();
		}
	}

	$: if ($data.address) {
		getSecuredInfo();
	}
</script>

<main class="p-4">
	<h1 class="text-xl font-bold">Wallet Information</h1>
	<div>
		{#if $data.address}
			<p class="text-gray-700">Address: {$data.address}</p>
			<p class="text-gray-700">Balance: {$data.balance}</p>
		{:else}
			<p class="text-red-500">User not authenticated.</p>
		{/if}
	</div>
	<div>
		<button
			class="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
			on:click={loginWithMetamask}
		>
			Login with MetaMask
		</button>
		<button
			class="px-4 py-2 ml-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
			on:click={logout}
		>
			Logout
		</button>
	</div>
	{#if $data.address}
		<div>
			<h2 class="mt-4 text-lg font-bold">Secured Info</h2>
			<p class="text-gray-700">{$securedInfo}</p>
		</div>
	{/if}
</main>
