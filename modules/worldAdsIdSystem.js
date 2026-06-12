/**
 * This module adds World Ads (World ID verified identity) to the User ID module.
 * It emits the verified World ID credential that the World Ads drop-in stored
 * first-party (after a World ID ceremony) as a `world.org` EID, so it rides the
 * bid request and an operator can verify-before-trust.
 * @module modules/worldAdsIdSystem
 * @requires module:modules/userId
 */
import { submodule } from '../src/hook.js';
import { getStorageManager } from '../src/storageManager.js';
import { MODULE_TYPE_UID } from '../src/activities/modules.js';

const MODULE_NAME = 'worldAds';
const EID_SOURCE = 'world.org';
// Keys written first-party by the World Ads drop-in (embed.js) after a verify:
// the RP-scoped nullifier, and the full World ID verify response (the proof).
const NULLIFIER_KEY = '_worldads_nf';
const PROOF_KEY = '_worldads_proof';

export const storage = getStorageManager({ moduleType: MODULE_TYPE_UID, moduleName: MODULE_NAME });

function readNullifier() {
  let v;
  try { v = storage.getDataFromLocalStorage(NULLIFIER_KEY); } catch (e) {}
  if (!v) {
    try { v = storage.getCookie(NULLIFIER_KEY); } catch (e) {}
  }
  return v || null;
}

function readProof() {
  try {
    const s = storage.getDataFromLocalStorage(PROOF_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

/** @type {Submodule} */
export const worldAdsIdSubmodule = {
  name: MODULE_NAME,

  /**
   * @param {{nullifier: string, proof: ?object}} value
   * @returns {{worldAds: {nullifier: string, proof: ?object}}|undefined}
   */
  decode(value) {
    return value && value.nullifier ? { [MODULE_NAME]: value } : undefined;
  },

  /**
   * Read the verified World ID credential the drop-in stored first-party.
   * No params/storage config needed — the drop-in owns the storage.
   * @returns {{id: {nullifier: string, proof: ?object}}|undefined}
   */
  getId() {
    const nullifier = readNullifier();
    if (!nullifier) return undefined;
    return { id: { nullifier, proof: readProof() } };
  },

  eids: {
    [MODULE_NAME]: {
      source: EID_SOURCE,
      atype: 3,
      getValue(data) {
        return data.nullifier;
      },
      getUidExt(data) {
        const ext = { stype: 'other' };
        // Carry the full verify response so an operator can verify-before-trust,
        // rather than trust a bare nullifier. (Production: this should be a sealed
        // token rather than the raw proof; see worldAdsIdSystem.md.)
        if (data.proof) ext.proof = data.proof;
        return ext;
      },
    },
  },
};

submodule('userId', worldAdsIdSubmodule);
