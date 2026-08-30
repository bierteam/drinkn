# scripts

Local utilities you run by hand. These are **not** part of the CronJob and are
not copied into the runtime image.

## lidl-selfscan.js — base prices from your own Lidl

Lidl does not publish standing shelf prices anywhere public (the website has
offers only, and the app's self-scan master is behind a personal Lidl Plus
login). This pulls the self-scan store master for *one* store and writes its
beer as base-price rows into the `products` collection.

It is a hand-run tool on purpose. The endpoint authenticates with your personal
account, and putting personal credentials in the cluster to run unattended is
exactly the standing, attributable access the endpoint is gated against. So this
runs from your machine, when you want it -- realistically once a month, since
shelf prices barely move.

### Getting a token

You do this step; the script never sees your password. Use a Lidl Plus login
tool (e.g. the `lidl-plus` Python package) to obtain a bearer token for your
account, then:

```bash
export LIDL_TOKEN='...'      # your terminal only; never commit it
export LIDL_STORE='NL0405'   # your store id, from the app
```

The token is read from the environment, never from an argument, so it stays out
of your shell history. `lidl.json` and `.lidl.env` are gitignored.

### Running it

Dry run first -- fetches (or reads a saved dump) and prints, writing nothing:

```bash
node scripts/lidl-selfscan.js --store NL0405            # fetch with $LIDL_TOKEN
node scripts/lidl-selfscan.js --file lidl.json          # or a saved dump
```

Then upsert into the database:

```bash
node scripts/lidl-selfscan.js --file lidl.json --store NL0405 --write
```

`--write` needs the same DB_* env the importer uses. The upsert keys on
`{source: 'lidl-selfscan', sourceId}`, so re-running is safe and only records a
price observation when a price actually changed.

### What you get, and what you don't

Rows land as `source: 'lidl-selfscan'`, `isDiscounted: false` -- real standing
prices, next to AH's in "All beers". Roughly 160 beers from a ~50k-row master.

Honest limits, because the self-scan master is a scanner file, not a catalogue:

* **No volume field.** Pack size comes from the deposit label ("24-pk blik") and
  a can size only when the name states it, so most rows get a pack count but no
  litre price (~30 of 160 do). Same honesty rule as AH's "N stuks".
* **Terse names** ("Heineken pils", "Pils in blik") -- no clean brand/variant
  split.
* **One store.** The master is per branch; this is whatever your store charges.
* **Not truly "base" if an item is on Lidl Plus offer** -- the master reflects
  the current scanner price without saying it is a promotion. Rare for the
  standing own-brand range, worth knowing.
* GTIN is captured (~140 of 160), which is the key that lets these match the
  same beer from AH later.
