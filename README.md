# deno live server

[![JSR](https://jsr.io/badges/@bbcwqx/live-server)](https://jsr.io/@bbcwqx/live-server)

A live server implementation written written in Deno to reload static html pages
when target files change

## run

```bash
deno run --allow-net --allow-read --allow-sys jsr:@bbcwqx/live-server
```

`allow-sys` is optional, it is used to get the local IP address of the machine

## install

```bash
deno install --allow-net --allow-read --allow-sys --global jsr:@bbcwqx/live-server
```

```bash
live-server
# Listening on:
# - Local: http://localhost:8080
# - Network: http://192.168.4.65:8080
```

## usage

```bash
@bbcwqx/live-server 0.2.0
  Serves a local directory reloads browser when files change.

INSTALL:
  deno install --allow-net --allow-read --allow-sys jsr:@bbcwqx/live-server@0.2.0

USAGE:
  live-server [path] [options]

OPTIONS:
  -h, --help            Prints help information
  -p, --port <PORT>     Set port (default is 8000)
  --cors                Enable CORS via the "Access-Control-Allow-Origin" header
  --host     <HOST>     Hostname (default is 0.0.0.0)
  -c, --cert <FILE>     TLS certificate file (enables TLS)
  -k, --key  <FILE>     TLS key file (enables TLS)
  -H, --header <HEADER> Sets a header on every request.
                        (e.g. --header "Cache-Control: no-cache")
                        This option can be specified multiple times.
  --no-dir-listing      Disable directory listing
  --no-dotfiles         Do not show dotfiles
  --no-cors             Disable cross-origin resource sharing
  -v, --verbose         Print request level logs
  -V, --version         Print version information

  All TLS options are required when one is provided.`);
```
