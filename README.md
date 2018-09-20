Note: being a simple demo server, this is not meant to be run in production.
Therefore all instructions are in the context of *running locally in development
only.*

# Usage

Run the server with `yarn start`. This uses `ts-node` to run the TypeScript
entrypoint, and `nodemon` to restart the server whenever TypeScript files in
`src/` are changed.

Or run the server in compiled JS via `yarn prod` and `yarn build --watch` (or
just build the JS with `yarn build`).
