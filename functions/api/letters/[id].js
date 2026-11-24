import {serveLetter} from '../../lib/letters.js';
export const onRequestGet=({request,env,params})=>serveLetter(request,env,params.id);
export const onRequestHead=onRequestGet;
