### Qwik Party Town

Hi everyone!
It is a Alpha version Qwik Party Town adapter
I'm working...

Currently it work fine in my website

I guess the next days add more documentacion and testing and more stuff

Bye Have a nice day ;)

```
import { QwikPartytown } from "partytown-qwik/src/qwik";

  const urlConfig = function (url: any) {
    if (url.hostname === "connect.facebook.net") {
      const proxyMap: any = {
        "connect.facebook.net": "d2gn02yz3528v5.cloudfront.net",
      };
      url.hostname = proxyMap[url.hostname] || url.hostname;
      return url;
    }
    return url;
  };

     <QwikPartytown
        resolveUrl={urlConfig}
        forward={["dataLayer.push", "fbq"]}
      />
```
