# Hysbysu

> A bot that will watch for any updates on my uni LMS.

## Why does this bot exist?

My uni use an LMS to give materials, submit assignments, etc. It's not perfect, but it works for the most part. Here's the dumb thing that I found, it has a notification feature but it never sends any notification whenever there is something new, like, why?? So, at one point, I did my assignment, but because there was no submission form until a few days later, I kinda forgot about it. Because there was no notification, I didn't know if the submission form was posted. Guess what, I didn't submit it because it was already overdue by the time I realised it.

## How does it work?

Basically it watches the LMS periodically. By default, it will visit the LMS every hour and check if there is a new update or not. If there isn't, it will save the current snapshot of the courses in form of JSON collected by [cheerio](https://cheerio.js.org/) and save it. An hour later, it will do the same thing and compare the current snapshot with the past (1 hour ago) snapshot. If there is something different, it will send a notification.

I was playing around with the presentation format so, I made 3 different presenters: [DummyPresenter](./src/presentation/DummyPresenter.ts) which uses the console to log the update, [TelegramPresenter](./src/presentation/TelegramPresenter.ts) which uses Telegram to send the notification, and [DiscordPresenter](./src/presentation/DiscordPresenter.ts) which uses Discord to send the notification.

You can see this flowchart to better visualise how it works:
<p align="center">
	<img width="400px" src="./.github/pics/flow.png" />
</p>

## How to use?
Unless you can figure it out by yourself, or you're one of my friend in uni, I'm not gonna tell you :p

I don't feel like giving usage instruction for this app to random people on Github.

## Why the name?
Idk, I picked it randomly, also, it sounds badass. It means 'notify' in welsh

## Tech stack

-   [NodeJS](https://nodejs.org/)
-   [Typescript](https://www.typescriptlang.org/)
-   [Puppeteer](https://pptr.dev/)
-   [Cheerio](https://cheerio.js.org/)
-   [deep-diff](https://www.npmjs.com/package/deep-diff)
-   [grammy](https://grammy.dev/)
-   [discord.js](https://discord.js.org/)
