
# Purpose
This project is intended for Nelson-Atkins festival attendance. This includes Night/Shift, Deaf Cultural Festival, and many other holiday based events. To put it simply, guests will use this form in lieu of the kiosks to save time, then head to the info desk for wristbands. The form can:
--Validate inputs
--Create/Lookup constituents
--Lookup performances
--Create/update contact permissions
--Create and seat orders
--Seat tickets

For a detailed look at the general flow, refer to this document:

https://nelsonatkins.sharepoint.com/:u:/s/TestDocumentationHub/IQCBUFYIOjfBSaPt1-1Llu9lARMEo_9msul2O-zRRzbd3Qg?e=Dg0fX5

While this provides a good overview, certain specifics were changed in the development of this project. I have no memory of what those changes were, and at this point they are lost to time and my reluctance to perform an autopsy. 

# Code Structure

The idea behind the architecture was to provide basic tools to continue development of this form if needed. API calls are handled by apiRequest(). If the call fails, the function returns null. This is because there seems to be no need in being verbose with errors. That being said, all failures are logged with time stamps and a general trail of information to follow if required (static/output.txt). The top level +page.svelte handles the form and small utilities like a form reset and a visual response to the form submission result. In the event of an error, a user will need to enter an admin password (1933) to clear the error for another submission. In the event the performance information is incorrect, the page simply needs a refresh to perform another search for performances. This will automatically change the event to be either an event specific to the day (i.e. Night/Shift) or default to the Museum Admission for the day. The display will show the Description of Museum Admission, not the ShortName, so users will more easily identify the event associated with the form.

## Orchestrator.ts

Sets the form for the backend to consume and calls the functions in order. In the event of a failure, the functions called already have a failure response and simply need to be returned.

## Permissions.ts

In the event of failures, permissions are not to interrupt the rest of the flow and only log errors. In Tessitura, permissions are only required if a user does not consent to receiving emails, or if the previously did not want emails and changed their preference to now receive them.

## Constituent.ts

This does the initial call to either create or find a constituent and returns a constituentId. In the event of a "do not sell" the failure will return "DNS issue" to obfuscate the error to the guest. GSO's should follow normal procedures under the "do not sell" guidelines.

## Seat.ts

This creates the actual seat for a guest to be marked down for attendance. The logic for the flow if very linear and any failure stops the process with logs. While this does not print wristbands, it still performs the call to assist other API calls.

## Performance.ts

This finds the performance and provides:
    PriceTypeId
    ZoneId
    TicketDesignId
    PerformanceId
    Name
    Date
The process to attach it to the form happens automatically on +page.svelte when the page loads. To simplify user experience, this is not something that requires input from a user. If the date is incorrect or the performance is incorrect, most likely it is an issue with Tessitura itself and data available. 

## api.ts

Provides utilities for easy use. 
--apiRequest() simplifies the try/catch around every call. Returns null on failure and the null is checked on each call to provide a contextual error.
--internalResponse() formalizes the structure of errors and data passing. While not incredibly fleshed out with types of successful responses, it gets the job done generally.
--keepALog() streamlines the process of logging the errors. In some cases, it is called outside of apiRequest() if we are ok continuing the flow but want a record of an issue.

## +page.svelte

The only frontend portion of the project. For the most part, this is full of form logic with a small amount of data handling. On success, a check with appear for a brief moment to signify the flow completed without issue. On error, an X appears with a message about the error and requires a user to input a password (1933) to resolve the error. If the error does not result in a second attempt at submission, users can click the "clear form" option in the top right to allow another guest to enter their information. 