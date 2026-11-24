import { json, readSetting } from "../lib/security.js";
import {hasCvAccess} from '../lib/cv-access.js';
import {validGrant} from '../lib/grants.js';
import {cepAuthorized,cepDocument} from '../lib/cep.js';
import {letterAvailability} from '../lib/letters.js';
import {pitchAvailable} from '../lib/pitch.js';

export async function onRequestGet({ request, env }) {
  try {
    const [linkedinUrl, cvFrAvailable, cvEnAvailable, cvProtected, cepAvailable, cepPublic, cepProtected] = await Promise.all([
      readSetting(env.DB, "linkedin_url"),
      readSetting(env.DB, "cv_available"),
      readSetting(env.DB, "cv_en_available"),
      readSetting(env.DB, "cv_access_enabled"),
      readSetting(env.DB, "cep_available"),
      readSetting(env.DB, "cep_public"),
      readSetting(env.DB, "cep_protected")
    ]);
    const frenchAvailable = cvFrAvailable === "true";
    const pitch=await pitchAvailable(env);
    const cepAccess=await cepAuthorized(request,env);
    const document=cepAccess?await cepDocument(env):null;
    const cvUnlocked=await hasCvAccess(request,env);
    const lettersAvailable=cvUnlocked?await letterAvailability(env):{};
    return json({
      linkedinUrl: linkedinUrl || null,
      cvFrAvailable: frenchAvailable,
      cvEnAvailable: cvEnAvailable === "true",
      cvAvailable: frenchAvailable,
      cvProtected: cvProtected === 'true',
      pitchAvailable:pitch,
      cvUnlocked,
      lettersAvailable,
      cepAvailable: cepAvailable === 'true' && Boolean(document),
      cepPublic: cepPublic === 'true' || await validGrant(request,env,'cep'),
      cepProtected: true,
      cepFormat:document?.format||null,
      cepAccessConfigured:Boolean(await readSetting(env.DB,'cv_access_digest'))
    });
  } catch {
    return json({ error: "Configuration unavailable" }, 503);
  }
}
