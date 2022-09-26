# Qwik Partytown 🎉

<img width="838" alt="Partytown github fit 2x" src="https://i.imgur.com/p0877Qs.png">

[![Build and Test](https://github.com/leifermendez/partytown-qwik/actions/workflows/build.yml/badge.svg)](https://github.com/leifermendez/partytown-qwik/actions/workflows/build.yml)

This is a package that facilitates the implementation of PartyTown in Qwik. If you don't know what Qwik is (See)

The implementation is easy, just import and enjoy, if you want to make use of a more advanced configuration you can pass the settings as an argument ([see possible arguments](https://partytown.builder.io/configuration)).

## More Docs / Community

- [Common Services](https://partytown.builder.io/common-services)
- [Others Integrations](https://partytown.builder.io/integrations)
- [Why need PartyTown - Video Spanish](https://youtu.be/ABftIDt6H6g)
- [Partytown Discord](https://discord.gg/bNVSQmPzqy)
- [@QwikDev](https://twitter.com/QwikDev)
- [@Builderio](https://twitter.com/builderio)
- [Local Development](https://github.com/BuilderIO/partytown/blob/main/DEVELOPER.md#local-development)
- [For Plugin Authors / Developers](https://github.com/BuilderIO/partytown/blob/main/DEVELOPER.md#plugin-authors-developers)

> Example Google Analytics

```tsx
import { QwikPartytown } from "partytown-qwik/adapter";

<QwikPartytown forward={["dataLayer.push"]} />;
<script
  async
  type="text/partytown"
  src="https://www.googletagmanager.com/gtag/js?id=G-NHJQPYGYCB"
/>;
```

> Example Facebook Pixel
> [Why proxy? View explanation](https://partytown.builder.io/proxying-requests)

```tsx
const proxyFb = function (url: any) {
  if (url.hostname === "connect.facebook.net") {
    const proxyMap: any = {
      "connect.facebook.net": "your-proxy-reverse.cloudfront.net",
    };
    url.hostname = proxyMap[url.hostname] || url.hostname;
    return url;
  }
  return url;
};

<QwikPartytown resolveUrl={proxyFb} forward={["dataLayer.push", "fbq"]} />;
```
