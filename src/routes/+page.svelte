<script lang='ts'>
	import { enhance } from '$app/forms';
	import { errorMessage } from '$lib/stores';
  import { onMount } from 'svelte';
  // declares the packaged event parameters
  interface Event {
    name: string;
    perfNum: number;
  }
  let { data } = $props(); 
  let firstName = $state('Test');
  let lastName = $state('McTesty');
  let email = $state('tmctesty@nelson-atkins.org');
  let ticketAmount = $state(2);
  let tempUpdate = $state({})
  let tempNightShift = $state({})
  // consent is handled directly in the form
  let errors = $state({
    firstName: '',
    lastName: '',
    email: '',
    ticketAmount: ''
  });
  let adminCheck = $state(false)
  let adminPass = $state('')
  let selectedOption: any = $derived(data["data"]["data"])
  const nameRegex = /^[a-zA-ZÀ-ÿ' -]{2,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Sets the event object to local storage
  function setEvent(event: Event) {
    let string =  JSON.stringify(event)
    localStorage.setItem('event', string)
  }
  $inspect(selectedOption)
  // Validations are based on the Tessitura requirements
  async function reloadPerformanceOptions() {
    let reload:TessPerformanceResponse = await fetch('/api/test', { method: 'POST' })
    if (!reload) {
      alert("no performances found")
      return
    }
    tempUpdate = reload["data"]
  }
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
      // call to server.ts
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
    if (localStorage.getItem('event')) {
		  selectedOption = JSON.parse(localStorage.getItem('event')) ?? ''
    }
    // console.log(JSON.stringify(localStorage.getItem('event')))
	});
</script>
<div class="fadein page-container">
  {#if (adminCheck)}
    <div class="page-container">
      <input type="pin" bind:value={adminPass}>
    </div>
  {:else if (selectedOption && Object.keys(selectedOption).length == 0)}
  <!-- Keep the select option, make user validate -->
    <div class="page-container">
      <button onclick={() => reloadPerformanceOptions()}>
        Trigger Server
      </button>
      {#if Object.keys(tempUpdate).length === 0}
        <div>
          <button>
            <p>{tempUpdate?.Name ?? 'No Performance Found'}</p>
            <p>{tempUpdate?.Date ?? ""}</p>
          </button>
        </div>
      {/if}
      {#if Object.keys(tempNightShift).length === 0}
        <div>
          <button>
            <p>{tempNightShift?.Name ?? 'No Performance Found'}</p>
            <p>{tempNightShift?.Date ?? ""}</p>
          </button>
        </div>
      {/if}
      
    </div>
  {:else}
    <div class="page-container">
      <div id="admin">
        <div>
          <p>{selectedOption?.Name ?? 'No Performance Found'}</p>
          <p>{selectedOption?.Date ?? ""}</p>
        </div>
        <button onclick={() => adminCheck = true}>Admin</button>
      </div>
      <form method="POST"
        use:enhance={({ formData }) => {
          // Append extra client-side data to formData
          formData.append('performanceId', selectedOption['PerformanceId']);
          formData.append('zoneId', selectedOption['ZoneId']);
          formData.append('priceTypeId', selectedOption['PriceTypeId']);
          formData.append('ticketDesignId', selectedOption['TicketDesignId']);
        }}
      >
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
  #admin {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: row;
    justify-content: end;
    align-items: center;
    gap: 15px;
    & p {
      font-size: .7em;
      margin: 0;
      height: unset;
    }
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