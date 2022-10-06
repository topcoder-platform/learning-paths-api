# TCA Certificate Sharing

This set of utilities support the ability of our users to share their TCA certificates on social media.

Together, these utilties create an image of each certficate as it's earned and provides a URL to serve
the SSR html that has all the social meta tags assigned.

While social media sharing is the primary use case, these tools could easily be adapted to support any
dynamic SSR content hosting.

It is comprised of 3 different tools:

1. [Certificate Image Generator](./generate-certificate-image/README.md)

2. [Servie SSR Version of Image](./certificate-ssr/README.md)

3. [Regenerate Missing Images](./regenerate-certificate-images/README.md)

The sequence diagram below explains both the process of creating images and the process for sharing the certificates themselves on social media.

![TCA Certificate Social Sharing ](docs/TCASocialSharing.png?raw=true "TCA Certificate Social Sharing")

>**NOTE:** This diagram was generated using [https://sequencediagram.org](https://sequencediagram.org) with the source located at `./docs/TCASocialSharing.txt`.
