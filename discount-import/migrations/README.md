# Migrations

## 001-beers-to-products

Backfills the legacy `beers` collection into `products`.

### Why a new collection rather than an in-place change

`beer` is a *discount observation*, not a beer. It requires `pricing.oldPrice`,
`pricing.newPrice` and `rawValidity`, so a beer at its normal shelf price has no
representation in it at all — which is why "show all beers" could not be built on
it, independently of where the data comes from.

Rather than migrate that schema in place, `products` is written alongside it:

* `beers`, `/api/v1/discounts` and `Discounts.vue` keep working untouched
* rolling back is `db.products.drop()`, with nothing else to undo
* the two can be compared against each other in production before anything is
  removed

The legacy path is deleted in a later change, once the new one has been watched
for a while.

### What it repairs on the way through

The old rows are copied faithfully in shape but not in defects:

| Legacy | Migrated |
| --- | --- |
| `oldPrice: 927.9999999999999` (a float, from `'9.28' * 100`) | `price.base: 928` |
| `literPrice: 3.877…` (euros, next to prices in cents) | `price.literPrice: 388` (cents) |
| `alcoholPercentage: 500` (÷100 again in the view) | `alcoholPercentage: 5` |
| `validity` | `discount.endsAt` |

### Running it

Always dry-run first — it reports what it would write without writing anything:

```bash
node migrations/001-beers-to-products.js --dry-run
```

Then for real. It is idempotent: every write is an upsert keyed on
`{source, sourceId}`, so an interrupted run is fixed by running it again.

```bash
node migrations/001-beers-to-products.js
```

In-cluster, as a one-off Job against the existing image and secret:

```bash
kubectl run beers-to-products \
  --namespace drinkn \
  --restart=Never \
  --image=ghcr.io/bierteam/drinkn/discounts-import:<tag> \
  --overrides='{"spec":{"containers":[{"name":"m","image":"ghcr.io/bierteam/drinkn/discounts-import:<tag>","command":["node","migrations/001-beers-to-products.js"],"envFrom":[{"secretRef":{"name":"drinkn-env"}}]}]}}'
```

### The duplicate check at the end

The run finishes by looking for duplicate `{source, sourceId}` pairs and exits
non-zero if it finds any.

This is not decoration. Mongoose builds the unique index in the background and
**swallows the error when it cannot build it**. A seed containing three duplicate
rows left the collection with no unique index at all and nothing said so — the
upsert key the whole import pipeline depends on was silently unprotected, and the
only visible symptom was duplicate rows in the UI. If the check reports pairs,
resolve them and re-run before treating the migration as done.

Verify afterwards:

```bash
# should list {"source":1,"sourceId":1} as unique
db.products.getIndexes()
```

### Rolling back

```bash
db.products.drop()
```

`beers` is never written to by this script, so nothing else needs undoing.
