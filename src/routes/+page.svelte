<script lang='ts'>
	import { applyAction, enhance } from '$app/forms';
	import { fade, fly } from 'svelte/transition';
  // declares the packaged event parameters
  interface Event {
    name: string;
    perfNum: number;
    Date: string
  }
  let { data } = $props(); 
  let firstName = $state('Test');
  let lastName = $state('McTesty');
  let email = $state('tmctesty@nelson-atkins.org');
  let ticketAmount = $state(1);
  let formLoading = $state(false)
  let newForm = $state(false)
  // consent is handled directly in the form
  let errors = $state({
    firstName: '',
    lastName: '',
    email: '',
    ticketAmount: ''
  });
  let formResponse = $state({
    formSubmitted: false,
    ok: true,
    textContext: ""
  })
  let adminPass = $state('')
  let selectedOption: any = $derived(data["data"]["data"])
  const nameRegex = /^[a-zA-ZÀ-ÿ'` -]{2,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Sets the event object to local storage
  function triggerAdmin() {
    adminPass = ''
    newForm = false
    setTimeout(() => {
      formResponse.ok = true
    }, 1000);
  }
  function resetForm() {
    firstName = ''
    lastName = ''
    email = ''
    ticketAmount = 1
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
    errors.ticketAmount !== '' || 
    !data.data.ok ||
    !formResponse.ok
  );
  $effect(() =>  {
    if (adminPass == '1933') {
      // call to server.ts
      triggerAdmin()
    }
  })
</script>
<div class="fadein page-container">
    <div class="page-container">
    <div></div>
      <div id="admin">
        <div>
          <p>{selectedOption?.Name ?? "No performance found"}</p>
          <p>{selectedOption?.Date ?? ""}</p>
        </div>
      </div>
      
      <form method="POST"
        use:enhance={({ formData }) => {
          // Append extra client-side data to formData
          formData.append('performanceId', selectedOption['PerformanceId']);
          formData.append('zoneId', selectedOption['ZoneId']);
          formData.append('priceTypeId', selectedOption['PriceTypeId']);
          formData.append('ticketDesignId', selectedOption['TicketDesignId']);
          formLoading = true
          newForm = true

          return async ({ result, update }) => {
            formResponse = result.data
            formLoading = false
            
            await applyAction(result); // This keeps it client-side without reloads
            if (result.data.ok) {
              console.log("here")
              setTimeout(() => {
                newForm = false
              }, 1500);
            }
          };
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
            <input checked style="height: 50px; width: 50px;" id="consent" name="consent" type="checkbox">
            <label for="consent" style="margin-bottom: 0;"> Would you like to receive emails from the Nelson-Atkins Museum of Art (we never share or sell this data)?</label>
        </div>
        <br />
        <button id="submit-button" type="submit" disabled={hasErrors}>
          Submit
        </button>
      </form>
      <div class="api-info">
        {#if (formLoading)}
          <div class="api-sub">
            <div in:fade out:fade={{duration: 100}} class="loader"></div>
          </div>
        {:else if (newForm)}
          <!-- {#if (hasErrors || adminCheck)} -->
          <div class="api-sub result" transition:fade={{delay: 200}}>
            {#if (!hasErrors)}
              <svg class="checkmark" viewBox="0 0 100 100">
                <path d="M15 52 L40 77 L85 25" />
              </svg>
            {:else} 
              <svg class="xmark" viewBox="0 0 100 100">
                <path d="M20 20 L80 80 M80 20 L20 80" />
              </svg>
            {/if}
            <p>{data.data?.textContext}</p>
            <p>{formResponse?.textContext}</p>
            {#if (!formResponse.ok)}
              <input in:fade type="pin" bind:value={adminPass}>
            {/if}
          </div>
          
        {/if}
        
      </div>
    </div>
</div>
<style>

  svg {
    width: 100px;
    height: 100px;
    fill: none;
    stroke: currentColor;
    stroke-width: 30;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .checkmark {
    color: green;
  }
  .xmark {
    color: red;
  }
  .loader {
    border: 16px solid #f3f3f3; /* Light grey */
    border-top: 16px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 120px;
    height: 120px;
    animation: spin 1s linear infinite;
    flex-shrink: 0;
    flex: unset;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
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
  .api-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .result {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
  }
  .api-sub {
    position: absolute;
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
    flex-direction: row;
    justify-content: center;
    align-items: center;
    & div {
      flex: 1;
    }
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