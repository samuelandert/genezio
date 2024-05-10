<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	import { AuthService } from '@genezio/auth';
	import { UserService } from '@genezio-sdk/genezio-login-metamask';
	import { pollingManager } from '../lib/polling';

	// Set token and region for AuthService
	AuthService.getInstance().setTokenAndRegion('0-xqr4pc3avfpzqjkmesysoegaea0jzwhz', 'eu-central-1');

	let currentUser = writable({ address: null, name: null });
	let users = writable([]);

	onMount(() => {
		// Polling to fetch and update the current user's info
		pollingManager.startPolling('currentUser', async () => {
			const userInfo = await AuthService.getInstance().userInfo();
			currentUser.set(userInfo);
		});

		// Polling to fetch and update the list of all users
		pollingManager.startPolling('allUsers', async () => {
			const response = await UserService.getUsers();
			if (response.success) {
				users.set(response.users);
			}
		});
	});

	onDestroy(() => {
		pollingManager.stopAllPolling();
	});

	async function loginWithMetamask() {
		if (window.ethereum) {
			const addresses = await window.ethereum.request({ method: 'eth_requestAccounts' });
			const address = addresses[0];
			const nonce = await AuthService.getInstance().web3GetNonce(address);
			const signature = await window.ethereum.request({
				method: 'personal_sign',
				params: [nonce, address]
			});
			const user = await AuthService.getInstance().web3Login(address, signature);
			currentUser.set(user);
		} else {
			alert('Please install MetaMask to use this feature.');
		}
	}

	function logout() {
		AuthService.getInstance().logout();
		currentUser.set({ address: null, name: null });
	}

	async function updateUserName() {
		const newName = prompt('Enter your new name:');
		if (newName) {
			const response = await UserService.updateUser(newName);
			if (response.success) {
				currentUser.update((current) => ({ ...current, name: newName }));
			} else {
				alert(`Failed to update name: ${response.err}`);
			}
		}
	}
</script>

<main class="p-4">
	{#if $currentUser.address}
		<div>
			<button
				class="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
				on:click={logout}
			>
				Logout
			</button>
			<button
				class="px-4 py-2 ml-2 font-bold text-white bg-green-500 rounded hover:bg-green-700"
				on:click={updateUserName}
			>
				Update My Name
			</button>
			<div>
				<h2 class="text-lg font-bold">Current User</h2>
				<p>Name: {$currentUser.name}, Address: {$currentUser.address}</p>
			</div>
			<div>
				<h2 class="mt-4 text-lg font-bold">All Users</h2>
				{#if $users.length > 0}
					<ul>
						{#each $users as user}
							<li>Name: {user.name}, Address: {user.address}</li>
						{/each}
					</ul>
				{:else}
					<p>No users available.</p>
				{/if}
			</div>
		</div>
	{:else}
		<div>
			<button
				class="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
				on:click={loginWithMetamask}
			>
				Login with MetaMask
			</button>
		</div>
	{/if}
</main>
