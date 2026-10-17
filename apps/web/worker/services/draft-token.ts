import { z } from 'zod';
import { Extraction } from 'core';
import type { ExtractionData } from 'core';
import { base64url,unbase64 } from './crypto';
import { ApiError } from './errors';
const LOCAL_SECRET=base64url(crypto.getRandomValues(new Uint8Array(32)));
const payloadSchema=z.object({v:z.literal(1),exp:z.number(),text:z.string(),extraction:Extraction});
async function key(secret?:string){return crypto.subtle.importKey('raw',new TextEncoder().encode(secret||LOCAL_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
export async function signDraft(text:string,extraction:ExtractionData,secret?:string,now=Date.now()):Promise<string>{const data=new TextEncoder().encode(JSON.stringify({v:1,exp:now+900000,text,extraction}));const signature=await crypto.subtle.sign('HMAC',await key(secret),data);return `${base64url(data)}.${base64url(new Uint8Array(signature))}`;}
export async function verifyDraft(token:string,secret?:string,now=Date.now()) {try{const [payload,signature,...extra]=token.split('.');if(!payload||!signature||extra.length)throw new Error('shape');const data=unbase64(payload);if(!await crypto.subtle.verify('HMAC',await key(secret),unbase64(signature),data))throw new Error('signature');const value=payloadSchema.parse(JSON.parse(new TextDecoder().decode(data)));if(value.exp<=now)throw new Error('expiry');return value;}catch{throw new ApiError(422,'invalid_draft','This report expired. Submit it again.');}}
