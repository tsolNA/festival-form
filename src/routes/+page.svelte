<script lang='ts'>
	import { errorMessage } from '$lib/stores';
  import { onMount } from 'svelte';
  // declares the packaged event parameters
  interface Event {
    name: string;
    perfNum: number;
  }
  let firstName = $state('');
  let lastName = $state('');
  let email = $state('');
  let ticketAmount = $state('');
  let allEvents: {[key: string]: Event} = $state({})
  let errors = $state({
    firstName: '',
    lastName: '',
    email: '',
    ticketAmount: ''
  });
  let adminCheck = $state(false)
  let adminPass = $state('')
  let selectedOption = $state({})

  const nameRegex = /^[a-zA-ZÀ-ÿ' -]{2,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Sets the event object to local storage
  function setEvent(event: Event) {
    let string =  JSON.stringify(event)
    localStorage.setItem('event', string)
  }
  async function loadOptions() {
    try {
      const res = await fetch("/api/getOptions");

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const data = await res.json();
      for (const event of data) {
        let cleanedTitle = event["tes_perf_title"].replace(/^['"]|['"]$/g, '');
        allEvents[cleanedTitle] = {
          name: cleanedTitle,
          perfNum: event['perf_no'],

        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  // Validations are based on the Tessitura requirements
  function validateFirstName() {
    if (!nameRegex.test(firstName)) {
      errors.firstName = "First names must be at least 2 characters using valid letters/symbols.";
    } else if (/[<>]/.test(firstName)) {
      errors.firstName = "Invalid characters detected.";
    } else {
      errors.firstName = '';
    }
  }

  function validateLastName() {
    if (!nameRegex.test(lastName)) {
      errors.lastName = "Names must be at least 2 characters using valid letters/symbols.";
    } else if (/[<>]/.test(lastName)) {
      errors.lastName = "Invalid characters detected.";
    } else {
      errors.lastName = '';
    }
  }

  function validateEmail() {
    if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address (example@domain.etc)";
    } else {
      errors.email = '';
    }
  }

  function validateTicketAmount() {
    const num = Number(ticketAmount);
    if (!Number.isInteger(num) || num < 1 || num > 10) {
      errors.ticketAmount = "Ticket amount must be between 1 and 10.";
    } else {
      errors.ticketAmount = '';
    }
  }

  let hasErrors = $derived(
    errors.firstName !== '' ||
    errors.lastName !== '' ||
    errors.email !== '' ||
    errors.ticketAmount !== ''
  );

  $effect(() =>  {
    if (adminPass == '1933') {
      loadOptions()
      selectedOption = {}
      adminPass = ''
      adminCheck = false
    }
    
  })
  $effect(() => {
    if (Object.keys(selectedOption).length !== 0) {
      setEvent(selectedOption)
    }
  })
  $effect(() => {
    if ($errorMessage !== '') {
      alert($errorMessage)
    }
  })
  onMount(() => {
		selectedOption = JSON.parse(localStorage.getItem('event')) || {}
    // console.log(JSON.stringify(localStorage.getItem('event')))
	});
</script>
<div class="fadein page-container">
  {#if (adminCheck)}
    <div class="page-container">
      <input type="pin" bind:value={adminPass}>
    </div>
  {:else if (Object.keys(selectedOption).length == 0)}
    <div class="page-container">
      <select name="festival" id="" bind:value={selectedOption}>
        {#each Object.entries(allEvents) as [key, value]}
          <option value={value}>{key}</option>
        {/each}
      </select>
      <button id="refresh" onclick={loadOptions}>Refresh</button>
    </div>
  {:else}
    <div class="page-container">
      <button id="admin" onclick={() => adminCheck = true}>Admin</button>
      <h1>{selectedOption.name}</h1>
      <form method="POST">
        <label>
          First Name:
          <input
            name="firstName"
            type="text"
            bind:value={firstName}
            onblur={validateFirstName}
            oninput={() => {
                if (errors.firstName) validateFirstName()
            }}
            required
          />
            <p class="error">
                {#if errors.firstName}
                        {errors.firstName}
                {/if}
            </p>
        </label>

        <label>
          Last Name:
          <input
            name="lastName"
            type="text"
            bind:value={lastName}
            onblur={validateLastName}
            oninput={() => {
                if (errors.lastName) validateLastName()
            }}
            required
          />
            <p class="error">
                {#if errors.lastName}
                    {errors.lastName}
                {/if}
            </p>
          
        </label>

        <label>
          Email:
          <input
            name="email"
            type="email"
            bind:value={email}
            onblur={validateEmail}
            oninput={() => {
                if (errors.email) validateEmail()
            }}
            required
          />
            <p class="error">
                {#if errors.email}
                    {errors.email}
                {/if}
            </p>
          
        </label>

        <label>
          Ticket Amount:
          <input
            name="ticketAmount"
            type="number"
            bind:value={ticketAmount}
            onblur={validateTicketAmount} //only validate on blur or if an error is already showing
            oninput={() => {
                if (errors.ticketAmount) validateTicketAmount()
            }}
            required
          />
            <p class="error">
                {#if errors.ticketAmount}
                    {errors.ticketAmount}
                {/if}
            </p>
          
        </label>
        <div style="display: flex; justify-content: center; align-items: center; gap: 20px">
            <input style="height: 50px; width: 50px;" id="consent" checked type="checkbox">
            <label for="consent" style="margin-bottom: 0;"> Would you like to receive emails from the Nelson-Atkins Museum of Art (we never share or sell this data)?</label>
        </div>
        <br />
        <button id="submit-button" type="submit" disabled={hasErrors}>
          Submit
        </button>
      </form>
    </div>
  {/if}
</div>
<style>
  @keyframes fadein {
    from {opacity: 0}
    to {opacity: 1}
  }
  #refresh {
    width: 200px;
    position: absolute;
    bottom: 50px;
  }
  #admin {
    position: absolute;
    top: 20px;
    right: 20px;
  }
  h1 {
    margin: 0;
  }
  input {
      height: 40px;
      font-size: 24px;
  }
  #submit-button {
      margin: auto;
      width: 200px;
      height: 40px;
  }
  
  .fadein {
    animation: fadein forwards 1s;
  }
  .page-container {
    font-size: 20px;
    font-family: Avenir;
    height: 100vh;
    width: 100vw;
    margin: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  form {
    width: 500px;
    display: flex;
    flex-direction: column;

    & label {
        margin-bottom: 20px;
    }
  }

  p {
    margin: 0;
    height: 20px;
  }

  .error {
    color: red;
    font-size: 0.9rem;
  }
</style>