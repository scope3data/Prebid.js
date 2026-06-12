# World Ads ID System

The World Ads ID submodule emits a **World ID** verified-identity credential as a
`world.org` EID. The [World Ads drop-in](https://worldads-signer.scope3.workers.dev/embed.js)
runs the World ID ceremony and stores the result first-party (`_worldads_nf` +
`_worldads_proof`); this submodule reads it and attaches it to the bid request so
an operator can **verify-before-trust** the proof.

## Emitted EID

```json
{
  "source": "world.org",
  "uids": [{
    "id": "<rp-scoped nullifier>",
    "atype": 3,
    "ext": {
      "stype": "other",
      "proof": { "...": "the full World ID verify response (identifier, nullifier, proof, …)" }
    }
  }]
}
```

`uids[0].id` is the nullifier (for matching/dedup); `uids[0].ext.proof` carries the
verifiable credential. A consumer should verify the proof and use the **verified**
nullifier for any frequency/eligibility key, treating `id` as a hint.

## Configuration

No params or storage config — the drop-in owns the storage:

```js
pbjs.setConfig({
  userSync: {
    userIds: [{
      name: 'worldAds'
    }]
  }
});
```

Build with:

```
gulp build --modules=userId,worldAdsIdSystem
```

## Notes

- Requires the [World Ads drop-in](https://worldads-signer.scope3.workers.dev/embed.js)
  on the page to run the verify and store the credential.
- **Production hardening:** `ext.proof` currently carries the raw verify response.
  For an open bidstream it should be a token **sealed/encrypted to the operator's
  key** (only the operator can open it), not the raw proof — large, and broadcasts
  the credential. The raw form is appropriate for a controlled, operator-only path.
