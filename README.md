# GoonBoard Configurator
Web interface for [GoonBoard-HE](https://github.com/goonmandu/GoonBoard-HE).

## Local Server (HTTP)
```bash
# install deps
npm install -g http-server

# start server
http-server . -p <port number>

# or, for deployment on a remote server,
http-server . -S -C <SSL cert file> -K <SSL key file> -p <port number>
```
then, on a WebHID-capable browser (e.g. Chrome or Edge), go to `localhost:<port number>`.

## Implemented
1. Keymaps
2. Actuation points
3. Rotary Encoder (knob) keymaps
4. Rapid Trigger toggle
5. Rapid Trigger thresholds
6. SnapTap settings
7. Preset JSON config files

## TODO
1. Maybe implement custom layouts? Currently the layout is hardcoded into `script.js`.
2. Make up my mind on what the SnapTap configs should do (insta-save or buffer then manual save)
3. Load SnapTap settings in preset JSON configs to preview like all other settings