Note: being a simple demo server, this is not meant to be run in production.
Therefore all instructions are in the context of *running locally in development
only.*

# Usage

Run the server with `yarn start`. This uses `ts-node` to run the TypeScript
entrypoint, and `nodemon` to restart the server whenever TypeScript files in
`src/` are changed.

Or run the server in compiled JS via `yarn prod` and `yarn build --watch` (or
just build the JS with `yarn build`).

Note that the server requires MongoDB (the connection params are currently
hardcoded in `src/server.ts`). Ensure MongoDB is running before starting the
server. On NixOS this can be done by simply adding `services.mongodb.enable =
true;` to your system configuration file.

## Tests

Tests can be run with `yarn test` or `yarn test --watch`.
