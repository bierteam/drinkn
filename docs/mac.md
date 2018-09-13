# Installing *Git* on a *Mac*

[Open a terminal window](http://www.youtube.com/watch?v=zw7Nd67_aFw).

## Step 1 – Install [*Homebrew*](http://brew.sh/)

> *Homebrew* […] simplifies the installation of software on the Mac OS X operating system.

– [Homebrew – Wikipedia](http://en.wikipedia.org/wiki/Homebrew_%28package_management_software%29)

**Copy & paste the following** into the terminal window and **hit `Return`**.

```shell
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
brew doctor
```

You will be offered to install the *Command Line Developer Tools* from *Apple*. **Confirm by clicking *Install***. After the installation finished, continue installing *Homebrew* by **hitting `Return`** again.

## Step 2 – Install *Git*

**Copy & paste the following** into the terminal window and **hit `Return`**.

```shell
brew install git
```

**You can use *Git* now.**
