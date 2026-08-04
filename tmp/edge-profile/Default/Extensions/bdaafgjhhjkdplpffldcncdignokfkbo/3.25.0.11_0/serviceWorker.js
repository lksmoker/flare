//
// Gen copyright header start
//
// Copyright (c) 2023-2024 Gen Digital Inc. All rights reserved.
//
// THIS SOFTWARE CONTAINS CONFIDENTIAL INFORMATION AND TRADE SECRETS OF GEN DIGITAL
// INC.  USE, DISCLOSURE OR REPRODUCTION IS PROHIBITED WITHOUT THE PRIOR
// EXPRESS WRITTEN PERMISSION OF GEN DIGITAL INC.
//
// The Licensed Software and Documentation are deemed to be commercial computer
// software as defined in FAR 12.212 and subject to restricted rights as defined
// in FAR Section 52.227-19 "Commercial Computer Software - Restricted Rights"
// and DFARS 227.7202, "Rights in Commercial Computer Software or Commercial
// Computer Software Documentation", as applicable, and any successor regulations.
// Any use, modification, reproduction release, performance, display or disclosure
// of the Licensed Software and Documentation by the U.S. Government shall be
// solely in accordance with the terms of this Agreement.
//
// Gen copyright header stop
//
// NSSS
//
//
//
var window = this;
try {
  importScripts(`./content/libs/forge.min.js`);
  importScripts(`./content/libs/uri.min.js`);
  importScripts(`./content/libs/long.min.js`);
  importScripts(`./content/libs/bytebuffer.min.js`);
  importScripts(`./content/libs/protobuf.min.js`);
  importScripts(`./content/libs/jsrsasign-all-min.js`);
  importScripts(`./NSSS.js`);
}catch( error )
{
  console.debug(`ServiceWorker failed to load one of the bg scripts due to , ${error}`);
}
