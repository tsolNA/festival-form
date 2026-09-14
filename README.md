
https://nelsonatkins.sharepoint.com/:u:/s/TestDocumentationHub/IQCBUFYIOjfBSaPt1-1Llu9lARMEo_9msul2O-zRRzbd3Qg?e=Dg0fX5
# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.15.4 create --template minimal --types ts --add prettier --install npm festival-form
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.


# Code Process 
## Identify call
https://nelsonatkins.sharepoint.com/:u:/s/TestDocumentationHub/IQCBUFYIOjfBSaPt1-1Llu9lARMEo_9msul2O-zRRzbd3Qg?e=Dg0fX5

Use the flowchart to find the correct steps for the flow. If the logic doesn't exist, pseudo code until trying it out. If something doesn't make sense, bug Kendall immediately.
There are some calls that are not optimal. It is ok to find new ones, but document the new flow.

## Pseudo Code
This should identify the call and the body's shape of each call. Testing isn't required at this step, but making sure the logic is followed is key.
Avoid as many if else trees as possible by declaring variables as null toward the top.

## Try the API Call
Test the API call in postman with the docs' body examples. Make sure to create a class in the d.ts file for type safety. 

### Known issues
-The GET functionality for the sveltekit setup is incorrect. Needs to be investigated. 