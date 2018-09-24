# Installing Node in 5 minutes: The Final Guide.

~~If you have shitty internet, it may take a little longer.~~

First, access [Node.js website](https://nodejs.org/) and click the big green "Download" button.

Download finished? Now run the installation. While the installation goes by, grab yourself a coffee or drink some water, then get back at your chair. By now you should have Node.js and NPM (Node's package manager) installed.

Now, lets install [**`n`**](https://github.com/tj/n) to manage (and update) Node versions in seconds on your machine. How to install it? Simply run:

```
npm install -g n
```
*(if you get errors, you probably need administration permissions, try using sudo or equivalent in your OS).*

Easy, right? Now, to update your Node.js version, all you have to do is run `n latest`. And you will have the latest Node.js installed and ready to use in your machine.

To choose which Node.js version you want to use at a given time, run: `n` and choose between the installed versions.


### So, lets recap:

You've installed Node.js via their website for the first time. Then you installed the `n` package, which lets you have multiple Node versions in the same machine, doing version updates with one line command.

Here is what you've just installed at the end of this tutorial:

**Node.js:** The V8 JavaScript Engine which will run your JavaScript code locally. Think of it as a JVM (Java).

**NPM:** Node (JavaScript) package manager. You can think of it as a Maven (Java), Composer (PHP) or Gems (Ruby), but for Node.js.

----

**Updating Node to future versions:** Simply run: `n latest`.

**Switching between installed Node versions:** Run: `n`, then select (with arrow keys) which version you want to use. You can check your current node version by running: `node -v`.

And thats it. Now you've got a minimal environment ready to kick some a*$!
